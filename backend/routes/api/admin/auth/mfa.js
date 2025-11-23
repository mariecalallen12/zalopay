// MFA Authentication Routes
// Handles TOTP generation, verification, and backup codes
// Based on database-schema-documentation.md

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const EncryptionService = require('../../../../services/encryption');
const { getEncryptionConfig } = require('../../../../config/encryption');
const { authenticateAdmin } = require('../../../../middleware/auth');
const logger = require('../../../../utils/logger');

const prisma = new PrismaClient();
const encryptionConfig = getEncryptionConfig();
const encryptionService = new EncryptionService(encryptionConfig.oauthEncryptionKey);

// Configure TOTP
authenticator.options = {
  window: 2, // Allow 2 time steps (60 seconds) tolerance
  step: 30   // 30 second time step
};

/**
 * POST /api/admin/auth/mfa/setup
 * Setup MFA for admin user
 */
router.post('/setup', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Check if MFA is already enabled
    const mfaConfig = admin.mfaConfig || {};
    if (mfaConfig.mfa_enabled) {
      return res.status(400).json({ 
        error: 'MFA is already enabled. Disable it first to set up again.' 
      });
    }

    // Generate TOTP secret
    const secret = authenticator.generateSecret();
    const serviceName = 'ZaloPay Merchant Platform';
    const accountName = admin.email;

    // Generate QR code data URL
    const otpauthUrl = authenticator.keyuri(accountName, serviceName, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Encrypt secret and backup codes
    const encryptedSecret = encryptionService.encrypt(secret);
    const encryptedBackupCodes = backupCodes.map(code => 
      encryptionService.encrypt(code)
    );

    // Store encrypted MFA config (but don't enable yet - user needs to verify first)
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        mfaConfig: {
          mfa_enabled: false,
          mfa_method: 'totp',
          totp_secret: encryptedSecret,
          backup_codes: encryptedBackupCodes,
          setup_initiated_at: new Date().toISOString()
        }
      }
    });

    res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      secret: secret, // Return plain secret for initial setup (user should save it)
      backupCodes: backupCodes, // Return plain backup codes (user should save them)
      message: 'Scan QR code with authenticator app and verify with a code to enable MFA'
    });
  } catch (error) {
    logger.error('MFA setup error:', error);
    res.status(500).json({
      error: 'Failed to setup MFA',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/auth/mfa/verify
 * Verify MFA code and enable MFA
 */
router.post('/verify', authenticateAdmin, async (req, res) => {
  try {
    const { code, backupCode } = req.body;
    const adminId = req.user.id;

    if (!code && !backupCode) {
      return res.status(400).json({ error: 'MFA code or backup code is required' });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    const mfaConfig = admin.mfaConfig || {};
    if (!mfaConfig.totp_secret) {
      return res.status(400).json({ error: 'MFA not set up. Please set up MFA first.' });
    }

    // Decrypt secret
    const secret = encryptionService.decrypt(mfaConfig.totp_secret);
    let isValid = false;

    // Verify TOTP code
    if (code) {
      isValid = authenticator.verify({ token: code, secret });
    }

    // Verify backup code if TOTP failed
    if (!isValid && backupCode) {
      const backupCodes = mfaConfig.backup_codes || [];
      for (let i = 0; i < backupCodes.length; i++) {
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
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    // Enable MFA
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        mfaConfig: {
          ...mfaConfig,
          mfa_enabled: true,
          mfa_verified_at: new Date().toISOString()
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'MFA verified and enabled successfully'
    });
  } catch (error) {
    logger.error('MFA verification error:', error);
    res.status(500).json({
      error: 'Failed to verify MFA',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/auth/mfa/disable
 * Disable MFA for admin user
 */
router.post('/disable', authenticateAdmin, async (req, res) => {
  try {
    const { password, mfaCode } = req.body;
    const adminId = req.user.id;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to disable MFA' });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Verify password (you'll need to implement password verification)
    // For now, we'll skip password verification in this example
    // In production, use bcrypt to verify password

    // Verify MFA code if provided
    if (mfaCode) {
      const mfaConfig = admin.mfaConfig || {};
      if (mfaConfig.totp_secret) {
        const secret = encryptionService.decrypt(mfaConfig.totp_secret);
        const isValid = authenticator.verify({ token: mfaCode, secret });
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid MFA code' });
        }
      }
    }

    // Disable MFA
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        mfaConfig: {
          mfa_enabled: false,
          mfa_method: null,
          totp_secret: null,
          backup_codes: [],
          disabled_at: new Date().toISOString()
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error) {
    logger.error('MFA disable error:', error);
    res.status(500).json({
      error: 'Failed to disable MFA',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/auth/mfa/status
 * Get MFA status for current admin
 */
router.get('/status', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        mfaConfig: true
      }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    const mfaConfig = admin.mfaConfig || {};
    const backupCodesCount = (mfaConfig.backup_codes || []).length;

    res.status(200).json({
      mfa_enabled: mfaConfig.mfa_enabled || false,
      mfa_method: mfaConfig.mfa_method || null,
      backup_codes_remaining: backupCodesCount,
      setup_initiated: !!mfaConfig.totp_secret
    });
  } catch (error) {
    logger.error('MFA status error:', error);
    res.status(500).json({
      error: 'Failed to get MFA status',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/auth/mfa/regenerate-backup-codes
 * Regenerate backup codes
 */
router.post('/regenerate-backup-codes', authenticateAdmin, async (req, res) => {
  try {
    const { mfaCode } = req.body;
    const adminId = req.user.id;

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    const mfaConfig = admin.mfaConfig || {};
    if (!mfaConfig.mfa_enabled) {
      return res.status(400).json({ error: 'MFA is not enabled' });
    }

    // Verify MFA code
    if (mfaCode && mfaConfig.totp_secret) {
      const secret = encryptionService.decrypt(mfaConfig.totp_secret);
      const isValid = authenticator.verify({ token: mfaCode, secret });
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid MFA code' });
      }
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    const encryptedBackupCodes = backupCodes.map(code => 
      encryptionService.encrypt(code)
    );

    // Update admin
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        mfaConfig: {
          ...mfaConfig,
          backup_codes: encryptedBackupCodes,
          backup_codes_regenerated_at: new Date().toISOString()
        }
      }
    });

    res.status(200).json({
      success: true,
      backupCodes: backupCodes, // Return plain backup codes
      message: 'Backup codes regenerated successfully'
    });
  } catch (error) {
    logger.error('Backup codes regeneration error:', error);
    res.status(500).json({
      error: 'Failed to regenerate backup codes',
      message: error.message
    });
  }
});

module.exports = router;

