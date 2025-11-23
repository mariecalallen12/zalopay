// Campaign management routes aggregator
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const detailRoutes = require('./detail');
const statisticsRoutes = require('./statistics');

// Initialize repositories
const prisma = new PrismaClient();
const CampaignRepository = require('../../../../repositories/campaignRepository');
const VictimRepository = require('../../../../repositories/victimRepository');
const logger = require('../../../../utils/logger');

const campaignRepository = new CampaignRepository(prisma);
const victimRepository = new VictimRepository(prisma);

// GET /api/admin/campaigns - List campaigns
router.get('/', async (req, res) => {
  try {
    const { status, createdBy } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (createdBy) filters.createdBy = createdBy;

    const campaigns = await campaignRepository.findMany(filters);

    // Format response with statistics
    const formattedCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        const victims = await victimRepository.findMany(
          { campaignId: campaign.id },
          { page: 1, limit: 1 }
        );

        return {
          id: campaign.id,
          name: campaign.name,
          code: campaign.code,
          description: campaign.description,
          status: campaign.status,
          config: campaign.config,
          statistics: {
            ...campaign.statistics,
            totalVictims: victims.total
          },
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
          creator: campaign.creator ? {
            id: campaign.creator.id,
            username: campaign.creator.username,
            email: campaign.creator.email
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedCampaigns,
      total: formattedCampaigns.length
    });
  } catch (error) {
    logger.error('Error fetching campaigns:', error);
    res.status(500).json({
      error: 'Failed to fetch campaigns',
      message: error.message
    });
  }
});

// POST /api/admin/campaigns - Create campaign
router.post('/', async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      config = {},
      infrastructure = {},
      timeline = {},
      successCriteria = {},
      riskAssessment = {},
      team = {},
      createdBy
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }

    // Generate code if not provided
    const campaignCode = code || `CAMPAIGN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Check if code already exists
    const existingCampaign = await campaignRepository.findByCode(campaignCode);
    if (existingCampaign) {
      return res.status(400).json({ error: 'Campaign code already exists' });
    }

    // Create campaign
    const campaign = await campaignRepository.create({
      name,
      code: campaignCode,
      description,
      config,
      infrastructure,
      timeline,
      successCriteria,
      riskAssessment,
      team,
      status: 'draft',
      statusHistory: [{
        status: 'draft',
        timestamp: new Date().toISOString(),
        changedBy: createdBy || null
      }],
      statistics: {
        totalVictims: 0,
        totalOAuthTokens: 0,
        totalRegistrations: 0,
        totalGmailAccess: 0
      },
      createdBy
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      const { emitCampaignUpdate } = require('../../../../sockets/adminHandlers');
      emitCampaignUpdate(io, 'created', campaign);
    }

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    logger.error('Error creating campaign:', error);
    res.status(500).json({
      error: 'Failed to create campaign',
      message: error.message
    });
  }
});

router.use('/:id', detailRoutes);
router.use('/:id/statistics', statisticsRoutes);

module.exports = router;

