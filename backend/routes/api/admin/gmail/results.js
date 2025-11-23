// GET /api/admin/gmail/access/:session_id/results - Get extraction results
// POST /api/admin/gmail/access/:session_id/results/export - Export data
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
      extractionResults: gmailAccessLog.extractionResults || {},
      sessionTimeline: gmailAccessLog.sessionTimeline || [],
      createdAt: gmailAccessLog.createdAt,
      completedAt: gmailAccessLog.completedAt
    });
  } catch (error) {
    logger.error('Error fetching Gmail extraction results:', error);
    res.status(500).json({
      error: 'Failed to fetch extraction results',
      message: error.message
    });
  }
});

router.post('/export', async (req, res) => {
  try {
    const { session_id } = req.params;
    const { format = 'json' } = req.body;

    const gmailAccessLog = await gmailAccessLogRepository.findBySessionId(session_id);
    if (!gmailAccessLog) {
      return res.status(404).json({ error: 'Gmail access session not found' });
    }

    if (gmailAccessLog.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Extraction not completed yet',
        status: gmailAccessLog.status
      });
    }

    // Export data based on format
    if (format === 'json') {
      res.status(200).json({
        success: true,
        sessionId: session_id,
        data: gmailAccessLog.extractionResults,
        exportedAt: new Date().toISOString()
      });
    } else if (format === 'csv') {
      // Simple CSV export for emails
      const emails = gmailAccessLog.extractionResults?.emails || [];
      const csvHeader = 'Subject,From,To,Date\n';
      const csvRows = emails.map(email => 
        `"${(email.subject || '').replace(/"/g, '""')}","${(email.from || '').replace(/"/g, '""')}","${(email.to || '').replace(/"/g, '""')}","${email.date || ''}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="gmail-export-${session_id}.csv"`);
      res.status(200).send(csvHeader + csvRows);
    } else {
      res.status(400).json({ error: 'Unsupported export format. Use "json" or "csv"' });
    }
  } catch (error) {
    logger.error('Error exporting Gmail data:', error);
    res.status(500).json({
      error: 'Failed to export Gmail data',
      message: error.message
    });
  }
});

module.exports = router;

