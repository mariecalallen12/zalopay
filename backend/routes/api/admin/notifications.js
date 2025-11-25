// Admin notifications API endpoints
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

/**
 * GET /api/admin/notifications/count
 * Get unread notification count
 */
router.get('/count', async (req, res) => {
  try {
    // For now, return 0 as we don't have a notifications table yet
    // In production, query unread notifications count from database
    const count = 0;

    res.json({
      count
    });
  } catch (error) {
    logger.error('Error fetching notification count:', error);
    res.status(500).json({
      error: 'Failed to fetch notification count',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/notifications
 * Get notifications list
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // For now, return empty array
    // In production, query from notifications table
    const notifications = [];

    res.json({
      notifications,
      total: notifications.length
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

module.exports = router;

