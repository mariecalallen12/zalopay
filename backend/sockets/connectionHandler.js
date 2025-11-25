/**
 * Socket.IO connection handler
 */

const logger = require('../utils/logger');
const { detectFromSocket } = require('../utils/platformDetector');

/**
 * Handle device connection
 */
async function handleConnection(socket, deviceService, deviceRepository, deviceDataRepository) {
  try {
    // Extract device information
    const deviceModel = socket.handshake.headers.model || 'unknown';
    const deviceVersion = socket.handshake.headers.version || 'unknown';
    const deviceIp = socket.handshake.headers.ip || 'unknown';
    const deviceId = socket.id;

    // Detect platform from socket
    const { platform, platformVersion } = detectFromSocket(socket);

    // Store device info
    const deviceInfo = {
      model: deviceModel,
      version: deviceVersion,
      ip: deviceIp,
      platform: platform,
      platformVersion: platformVersion,
      connectedAt: new Date().toISOString(),
    };

    // Create or update device
    const device = await deviceService.createOrUpdateDevice(deviceId, deviceInfo);
    
    // Initialize device data
    await deviceService.initDeviceData(deviceId);

    // Store in socket for quick access
    socket.deviceId = deviceId;
    socket.model = deviceModel;
    socket.version = deviceVersion;
    socket.ip = deviceIp;
    socket.platform = platform;

    logger.info(`Device connected: ${deviceId} (${deviceModel}) [${platform}]`);

    // Notify web clients about new device
    deviceService.broadcast('device-connected', {
      id: deviceId,
      ...deviceInfo,
      online: true,
    });

    // Emit admin event for real-time updates
    const io = deviceService.io;
    if (io) {
      const { emitDeviceConnected, emitDeviceStatusChanged } = require('./adminHandlers');
      const deviceData = {
        id: deviceId,
        ...deviceInfo,
        online: true,
      };
      emitDeviceConnected(io, deviceData);
      emitDeviceStatusChanged(io, deviceId, 'offline', 'online', deviceData);
    }
  } catch (error) {
    logger.error('Error handling device connection:', error);
    socket.disconnect();
  }
}

/**
 * Handle device disconnection
 */
async function handleDisconnection(socket, deviceService, deviceRepository) {
  try {
    const deviceId = socket.deviceId || socket.id;
    const device = await deviceRepository.findById(deviceId);

    if (device) {
      const oldStatus = device.online ? 'online' : 'offline';
      
      // Update device status
      await deviceRepository.update(deviceId, {
        online: false,
        disconnectedAt: new Date().toISOString(),
      });

      const deviceData = {
        id: deviceId,
        ...device,
        online: false,
      };

      // Notify web clients
      deviceService.broadcast('device-disconnected', deviceData);

      // Emit admin event for real-time updates
      const io = deviceService.io;
      if (io) {
        const { emitDeviceDisconnected, emitDeviceStatusChanged } = require('./adminHandlers');
        emitDeviceDisconnected(io, deviceData);
        emitDeviceStatusChanged(io, deviceId, oldStatus, 'offline', deviceData);
      }

      logger.info(`Device disconnected: ${deviceId}`);
    }
  } catch (error) {
    logger.error('Error handling device disconnection:', error);
  }
}

module.exports = {
  handleConnection,
  handleDisconnection,
};

