/**
 * Socket.IO authentication middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Socket.IO authentication middleware
 */
function socketAuth(socket, next) {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      // For now, allow connections without auth (backward compatibility)
      // In production, you should require authentication
      logger.warn(`Socket connection without token: ${socket.id}`);
      socket.authenticated = false;
      return next();
    }

    // Verify token
    jwt.verify(token, config.security.jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn(`Socket authentication failed: ${err.message}`);
        socket.authenticated = false;
        return next();
      }

      socket.user = decoded;
      socket.authenticated = true;
      next();
    });
  } catch (error) {
    logger.error('Socket authentication error:', error);
    socket.authenticated = false;
    next();
  }
}

/**
 * Require authentication for socket
 */
function requireSocketAuth(socket, next) {
  if (!socket.authenticated) {
    return next(new Error('Authentication required'));
  }
  next();
}

module.exports = {
  socketAuth,
  requireSocketAuth,
};

