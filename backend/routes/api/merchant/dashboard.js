// Merchant dashboard API endpoints
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

/**
 * GET /api/merchant/dashboard/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get victim_id from query or session (in production, use proper authentication)
    const victimId = req.query.victim_id;

    const txWhere = victimId ? { victimId } : {};
    const [{ _sum, _count }, activeQRCodes] = await Promise.all([
      prisma.qrTransaction.aggregate({
        where: txWhere,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.qrCode.count({
        where: { ...txWhere, status: 'active' },
      }),
    ]);

    const stats = {
      totalRevenue: _sum.amount || 0,
      totalTransactions: _count._all || 0,
      activeQRCodes,
      totalCustomers: _count._all || 0
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/merchant/dashboard/recent-transactions
 * Get recent transactions
 */
router.get('/recent-transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const victimId = req.query.victim_id;

    const where = victimId ? { victimId } : {};
    const transactions = await prisma.qrTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({
      transactions,
      total: transactions.length
    });
  } catch (error) {
    logger.error('Error fetching recent transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch recent transactions',
      message: error.message
    });
  }
});

/**
 * GET /api/merchant/dashboard/revenue-chart
 * Get revenue chart data
 */
router.get('/revenue-chart', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const victimId = req.query.victim_id;

    // Generate date labels
    const labels = [];
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      labels.push(date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }));
      data.push(0);
    }

    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const where = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };
    if (victimId) where.victimId = victimId;

    const transactions = await prisma.qrTransaction.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const msPerDay = 24 * 60 * 60 * 1000;
    transactions.forEach(tx => {
      const dayIndex = Math.floor((new Date(tx.createdAt) - start) / msPerDay);
      if (dayIndex >= 0 && dayIndex < days) {
        data[dayIndex] += tx.amount || 0;
      }
    });

    res.json({
      labels,
      data
    });
  } catch (error) {
    logger.error('Error fetching revenue chart data:', error);
    res.status(500).json({
      error: 'Failed to fetch revenue chart data',
      message: error.message
    });
  }
});

module.exports = router;
