/**
 * Health check routes
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');
const { getConnection } = require('../config/database');

const startTime = Date.now();

async function getDatabaseHealth() {
  const connection = getConnection();

  // In-memory/test mode: skip DB check
  if (process.env.TEST_FORCE_IN_MEMORY === 'true' || process.env.TEST_FORCE_IN_MEMORY === '1') {
    return { connected: false, healthy: true, message: 'In-memory mode' };
  }

  if (!connection) {
    return { connected: false, healthy: false, message: 'No database connection' };
  }

  try {
    if (connection.query) {
      await connection.query('SELECT 1');
    } else if (connection.readyState !== undefined) {
      // Mongoose connection
      if (connection.readyState !== 1) {
        return { connected: false, healthy: false, message: 'MongoDB not connected' };
      }
    }

    return { connected: true, healthy: true };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return { connected: true, healthy: false, message: error.message };
  }
}

/**
 * Register a handler on multiple paths (supports being mounted at / or /health)
 */
function registerRoute(paths, handler) {
  paths.forEach((path) => router.get(path, handler));
}

/**
 * GET /health
 * Basic health check
 */
registerRoute(['/', '/health'], asyncHandler(async (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const dbHealth = await getDatabaseHealth();
  
  res.status(dbHealth.healthy ? 200 : 503).json({
    status: 'ok',
    uptime: uptime,
    timestamp: new Date().toISOString(),
    database: dbHealth,
  });
}));

/**
 * GET /health/detailed
 * Detailed health check with system information
 */
registerRoute(['/detailed', '/health/detailed'], asyncHandler(async (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();
  const dbHealth = await getDatabaseHealth();
  
  res.status(dbHealth.healthy ? 200 : 503).json({
    status: dbHealth.healthy ? 'ok' : 'degraded',
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
    database: dbHealth,
  });
}));

/**
 * GET /health/metrics
 * Get system metrics
 */
registerRoute(['/metrics', '/health/metrics'], asyncHandler(async (req, res) => {
  const systemMetrics = metrics.getMetrics();
  
  res.json({
    success: true,
    data: systemMetrics,
  });
}));

/**
 * GET /health/live
 * Lightweight liveness probe
 */
registerRoute(['/live', '/health/live'], asyncHandler(async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /health/ready
 * Readiness probe with dependencies
 */
registerRoute(['/ready', '/health/ready'], asyncHandler(async (req, res) => {
  const dbHealth = await getDatabaseHealth();
  const healthy = dbHealth.healthy;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ready' : 'degraded',
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
}));

module.exports = router;
