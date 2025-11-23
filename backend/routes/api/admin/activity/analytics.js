// GET /api/admin/activity-logs/analytics - Activity analytics
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const logger = require('../../../../utils/logger');

const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    const where = { archived: false };
    if (date_from || date_to) {
      const range = {};
      if (date_from) {
        range.gte = new Date(date_from);
      }
      if (date_to) {
        const end = new Date(date_to);
        end.setHours(23, 59, 59, 999);
        range.lte = end;
      }
      where.timestamp = range;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTimestampRange = {
      ...(where.timestamp || {}),
      gte: date_from ? new Date(date_from) : startOfToday,
    };
    if (date_to) {
      const end = new Date(date_to);
      end.setHours(23, 59, 59, 999);
      todayTimestampRange.lte = end;
    }

    const [totalActivities, todayActivities, distinctAdmins, topActionGroup] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.count({
        where: {
          ...where,
          timestamp: todayTimestampRange
        }
      }),
      prisma.activityLog.findMany({
        where: { ...where, adminId: { not: null } },
        distinct: ['adminId'],
        select: { adminId: true }
      }),
      prisma.activityLog.groupBy({
        by: ['actionType'],
        where,
        _count: { actionType: true },
        orderBy: { _count: { actionType: 'desc' } },
        take: 1
      })
    ]);

    res.status(200).json({
      success: true,
      total_activities: totalActivities,
      today_activities: todayActivities,
      active_users: distinctAdmins.length,
      top_action: topActionGroup[0]?.actionType || null
    });
  } catch (error) {
    logger.error('Error fetching activity analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch activity analytics',
      message: error.message
    });
  }
});

module.exports = router;

