/**
 * Screen streaming service - Manages screen streaming sessions and frame broadcasting
 */

const logger = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');

class ScreenStreamService {
  constructor(deviceService, io) {
    this.deviceService = deviceService;
    this.io = io;
    // Active streaming sessions: Map<deviceId, sessionInfo>
    this.streamingSessions = new Map();
    // Frame buffers: Map<deviceId, frameBuffer>
    this.frameBuffers = new Map();
    // Quality settings: Map<deviceId, qualitySettings>
    this.qualitySettings = new Map();
  }

  /**
   * Default quality settings
   */
  getDefaultQualitySettings() {
    return {
      fps: 15, // Frames per second
      resolution: 'half', // full, half, quarter
      compression: 75, // JPEG quality 60-90
      width: null, // Auto-detect from device
      height: null, // Auto-detect from device
    };
  }

  /**
   * Start screen streaming for a device
   */
  async startStreaming(deviceId, qualitySettings = {}) {
    try {
      // Check if device is connected
      if (!this.deviceService.isDeviceConnected(deviceId)) {
        throw new NotFoundError('Device not connected');
      }

      // Check if already streaming
      if (this.streamingSessions.has(deviceId)) {
        throw new ValidationError('Screen streaming already active for this device');
      }

      // Merge quality settings with defaults
      const settings = {
        ...this.getDefaultQualitySettings(),
        ...qualitySettings,
      };

      // Store quality settings
      this.qualitySettings.set(deviceId, settings);

      // Initialize frame buffer
      this.frameBuffers.set(deviceId, {
        frames: [],
        maxSize: 5, // Keep last 5 frames
        lastFrameTime: 0,
      });

      // Create session info
      const sessionInfo = {
        deviceId,
        startedAt: new Date().toISOString(),
        settings,
        active: true,
        frameCount: 0,
      };

      // Store session
      this.streamingSessions.set(deviceId, sessionInfo);

      // Emit start command to device
      this.deviceService.emitToDevice(deviceId, 'screen-stream-start', {
        settings,
      });

      // Notify web clients
      if (this.io && this.io.emit) {
        this.io.emit('screen-stream-started', {
          deviceId,
          startedAt: sessionInfo.startedAt,
        });
      }

      logger.info(`Screen streaming started for device ${deviceId}`);

      return {
        success: true,
        message: 'Screen streaming started',
        session: sessionInfo,
      };
    } catch (error) {
      logger.error(`Error starting screen streaming for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Stop screen streaming for a device
   */
  async stopStreaming(deviceId) {
    try {
      // Check if streaming
      if (!this.streamingSessions.has(deviceId)) {
        throw new ValidationError('Screen streaming not active for this device');
      }

      // Emit stop command to device
      this.deviceService.emitToDevice(deviceId, 'screen-stream-stop', {});

      // Clean up
      this.streamingSessions.delete(deviceId);
      this.frameBuffers.delete(deviceId);
      this.qualitySettings.delete(deviceId);

      // Notify web clients
      if (this.io && this.io.emit) {
        this.io.emit('screen-stream-stopped', {
          deviceId,
          stoppedAt: new Date().toISOString(),
        });
      }

      logger.info(`Screen streaming stopped for device ${deviceId}`);

      return {
        success: true,
        message: 'Screen streaming stopped',
      };
    } catch (error) {
      logger.error(`Error stopping screen streaming for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Update quality settings for a device
   */
  async updateQualitySettings(deviceId, qualitySettings) {
    try {
      // Check if streaming
      if (!this.streamingSessions.has(deviceId)) {
        throw new ValidationError('Screen streaming not active for this device');
      }

      // Get current settings
      const currentSettings = this.qualitySettings.get(deviceId) || this.getDefaultQualitySettings();

      // Merge with new settings
      const newSettings = {
        ...currentSettings,
        ...qualitySettings,
      };

      // Validate settings
      if (newSettings.fps < 5 || newSettings.fps > 30) {
        throw new ValidationError('FPS must be between 5 and 30');
      }

      if (newSettings.compression < 60 || newSettings.compression > 90) {
        throw new ValidationError('Compression quality must be between 60 and 90');
      }

      // Update settings
      this.qualitySettings.set(deviceId, newSettings);

      // Update session
      const session = this.streamingSessions.get(deviceId);
      if (session) {
        session.settings = newSettings;
      }

      // Emit update to device
      this.deviceService.emitToDevice(deviceId, 'screen-stream-quality', {
        settings: newSettings,
      });

      logger.info(`Quality settings updated for device ${deviceId}`);

      return {
        success: true,
        message: 'Quality settings updated',
        settings: newSettings,
      };
    } catch (error) {
      logger.error(`Error updating quality settings for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Handle frame data from device
   */
  handleFrame(deviceId, frameData) {
    try {
      // Check if streaming
      if (!this.streamingSessions.has(deviceId)) {
        logger.warn(`Received frame from device ${deviceId} but streaming not active`);
        return;
      }

      // Get session
      const session = this.streamingSessions.get(deviceId);
      if (!session || !session.active) {
        return;
      }

      // Update frame count
      session.frameCount++;

      // Get frame buffer
      const buffer = this.frameBuffers.get(deviceId);
      if (!buffer) {
        return;
      }

      // Add frame to buffer
      const frame = {
        deviceId,
        frame: frameData.frame || frameData.image || frameData.data,
        timestamp: frameData.timestamp || Date.now(),
        width: frameData.width,
        height: frameData.height,
        quality: frameData.quality || session.settings.compression,
      };

      // Manage buffer size
      buffer.frames.push(frame);
      if (buffer.frames.length > buffer.maxSize) {
        buffer.frames.shift(); // Remove oldest frame
      }

      buffer.lastFrameTime = frame.timestamp;

      // Broadcast frame to web clients
      if (this.io && this.io.emit) {
        this.io.emit('screen-frame-broadcast', frame);
      }

      // Log frame rate periodically
      if (session.frameCount % 100 === 0) {
        const elapsed = (Date.now() - new Date(session.startedAt).getTime()) / 1000;
        const fps = session.frameCount / elapsed;
        logger.debug(`Device ${deviceId} streaming at ${fps.toFixed(2)} FPS`);
      }
    } catch (error) {
      logger.error(`Error handling frame from device ${deviceId}:`, error);
    }
  }

  /**
   * Get streaming status for a device
   */
  getStreamingStatus(deviceId) {
    const session = this.streamingSessions.get(deviceId);
    if (!session) {
      return {
        active: false,
      };
    }

    const buffer = this.frameBuffers.get(deviceId);
    const settings = this.qualitySettings.get(deviceId);

    return {
      active: session.active,
      startedAt: session.startedAt,
      frameCount: session.frameCount,
      settings: settings || this.getDefaultQualitySettings(),
      lastFrameTime: buffer?.lastFrameTime || 0,
      bufferSize: buffer?.frames.length || 0,
    };
  }

  /**
   * Check if device is streaming
   */
  isStreaming(deviceId) {
    const session = this.streamingSessions.get(deviceId);
    return !!(session && session.active);
  }

  /**
   * Clean up streaming session (called on device disconnect)
   */
  cleanup(deviceId) {
    this.streamingSessions.delete(deviceId);
    this.frameBuffers.delete(deviceId);
    this.qualitySettings.delete(deviceId);

    // Notify web clients
    if (this.io && this.io.emit) {
      this.io.emit('screen-stream-stopped', {
        deviceId,
        stoppedAt: new Date().toISOString(),
        reason: 'device_disconnected',
      });
    }

    logger.info(`Screen streaming cleaned up for device ${deviceId}`);
  }
}

module.exports = ScreenStreamService;


