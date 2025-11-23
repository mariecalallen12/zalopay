// Admin authentication routes aggregator
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const AdminUserRepository = require('../../../../repositories/adminUserRepository');
const ActivityLogRepository = require('../../../../repositories/activityLogRepository');
const logger = require('../../../../utils/logger');
const config = require('../../../../config');

const prisma = new PrismaClient();
const adminUserRepository = new AdminUserRepository(prisma);
const activityLogRepository = new ActivityLogRepository(prisma);

// MFA routes
const mfaRoutes = require('./mfa');
router.use('/mfa', mfaRoutes);

// POST /api/admin/auth/login - Admin login with MFA support
router.post('/login', async (req, res) => {
  try {
    const { username, password, mfaCode } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    // Find admin user by username or email
    let admin = await adminUserRepository.findByUsername(username);
    if (!admin) {
      admin = await adminUserRepository.findByEmail(username);
    }

    if (!admin) {
      // Log failed login attempt
      await activityLogRepository.create({
        logId: `login-failed-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        actionType: 'authentication_failed',
        actionCategory: 'authentication',
        severityLevel: 'medium',
        actor: {
          type: 'external',
          identifier: username,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        target: {
          type: 'admin_user',
          identifier: username
        },
        actionDetails: {
          reason: 'user_not_found'
        },
        technicalContext: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      });

      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ 
        error: 'Account is inactive. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      // Log failed login attempt
      await activityLogRepository.create({
        logId: `login-failed-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        actionType: 'authentication_failed',
        actionCategory: 'authentication',
        severityLevel: 'medium',
        actor: {
          type: 'external',
          identifier: username,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        },
        target: {
          type: 'admin_user',
          identifier: admin.id,
          email: admin.email
        },
        actionDetails: {
          reason: 'invalid_password'
        },
        technicalContext: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      });

      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    // Check MFA if enabled
    const mfaConfig = admin.mfaConfig || {};
    if (mfaConfig.mfa_enabled) {
      if (!mfaCode) {
        return res.status(200).json({
          requiresMFA: true,
          message: 'MFA code required'
        });
      }

      // Verify MFA code
      const { verifyMFA } = require('../../../../middleware/mfa');
      const EncryptionService = require('../../../../services/encryption');
      const { getEncryptionConfig } = require('../../../../config/encryption');
      const encryptionConfig = getEncryptionConfig();
      const encryptionService = new EncryptionService(encryptionConfig.oauthEncryptionKey);
      
      const { authenticator } = require('otplib');
      const secret = encryptionService.decrypt(mfaConfig.totp_secret);
      const isValidMFA = authenticator.verify({ token: mfaCode, secret });

      // Check backup codes if TOTP failed
      let isValidBackup = false;
      if (!isValidMFA && mfaConfig.backup_codes) {
        const backupCodes = mfaConfig.backup_codes || [];
        for (let i = 0; i < backupCodes.length; i++) {
          const decryptedCode = encryptionService.decrypt(backupCodes[i]);
          if (decryptedCode === mfaCode.toUpperCase()) {
            isValidBackup = true;
            // Remove used backup code
            backupCodes.splice(i, 1);
            await adminUserRepository.update(admin.id, {
              mfaConfig: {
                ...mfaConfig,
                backup_codes: backupCodes
              }
            });
            break;
          }
        }
      }

      if (!isValidMFA && !isValidBackup) {
        return res.status(401).json({ 
          error: 'Invalid MFA code' 
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      },
      config.security.jwtSecret,
      { 
        expiresIn: config.security.jwtExpiresIn 
      }
    );

    // Update activity summary
    const activitySummary = admin.activitySummary || {};
    await adminUserRepository.update(admin.id, {
      activitySummary: {
        ...activitySummary,
        totalLogins: (activitySummary.totalLogins || 0) + 1,
        lastLogin: new Date().toISOString()
      }
    });

    // Log successful login
    await activityLogRepository.create({
      logId: `login-success-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      actionType: 'authentication_success',
      actionCategory: 'authentication',
      severityLevel: 'low',
      actor: {
        type: 'admin_user',
        identifier: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      },
      target: {
        type: 'system',
        identifier: 'admin_portal'
      },
      actionDetails: {
        loginMethod: 'password',
        mfaUsed: mfaConfig.mfa_enabled || false
      },
      technicalContext: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      },
      adminId: admin.id
    });

    // Return success response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
        mfaEnabled: mfaConfig.mfa_enabled || false
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// GET /api/admin/auth/permissions - Get user permissions
// Note: This requires authentication - middleware applied in parent router
// This route is protected and requires valid JWT token
const { authenticateAdmin } = require('../../../../middleware/auth');
router.get('/permissions', authenticateAdmin, async (req, res) => {
  try {
    const admin = req.admin;
    
    res.status(200).json({
      permissions: admin.permissions || [],
      role: admin.role,
      accessRestrictions: admin.accessRestrictions || {}
    });
  } catch (error) {
    logger.error('Get permissions error:', error);
    res.status(500).json({
      error: 'Failed to get permissions',
      message: error.message
    });
  }
});

// GET /api/admin/auth/sessions - Get active sessions
// Note: This requires authentication
router.get('/sessions', authenticateAdmin, async (req, res) => {
  try {
    const admin = req.admin;
    
    // Get recent login activity from activity logs
    const recentLogins = await activityLogRepository.findMany(
      {
        actionType: 'authentication_success',
        adminId: admin.id
      },
      {
        page: 1,
        limit: 10
      }
    );

    res.status(200).json({
      sessions: recentLogins.logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        ipAddress: log.technicalContext?.ipAddress,
        userAgent: log.technicalContext?.userAgent,
        mfaUsed: log.actionDetails?.mfaUsed || false
      })),
      currentSession: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({
      error: 'Failed to get sessions',
      message: error.message
    });
  }
});

module.exports = router;

