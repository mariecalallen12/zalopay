/**
 * Socket.IO error handler
 */

const logger = require('../utils/logger');

/**
 * Handle socket errors
 */
function handleSocketError(socket, error) {
  logger.error('Socket error:', {
    error: error.message,
    stack: error.stack,
    deviceId: socket.deviceId || socket.id,
    model: socket.model || 'unknown',
  });

  // Disconnect socket on error
  socket.disconnect(true);
}

/**
 * Handle socket disconnection
 */
function handleSocketDisconnect(socket, reason) {
  logger.info('Socket disconnected:', {
    deviceId: socket.deviceId || socket.id,
    reason: reason,
  });
}

module.exports = {
  handleSocketError,
  handleSocketDisconnect,
};

