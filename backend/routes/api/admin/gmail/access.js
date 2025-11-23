// GET /api/admin/gmail/access/:session_id - Get session status
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');

const GmailAccessLogRepository = require('../../../../repositories/gmailAccessLogRepository');
const logger = require('../../../../utils/logger');

const prisma = new PrismaClient();
const gmailAccessLogRepository = new GmailAccessLogRepository(prisma);

router.get('/', async (req, res) => {
  try {
    const { session_id } = req.params;

    const gmailAccessLog = await gmailAccessLogRepository.findBySessionId(session_id);
    if (!gmailAccessLog) {
      return res.status(404).json({ error: 'Gmail access session not found' });
    }

    res.status(200).json({
      success: true,
      sessionId: session_id,
      status: gmailAccessLog.status,
      accessMethod: gmailAccessLog.accessMethod,
      sessionTimeline: gmailAccessLog.sessionTimeline || [],
      createdAt: gmailAccessLog.createdAt,
      completedAt: gmailAccessLog.completedAt,
      victim: gmailAccessLog.victim ? {
        id: gmailAccessLog.victim.id,
        email: gmailAccessLog.victim.email
      } : null
    });
  } catch (error) {
    logger.error('Error fetching Gmail session status:', error);
    res.status(500).json({
      error: 'Failed to fetch session status',
      message: error.message
    });
  }
});

module.exports = router;

