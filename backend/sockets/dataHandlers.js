/**
 * Socket.IO data handlers
 */

const logger = require('../utils/logger');
const { normalizePlatformData } = require('../utils/platformUtils');

/**
 * Handle data event from device
 */
async function handleData(socket, dataPacket, deviceService) {
  try {
    const deviceId = socket.deviceId || socket.id;
    const { type, payload } = dataPacket;

    if (!type) {
      logger.warn(`Data packet missing type from device ${deviceId}`);
      return;
    }

    // Get device platform for data normalization
    const platform = socket.platform || 'android';
    
    // Normalize platform-specific data formats
    const normalizedPayload = normalizePlatformData(payload, platform);

    // Update device data
    await deviceService.updateDeviceData(deviceId, type, normalizedPayload);

    // Emit to web clients
    deviceService.broadcast('device-data-update', {
      deviceId: deviceId,
      type: type,
      data: payload,
    });

    logger.debug(`Device data updated: ${deviceId} - ${type}`);
  } catch (error) {
    logger.error('Error handling data event:', error);
  }
}

/**
 * Handle command response from device
 */
async function handleCommandResponse(socket, response, deviceService) {
  try {
    const deviceId = socket.deviceId || socket.id;
    const { request, result } = response;

    if (!request) {
      logger.warn(`Command response missing request from device ${deviceId}`);
      return;
    }

    // Get device platform for data normalization
    const platform = socket.platform || 'android';
    
    // Normalize platform-specific data formats
    const normalizedResult = normalizePlatformData(result, platform);

    // Update device data from command response
    await deviceService.updateDeviceDataFromResponse(deviceId, request, normalizedResult);

    // Emit to web clients
    deviceService.broadcast('device-data-update', {
      deviceId: deviceId,
      type: request,
      data: result,
    });

    logger.debug(`Command response received: ${deviceId} - ${request}`);
  } catch (error) {
    logger.error('Error handling command response:', error);
  }
}

/**
 * Handle message event from device
 */
async function handleMessage(socket, messageData, deviceService) {
  try {
    const deviceId = socket.deviceId || socket.id;

    // Emit to web clients
    deviceService.broadcast('device-message', {
      deviceId: deviceId,
      message: messageData,
    });

    logger.debug(`Message received from device ${deviceId}`);
  } catch (error) {
    logger.error('Error handling message event:', error);
  }
}

/**
 * Handle file event from device
 */
async function handleFile(socket, fileData, deviceService) {
  try {
    const deviceId = socket.deviceId || socket.id;

    // Update device data
    await deviceService.updateDeviceData(deviceId, 'file', fileData);

    // Emit to web clients
    deviceService.broadcast('device-file', {
      deviceId: deviceId,
      file: fileData,
    });

    logger.info(`File received from device ${deviceId}: ${fileData.name}`);
  } catch (error) {
    logger.error('Error handling file event:', error);
  }
}

module.exports = {
  handleData,
  handleCommandResponse,
  handleMessage,
  handleFile,
};

