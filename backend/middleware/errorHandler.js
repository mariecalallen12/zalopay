/**
 * Centralized error handling middleware
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const config = require('../config');

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(err.errors && { errors: err.errors }),
        ...(config.server.isDevelopment && { stack: err.stack }),
      },
    });
  }

  // Handle validation errors (express-validator)
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: err.message,
        ...(config.server.isDevelopment && { stack: err.stack }),
      },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        ...(config.server.isDevelopment && { details: err.message }),
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expired',
        ...(config.server.isDevelopment && { details: err.message }),
      },
    });
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'File upload error',
        details: err.message,
      },
    });
  }

  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  const message = config.server.isProduction
    ? 'Internal server error'
    : err.message;

  const errorResponse = {
    success: false,
    error: {
      message,
    },
  };

  // Include stack trace in development mode
  if (config.server.isDevelopment) {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.message;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler
 */
function notFoundHandler(req, res, next) {
  const method = req.method || 'GET';
  const path = req.path || req.url || '/unknown';
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${method} ${path} not found`,
    },
  });
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
};

