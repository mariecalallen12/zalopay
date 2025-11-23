/**
 * Rate limiting middleware
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const { RateLimitError } = require('../utils/errors');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.floor(config.rateLimit.maxRequests / 2),
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Socket.IO rate limiter (in-memory store)
 */
class SocketRateLimiter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  check(socketId) {
    const now = Date.now();
    const userRequests = this.requests.get(socketId) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(socketId, validRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(now);
    }

    return true;
  }

  cleanup(now) {
    for (const [socketId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(
        timestamp => now - timestamp < this.windowMs
      );
      
      if (validRequests.length === 0) {
        this.requests.delete(socketId);
      } else {
        this.requests.set(socketId, validRequests);
      }
    }
  }
}

const socketRateLimiter = new SocketRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.maxRequests
);

/**
 * Socket.IO rate limit middleware
 */
function socketRateLimit(socket, next) {
  const socketId = socket.id;
  
  if (!socketRateLimiter.check(socketId)) {
    return next(new RateLimitError('Too many requests'));
  }
  
  next();
}

module.exports = {
  apiLimiter,
  strictLimiter,
  socketRateLimit,
};

