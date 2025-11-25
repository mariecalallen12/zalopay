// Merchant reports API endpoints
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

/**
 * GET /api/merchant/reports
 * Get report data for specified period
 */
router.get('/', async (req, res) => {
  try {
    const period = req.query.period || '7d';
    const days = parseInt(req.query.days) || 7;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const victimId = req.query.victim_id;

    // Calculate actual days if custom date range
    let actualDays = days;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      actualDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Generate empty data structure
    const current = {
      revenue: Array(actualDays).fill(0),
      transactions: Array(actualDays).fill(0),
      customers: Array(actualDays).fill(0),
      paymentMethods: {
        'ZaloPay': 0,
        'Momo': 0,
        'Bank Transfer': 0,
        'Credit Card': 0
      },
      peakHours: Array(24).fill(0),
      qrCodes: [],
      detailed: {
        total: 0,
        success: 0,
        failed: 0,
        pending: 0
      },
      topCustomers: [],
      weeklyAnalysis: Array(7).fill(0)
    };

    const previous = {
      revenue: Array(actualDays).fill(0),
      transactions: Array(actualDays).fill(0),
      customers: Array(actualDays).fill(0)
    };

    const comparison = {
      revenue: 0,
      transactions: 0,
      customers: 0,
      avgValue: 0
    };

    // Build date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - (actualDays - 1) * 24 * 60 * 60 * 1000);

    const dateRange = {
      gte: start,
      lte: end
    };

    const where = { createdAt: dateRange };
    if (victimId) where.victimId = victimId;

    // Fetch transactions
    const transactions = await prisma.qrTransaction.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });

    // Prepare helper maps
    const qrAggregation = new Map();
    const methodCounts = { ...current.paymentMethods };

    const msPerDay = 24 * 60 * 60 * 1000;

    transactions.forEach(tx => {
      const txDate = new Date(tx.createdAt);
      const dayIndex = Math.floor((txDate - start) / msPerDay);
      if (dayIndex >= 0 && dayIndex < actualDays) {
        current.revenue[dayIndex] += tx.amount || 0;
        current.transactions[dayIndex] += 1;
        current.customers[dayIndex] += 1;
      }

      const methodKey = tx.method || 'ZaloPay';
      methodCounts[methodKey] = (methodCounts[methodKey] || 0) + 1;

      const hour = txDate.getHours();
      current.peakHours[hour] = (current.peakHours[hour] || 0) + 1;

      current.detailed.total += 1;
      if (tx.status === 'success') current.detailed.success += 1;
      else if (tx.status === 'failed') current.detailed.failed += 1;
      else current.detailed.pending += 1;

      const weekday = txDate.getDay();
      current.weeklyAnalysis[weekday] = (current.weeklyAnalysis[weekday] || 0) + (tx.amount || 0);

      // Aggregate per QR code
      const qrCodeId = tx.qrCodeId;
      if (qrCodeId) {
        const aggregated = qrAggregation.get(qrCodeId) || { id: qrCodeId, total: 0, amount: 0 };
        aggregated.total += 1;
        aggregated.amount += tx.amount || 0;
        qrAggregation.set(qrCodeId, aggregated);
      }
    });

    current.paymentMethods = methodCounts;
    current.qrCodes = Array.from(qrAggregation.values()).map(item => ({
      id: item.id,
      totalTransactions: item.total,
      totalAmount: item.amount,
    }));

    // Previous period range
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - (actualDays - 1) * msPerDay);
    const prevWhere = {
      createdAt: {
        gte: prevStart,
        lte: prevEnd,
      },
    };
    if (victimId) prevWhere.victimId = victimId;

    const previousTx = await prisma.qrTransaction.findMany({
      where: prevWhere,
      orderBy: { createdAt: 'asc' }
    });

    previousTx.forEach(tx => {
      const txDate = new Date(tx.createdAt);
      const dayIndex = Math.floor((txDate - prevStart) / msPerDay);
      if (dayIndex >= 0 && dayIndex < actualDays) {
        previous.revenue[dayIndex] += tx.amount || 0;
        previous.transactions[dayIndex] += 1;
        previous.customers[dayIndex] += 1;
      }
    });

    // Comparison metrics
    const sum = arr => arr.reduce((acc, val) => acc + (val || 0), 0);
    const totalCurrentRevenue = sum(current.revenue);
    const totalPreviousRevenue = sum(previous.revenue);
    const totalCurrentTx = sum(current.transactions);
    const totalPreviousTx = sum(previous.transactions);
    const totalCurrentCustomers = sum(current.customers);
    const totalPreviousCustomers = sum(previous.customers);

    comparison.revenue = totalCurrentRevenue - totalPreviousRevenue;
    comparison.transactions = totalCurrentTx - totalPreviousTx;
    comparison.customers = totalCurrentCustomers - totalPreviousCustomers;
    comparison.avgValue = totalCurrentTx > 0 ? totalCurrentRevenue / totalCurrentTx : 0;

    res.json({
      current,
      previous,
      comparison
    });
  } catch (error) {
    logger.error('Error fetching report data:', error);
    res.status(500).json({
      error: 'Failed to fetch report data',
      message: error.message
    });
  }
});

module.exports = router;
