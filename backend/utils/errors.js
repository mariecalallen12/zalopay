/**
 * Custom error classes
 */

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

class PlatformNotSupportedError extends AppError {
  constructor(platform, action = null) {
    const message = action 
      ? `Action '${action}' is not supported on ${platform} platform`
      : `Platform '${platform}' is not supported`;
    super(message, 400);
    this.platform = platform;
    this.action = action;
  }
}

class UnsupportedActionError extends AppError {
  constructor(action, platform) {
    const message = `Action '${action}' is not supported on ${platform} platform`;
    super(message, 400);
    this.action = action;
    this.platform = platform;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PlatformNotSupportedError,
  UnsupportedActionError,
};

