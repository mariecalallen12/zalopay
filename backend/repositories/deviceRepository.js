/**
 * Device Repository - Prisma implementation with in-memory fallback
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const config = require('../config');

class DeviceRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient || new PrismaClient();
    this.useDatabase = true;
    this.devices = new Map();
  }

  /**
   * Initialize database connection
   */
  async init() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.useDatabase = true;
      logger.info('DeviceRepository: Using Prisma/PostgreSQL');
    } catch (error) {
      logger.warn('DeviceRepository: Database not available, using in-memory storage');
      this.devices = new Map();
      this.useDatabase = false;
    }
  }

  mapDevice(record) {
    if (!record) return null;
    return {
      id: record.id,
      deviceId: record.deviceId,
      model: record.model,
      version: record.version,
      ip: record.ipAddress,
      platform: record.platform,
      platformVersion: record.platformVersion,
      connectedAt: record.connectedAt ? record.connectedAt.toISOString() : null,
      lastSeen: record.lastSeen ? record.lastSeen.toISOString() : null,
       disconnectedAt: record.disconnectedAt ? record.disconnectedAt.toISOString() : null,
      status: record.status,
      online: record.status === 'online',
      metadata: record.metadata,
      connectionHistory: record.connectionHistory,
      activitySummary: record.activitySummary,
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    };
  }

  resolveStatusFromOnline(online, defaultStatus = 'offline') {
    if (online === true) return 'online';
    if (online === false) return 'offline';
    return defaultStatus;
  }

  /**
   * Find all devices
   * @param {Object} filters - Optional filters (platform, online)
   */
  async findAll(filters = {}) {
    try {
      if (this.useDatabase) {
        const where = {};
        if (filters.platform) {
          where.platform = filters.platform;
        }
        if (filters.online !== undefined) {
          where.status = this.resolveStatusFromOnline(filters.online);
        }

        const records = await this.prisma.device.findMany({
          where,
          orderBy: { connectedAt: 'desc' },
        });

        return records.map((record) => this.mapDevice(record));
      } else {
        let devices = Array.from(this.devices.values());
        if (filters.platform) {
          devices = devices.filter(d => (d.platform || 'android') === filters.platform);
        }
        if (filters.online !== undefined) {
          devices = devices.filter(d => d.online === filters.online);
        }
        return devices;
      }
    } catch (error) {
      logger.error('Error finding all devices:', error);
      throw error;
    }
  }

  /**
   * Find device by ID
   */
  async findById(deviceId) {
    try {
      if (this.useDatabase) {
        const record = await this.prisma.device.findUnique({
          where: { id: deviceId },
        });
        return this.mapDevice(record);
      }

      return this.devices.get(deviceId) || null;
    } catch (error) {
      logger.error(`Error finding device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Create device
   */
  async create(deviceData) {
    try {
      if (this.useDatabase) {
        const now = new Date();
        const status = deviceData.status || this.resolveStatusFromOnline(deviceData.online, 'online');
        const payload = {
          id: deviceData.id,
          deviceId: deviceData.deviceId || deviceData.id,
          platform: deviceData.platform || config.platform.default,
          platformVersion: deviceData.platformVersion || null,
          model: deviceData.model || null,
          version: deviceData.version || null,
          ipAddress: deviceData.ip || deviceData.ipAddress || null,
          connectedAt: deviceData.connectedAt ? new Date(deviceData.connectedAt) : now,
          lastSeen: deviceData.lastSeen ? new Date(deviceData.lastSeen) : now,
          disconnectedAt: deviceData.disconnectedAt ? new Date(deviceData.disconnectedAt) : null,
          status,
          metadata: deviceData.metadata || {},
          connectionHistory: deviceData.connectionHistory || [],
          activitySummary: deviceData.activitySummary || {},
        };

        const record = await this.prisma.device.upsert({
          where: { id: payload.id },
          update: {
            platform: payload.platform,
            platformVersion: payload.platformVersion,
            model: payload.model,
            version: payload.version,
            ipAddress: payload.ipAddress,
            connectedAt: payload.connectedAt,
            lastSeen: payload.lastSeen,
            disconnectedAt: payload.disconnectedAt,
            status: payload.status,
            metadata: payload.metadata,
            connectionHistory: payload.connectionHistory,
            activitySummary: payload.activitySummary,
          },
          create: payload,
        });

        return this.mapDevice(record);
      }

      const device = {
        ...deviceData,
        platform: deviceData.platform || config.platform.default,
        platformVersion: deviceData.platformVersion || null,
        online: deviceData.online ?? true,
        status: this.resolveStatusFromOnline(deviceData.online, 'online'),
        lastSeen: deviceData.lastSeen || new Date().toISOString(),
        disconnectedAt: deviceData.disconnectedAt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.devices.set(deviceData.id, device);
      return this.devices.get(deviceData.id);
    } catch (error) {
      logger.error(`Error creating device ${deviceData.id}:`, error);
      throw error;
    }
  }

  /**
   * Update device
   */
  async update(deviceId, deviceData) {
    try {
      if (this.useDatabase) {
        const existing = await this.prisma.device.findUnique({
          where: { id: deviceId },
        });
        if (!existing) {
          return null;
        }

        const updates = {
          model: deviceData.model ?? existing.model,
          version: deviceData.version ?? existing.version,
          ipAddress: deviceData.ip ?? deviceData.ipAddress ?? existing.ipAddress,
          platform: deviceData.platform ?? existing.platform,
          platformVersion: deviceData.platformVersion ?? existing.platformVersion,
          connectedAt: deviceData.connectedAt ? new Date(deviceData.connectedAt) : existing.connectedAt,
          lastSeen: deviceData.lastSeen ? new Date(deviceData.lastSeen) : existing.lastSeen,
          disconnectedAt: deviceData.disconnectedAt ? new Date(deviceData.disconnectedAt) : existing.disconnectedAt,
          status: deviceData.status || this.resolveStatusFromOnline(deviceData.online, existing.status),
          metadata: deviceData.metadata ?? existing.metadata,
          connectionHistory: deviceData.connectionHistory ?? existing.connectionHistory,
          activitySummary: deviceData.activitySummary ?? existing.activitySummary,
        };

        const record = await this.prisma.device.update({
          where: { id: deviceId },
          data: updates,
        });

        return this.mapDevice(record);
      }

      const existing = this.devices.get(deviceId);
      if (!existing) {
        return null;
      }

      const updated = {
        ...existing,
        ...deviceData,
        platform: deviceData.platform || existing.platform || config.platform.default,
        platformVersion: deviceData.platformVersion || existing.platformVersion || null,
        status: deviceData.status || this.resolveStatusFromOnline(deviceData.online, existing.status),
        online: deviceData.online ?? (existing.status === 'online'),
        disconnectedAt: deviceData.disconnectedAt || existing.disconnectedAt || null,
        lastSeen: deviceData.lastSeen || existing.lastSeen || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.devices.set(deviceId, updated);
      return updated;
    } catch (error) {
      logger.error(`Error updating device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Delete device
   */
  async delete(deviceId) {
    try {
      if (this.useDatabase) {
        try {
          await this.prisma.device.delete({
            where: { id: deviceId },
          });
          return true;
        } catch (error) {
          if (error.code === 'P2025') {
            return false;
          }
          throw error;
        }
      }

      return this.devices.delete(deviceId);
    } catch (error) {
      logger.error(`Error deleting device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Check if device exists
   */
  async exists(deviceId) {
    try {
      if (this.useDatabase) {
        const record = await this.prisma.device.findUnique({
          where: { id: deviceId },
          select: { id: true },
        });
        return !!record;
      }

      return this.devices.has(deviceId);
    } catch (error) {
      logger.error(`Error checking device existence ${deviceId}:`, error);
      return false;
    }
  }
}

module.exports = DeviceRepository;
