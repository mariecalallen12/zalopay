/**
 * Remote control service - Handles remote control commands and validation
 */

const logger = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');

class RemoteControlService {
  constructor(deviceService, io) {
    this.deviceService = deviceService;
    this.io = io;
    // Active control sessions: Map<deviceId, sessionInfo>
    this.controlSessions = new Map();
  }

  /**
   * Start remote control session for a device
   */
  async startControl(deviceId) {
    try {
      // Check if device is connected
      if (!this.deviceService.isDeviceConnected(deviceId)) {
        throw new NotFoundError('Device not connected');
      }

      // Check if already controlling
      if (this.controlSessions.has(deviceId)) {
        throw new ValidationError('Remote control already active for this device');
      }

      // Create session info
      const sessionInfo = {
        deviceId,
        startedAt: new Date().toISOString(),
        active: true,
        commandCount: 0,
      };

      // Store session
      this.controlSessions.set(deviceId, sessionInfo);

      // Emit start command to device
      this.deviceService.emitToDevice(deviceId, 'remote-control-start', {});

      // Notify web clients
      if (this.io && this.io.emit) {
        this.io.emit('remote-control-started', {
          deviceId,
          startedAt: sessionInfo.startedAt,
        });
      }

      logger.info(`Remote control started for device ${deviceId}`);

      return {
        success: true,
        message: 'Remote control started',
        session: sessionInfo,
      };
    } catch (error) {
      logger.error(`Error starting remote control for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Stop remote control session for a device
   */
  async stopControl(deviceId) {
    try {
      // Check if controlling
      if (!this.controlSessions.has(deviceId)) {
        throw new ValidationError('Remote control not active for this device');
      }

      // Emit stop command to device
      this.deviceService.emitToDevice(deviceId, 'remote-control-stop', {});

      // Clean up
      this.controlSessions.delete(deviceId);

      // Notify web clients
      if (this.io && this.io.emit) {
        this.io.emit('remote-control-stopped', {
          deviceId,
          stoppedAt: new Date().toISOString(),
        });
      }

      logger.info(`Remote control stopped for device ${deviceId}`);

      return {
        success: true,
        message: 'Remote control stopped',
      };
    } catch (error) {
      logger.error(`Error stopping remote control for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Validate and forward control command to device
   */
  async sendCommand(deviceId, command) {
    try {
      // Check if controlling
      if (!this.controlSessions.has(deviceId)) {
        throw new ValidationError('Remote control not active for this device');
      }

      // Validate command
      this.validateCommand(command);

      // Get session
      const session = this.controlSessions.get(deviceId);
      if (!session || !session.active) {
        throw new ValidationError('Remote control session not active');
      }

      // Update command count
      session.commandCount++;

      // Prepare command data
      const commandData = {
        deviceId,
        type: command.type,
        data: command.data,
        timestamp: command.timestamp || Date.now(),
      };

      // Forward command to device
      this.deviceService.emitToDevice(deviceId, 'remote-control-command-forward', commandData);

      logger.debug(`Command sent to device ${deviceId}: ${command.type}`);

      return {
        success: true,
        message: 'Command sent to device',
        command: commandData,
      };
    } catch (error) {
      logger.error(`Error sending command to device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Validate control command
   */
  validateCommand(command) {
    if (!command || typeof command !== 'object') {
      throw new ValidationError('Command must be an object');
    }

    if (!command.type || typeof command.type !== 'string') {
      throw new ValidationError('Command type is required');
    }

    const validTypes = ['touch', 'swipe', 'key', 'scroll'];
    if (!validTypes.includes(command.type)) {
      throw new ValidationError(`Invalid command type. Must be one of: ${validTypes.join(', ')}`);
    }

    if (!command.data || typeof command.data !== 'object') {
      throw new ValidationError('Command data is required');
    }

    // Validate based on command type
    switch (command.type) {
      case 'touch':
        if (typeof command.data.x !== 'number' || typeof command.data.y !== 'number') {
          throw new ValidationError('Touch command requires x and y coordinates');
        }
        if (!['down', 'move', 'up'].includes(command.data.action)) {
          throw new ValidationError('Touch action must be: down, move, or up');
        }
        break;

      case 'swipe':
        if (
          typeof command.data.startX !== 'number' ||
          typeof command.data.startY !== 'number' ||
          typeof command.data.endX !== 'number' ||
          typeof command.data.endY !== 'number'
        ) {
          throw new ValidationError('Swipe command requires startX, startY, endX, endY');
        }
        break;

      case 'key':
        if (typeof command.data.keyCode !== 'number' && !command.data.key) {
          throw new ValidationError('Key command requires keyCode or key');
        }
        if (!['down', 'up'].includes(command.data.action)) {
          throw new ValidationError('Key action must be: down or up');
        }
        break;

      case 'scroll':
        if (
          typeof command.data.x !== 'number' ||
          typeof command.data.y !== 'number' ||
          typeof command.data.deltaX !== 'number' ||
          typeof command.data.deltaY !== 'number'
        ) {
          throw new ValidationError('Scroll command requires x, y, deltaX, deltaY');
        }
        break;

      default:
        throw new ValidationError(`Unknown command type: ${command.type}`);
    }
  }

  /**
   * Get control status for a device
   */
  getControlStatus(deviceId) {
    const session = this.controlSessions.get(deviceId);
    if (!session) {
      return {
        active: false,
      };
    }

    return {
      active: session.active,
      startedAt: session.startedAt,
      commandCount: session.commandCount,
    };
  }

  /**
   * Check if device is being controlled
   */
  isControlling(deviceId) {
    const session = this.controlSessions.get(deviceId);
    return !!(session && session.active);
  }

  /**
   * Clean up control session (called on device disconnect)
   */
  cleanup(deviceId) {
    this.controlSessions.delete(deviceId);

    // Notify web clients
    if (this.io && this.io.emit) {
      this.io.emit('remote-control-stopped', {
        deviceId,
        stoppedAt: new Date().toISOString(),
        reason: 'device_disconnected',
      });
    }

    logger.info(`Remote control cleaned up for device ${deviceId}`);
  }
}

module.exports = RemoteControlService;


