/**
 * Socket.IO reconnection handler
 */

const logger = require('../utils/logger');

/**
 * Handle socket reconnection
 */
async function handleReconnection(socket, deviceService, deviceRepository) {
  const deviceId = socket.deviceId || socket.id;
  
  logger.info(`Socket reconnecting: ${deviceId}`);
  
  try {
    // Update device status
    const device = await deviceRepository.findById(deviceId);
    if (device) {
      await deviceRepository.update(deviceId, {
        online: true,
        reconnectedAt: new Date().toISOString(),
      });
      
      // Notify web clients
      deviceService.broadcast('device-reconnected', {
        id: deviceId,
        ...device,
        online: true,
      });
    }
  } catch (error) {
    logger.error('Error handling reconnection:', error);
  }
}

/**
 * Setup reconnection handling for socket
 */
function setupReconnectionHandling(socket, deviceService, deviceRepository) {
  socket.on('reconnect', () => {
    handleReconnection(socket, deviceService, deviceRepository);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    logger.debug(`Socket reconnection attempt ${attemptNumber}: ${socket.id}`);
  });

  socket.on('reconnect_error', (error) => {
    logger.warn(`Socket reconnection error: ${socket.id}`, error.message);
  });

  socket.on('reconnect_failed', () => {
    logger.error(`Socket reconnection failed: ${socket.id}`);
  });
}

module.exports = {
  handleReconnection,
  setupReconnectionHandling,
};

