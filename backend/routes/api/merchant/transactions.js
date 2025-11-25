// Merchant transactions API endpoints
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

/**
 * GET /api/merchant/transactions
 * Get transactions list with pagination and filters
 */
router.get('/', async (req, res) => {
  try {
    const victimId = req.query.victim_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const method = req.query.method;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    // For now, return empty array
    // In production, query from transactions table with filters
    const transactions = [];
    const total = 0;

    res.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message
    });
  }
});

module.exports = router;

