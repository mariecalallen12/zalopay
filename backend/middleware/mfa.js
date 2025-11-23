// MFA Verification Middleware
// Verifies MFA code for protected routes

const { authenticator } = require('otplib');
const { PrismaClient } = require('@prisma/client');
const EncryptionService = require('../services/encryption');
const { getEncryptionConfig } = require('../config/encryption');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
const encryptionConfig = getEncryptionConfig();
const encryptionService = new EncryptionService(encryptionConfig.oauthEncryptionKey);

// Configure TOTP
authenticator.options = {
  window: 2,
  step: 30
};

/**
 * Middleware to verify MFA code
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
async function verifyMFA(req, res, next) {
  try {
    // Get admin user from request (set by authenticateAdmin middleware)
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get admin user
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Check if MFA is enabled
    const mfaConfig = admin.mfaConfig || {};
    if (!mfaConfig.mfa_enabled) {
      // MFA not enabled, allow access
      return next();
    }

    // Get MFA code from request
    const mfaCode = req.headers['x-mfa-code'] || req.body.mfaCode;
    const backupCode = req.headers['x-mfa-backup-code'] || req.body.mfaBackupCode;

    if (!mfaCode && !backupCode) {
      return res.status(401).json({ 
        error: 'MFA code required',
        mfa_required: true 
      });
    }

    // Verify TOTP code
    let isValid = false;
    if (mfaCode && mfaConfig.totp_secret) {
      try {
        const secret = encryptionService.decrypt(mfaConfig.totp_secret);
        isValid = authenticator.verify({ token: mfaCode, secret });
      } catch (error) {
        logger.warn('MFA verification error:', error);
      }
    }

    // Verify backup code if TOTP failed
    if (!isValid && backupCode) {
      const backupCodes = mfaConfig.backup_codes || [];
      for (let i = 0; i < backupCodes.length; i++) {
        try {
          const decryptedCode = encryptionService.decrypt(backupCodes[i]);
          if (decryptedCode === backupCode.toUpperCase()) {
            isValid = true;
            // Remove used backup code
            backupCodes.splice(i, 1);
            await prisma.adminUser.update({
              where: { id: adminId },
              data: {
                mfaConfig: {
                  ...mfaConfig,
                  backup_codes: backupCodes
                }
              }
            });
            break;
          }
        } catch (error) {
          logger.warn('Backup code decryption error:', error);
        }
      }
    }

    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid MFA code',
        mfa_required: true 
      });
    }

    // MFA verified, continue
    next();
  } catch (error) {
    logger.error('MFA middleware error:', error);
    res.status(500).json({
      error: 'MFA verification failed',
      message: error.message
    });
  }
}

/**
 * Middleware to check if MFA is required (but don't enforce)
 * Sets req.mfaRequired flag
 */
async function checkMFARequired(req, res, next) {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      req.mfaRequired = false;
      return next();
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { mfaConfig: true }
    });

    req.mfaRequired = admin?.mfaConfig?.mfa_enabled || false;
    next();
  } catch (error) {
    logger.error('MFA check error:', error);
    req.mfaRequired = false;
    next();
  }
}

module.exports = {
  verifyMFA,
  checkMFARequired
};

