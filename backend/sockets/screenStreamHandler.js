/**
 * Screen streaming socket handlers
 */

const logger = require('../utils/logger');

/**
 * Setup screen streaming handlers for a socket
 */
function setupScreenStreamHandlers(socket, screenStreamService) {
  // Handle screen stream start from device
  socket.on('screen-stream-start', async (data) => {
    try {
      const deviceId = socket.deviceId || socket.id;
      logger.info(`Device ${deviceId} requested screen stream start`);
      
      // Device is ready to start streaming
      // The actual start is initiated from web client via API
      // This event is just acknowledgment from device
    } catch (error) {
      logger.error('Error handling screen-stream-start:', error);
    }
  });

  // Handle screen stream stop from device
  socket.on('screen-stream-stop', async (data) => {
    try {
      const deviceId = socket.deviceId || socket.id;
      logger.info(`Device ${deviceId} stopped screen streaming`);
      
      // Clean up session
      screenStreamService.cleanup(deviceId);
    } catch (error) {
      logger.error('Error handling screen-stream-stop:', error);
    }
  });

  // Handle screen frame from device
  socket.on('screen-frame', (frameData) => {
    try {
      const deviceId = socket.deviceId || socket.id;
      
      // Process frame
      screenStreamService.handleFrame(deviceId, frameData);
    } catch (error) {
      logger.error('Error handling screen-frame:', error);
    }
  });

  // Handle screen stream quality update from device
  socket.on('screen-stream-quality', async (data) => {
    try {
      const deviceId = socket.deviceId || socket.id;
      logger.debug(`Device ${deviceId} updated screen stream quality`);
      
      // Device acknowledged quality change
    } catch (error) {
      logger.error('Error handling screen-stream-quality:', error);
    }
  });

  // Handle device disconnect - cleanup streaming
  socket.on('disconnect', () => {
    try {
      const deviceId = socket.deviceId || socket.id;
      
      // Clean up streaming session
      if (screenStreamService.isStreaming(deviceId)) {
        screenStreamService.cleanup(deviceId);
      }
    } catch (error) {
      logger.error('Error cleaning up screen streaming on disconnect:', error);
    }
  });
}

module.exports = {
  setupScreenStreamHandlers,
};


