// Activity logs routes aggregator
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const analyticsRoutes = require('./analytics');
const logger = require('../../../../utils/logger');

const prisma = new PrismaClient();

function buildActivityWhere(query) {
  const where = { archived: false };
  const andClause = [];

  if (query.action) {
    andClause.push({ actionType: { contains: query.action, mode: 'insensitive' } });
  }

  if (query.resource_type) {
    andClause.push({ actionCategory: { contains: query.resource_type, mode: 'insensitive' } });
  }

  if (query.user_id) {
    andClause.push({ adminId: query.user_id });
  }

  if (query.date_from || query.date_to) {
    const range = {};
    if (query.date_from) {
      range.gte = new Date(query.date_from);
    }
    if (query.date_to) {
      const end = new Date(query.date_to);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
    andClause.push({ timestamp: range });
  }

  if (query.search) {
    andClause.push({
      OR: [
        { actionType: { contains: query.search, mode: 'insensitive' } },
        { actionCategory: { contains: query.search, mode: 'insensitive' } },
        { severityLevel: { contains: query.search, mode: 'insensitive' } },
        { logId: { contains: query.search, mode: 'insensitive' } }
      ]
    });
  }

  if (andClause.length > 0) {
    where.AND = andClause;
  }

  return where;
}

function serializeActivityLog(log) {
  return {
    id: log.id,
    log_id: log.logId,
    action: log.actionType,
    category: log.actionCategory,
    severity: log.severityLevel,
    timestamp: log.timestamp,
    actor: log.actor,
    target: log.target,
    details: log.actionDetails,
    technicalContext: log.technicalContext,
    admin: log.admin ? {
      id: log.admin.id,
      username: log.admin.username,
      email: log.admin.email
    } : null
  };
}

// GET /api/admin/activity-logs - List activities with filtering
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.per_page || '50', 10), 1), 200);
    const skip = (page - 1) * limit;

    const where = buildActivityWhere(req.query);

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: { admin: true }
      }),
      prisma.activityLog.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: logs.map(serializeActivityLog),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    res.status(500).json({
      error: 'Failed to fetch activity logs',
      message: error.message
    });
  }
});

router.use('/analytics', analyticsRoutes);

// GET /api/admin/activity-logs/:id - Activity detail
router.get('/:id', async (req, res) => {
  try {
    const log = await prisma.activityLog.findUnique({
      where: { id: req.params.id },
      include: {
        admin: true,
        gmailAccessLogs: true
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    res.status(200).json({
      success: true,
      data: serializeActivityLog(log)
    });
  } catch (error) {
    logger.error('Error fetching activity log detail:', error);
    res.status(500).json({
      error: 'Failed to fetch activity log detail',
      message: error.message
    });
  }
});

// POST /api/admin/activity-logs/export - Export activities
router.post('/export', async (req, res) => {
  try {
    const where = buildActivityWhere(req.query || {});
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: { admin: true }
    });

    const header = 'timestamp,action,category,severity,admin_email,target,details\n';
    const rows = logs.map((log) => {
      const targetSummary = log.target?.resource || log.target?.type || '';
      const detailSummary = log.actionDetails?.description || log.actionDetails?.summary || '';
      return [
        new Date(log.timestamp).toISOString(),
        JSON.stringify(log.actionType),
        JSON.stringify(log.actionCategory),
        JSON.stringify(log.severityLevel),
        JSON.stringify(log.admin?.email || ''),
        JSON.stringify(targetSummary),
        JSON.stringify(detailSummary)
      ].join(',');
    });

    const csvContent = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    logger.error('Error exporting activity logs:', error);
    res.status(500).json({
      error: 'Failed to export activity logs',
      message: error.message
    });
  }
});

module.exports = router;

