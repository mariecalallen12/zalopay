/**
 * Health check routes
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
const config = require('../config');
const { getConnection, isConnected } = require('../config/database');

const startTime = Date.now();

/**
 * GET /health
 * Basic health check
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    res.json({
      status: 'ok',
      uptime: uptime,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /health/detailed
 * Detailed health check with system information
 */
router.get(
  '/health/detailed',
  asyncHandler(async (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'ok',
      uptime: uptime,
      timestamp: new Date().toISOString(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      database: {
        connected: isConnected(),
      },
    });
  })
);

/**
 * GET /health/metrics
 * Get system metrics
 */
router.get(
  '/health/metrics',
  asyncHandler(async (req, res) => {
    const systemMetrics = metrics.getMetrics();
    
    res.json({
      success: true,
      data: systemMetrics,
    });
  })
);

module.exports = router;
