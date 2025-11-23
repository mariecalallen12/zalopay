/**
 * Remote control socket handlers
 */

const logger = require('../utils/logger');

/**
 * Setup remote control handlers for a socket
 */
function setupRemoteControlHandlers(socket, remoteControlService) {
  // Handle remote control start from device
  socket.on('remote-control-start', async (data) => {
    try {
      const deviceId = socket.deviceId || socket.id;
      logger.info(`Device ${deviceId} started remote control`);
      
      // Device is ready for remote control
      // The actual start is initiated from web client via API
      // This event is just acknowledgment from device
    } catch (error) {
      logger.error('Error handling remote-control-start:', error);
    }
  });

  // Handle remote control stop from device
  socket.on('remote-control-stop', async (data) => {
    try {
      const deviceId = socket.deviceId || socket.id;
      logger.info(`Device ${deviceId} stopped remote control`);
      
      // Clean up session
      remoteControlService.cleanup(deviceId);
    } catch (error) {
      logger.error('Error handling remote-control-stop:', error);
    }
  });

  // Handle remote control command from web client
  socket.on('remote-control-command', async (command) => {
    try {
      const deviceId = command.deviceId;
      
      if (!deviceId) {
        logger.warn('Remote control command missing deviceId');
        return;
      }

      // Send command to device
      await remoteControlService.sendCommand(deviceId, command);
    } catch (error) {
      logger.error('Error handling remote-control-command:', error);
      
      // Notify client of error
      socket.emit('remote-control-error', {
        error: error.message,
        command: command,
      });
    }
  });

  // Handle device disconnect - cleanup control
  socket.on('disconnect', () => {
    try {
      const deviceId = socket.deviceId || socket.id;
      
      // Clean up control session
      if (remoteControlService.isControlling(deviceId)) {
        remoteControlService.cleanup(deviceId);
      }
    } catch (error) {
      logger.error('Error cleaning up remote control on disconnect:', error);
    }
  });
}

module.exports = {
  setupRemoteControlHandlers,
};


