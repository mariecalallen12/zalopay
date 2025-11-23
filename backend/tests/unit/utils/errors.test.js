/**
 * Unit tests for error classes
 */

const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PlatformNotSupportedError,
  UnsupportedActionError,
} = require('../../../utils/errors');

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create AppError with default status code', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create AppError with custom status code', () => {
      const error = new AppError('Test error', 400);
      expect(error.statusCode).toBe(400);
    });

    it('should create AppError with isOperational flag', () => {
      const error = new AppError('Test error', 500, false);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with status 400', () => {
      const error = new ValidationError('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.errors).toEqual([]);
    });

    it('should create ValidationError with errors array', () => {
      const errors = [{ field: 'email', message: 'Invalid' }];
      const error = new ValidationError('Validation failed', errors);
      expect(error.errors).toEqual(errors);
    });
  });

  describe('AuthenticationError', () => {
    it('should create AuthenticationError with status 401', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication failed');
    });

    it('should create AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Custom auth error');
      expect(error.message).toBe('Custom auth error');
    });
  });

  describe('AuthorizationError', () => {
    it('should create AuthorizationError with status 403', () => {
      const error = new AuthorizationError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with status 404', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should create NotFoundError with custom resource name', () => {
      const error = new NotFoundError('Device');
      expect(error.message).toBe('Device not found');
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with status 409', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
    });
  });

  describe('RateLimitError', () => {
    it('should create RateLimitError with status 429', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
    });
  });

  describe('PlatformNotSupportedError', () => {
    it('should create PlatformNotSupportedError with platform info', () => {
      const error = new PlatformNotSupportedError('windows');
      expect(error.statusCode).toBe(400);
      expect(error.platform).toBe('windows');
      expect(error.action).toBeNull();
    });

    it('should create PlatformNotSupportedError with action info', () => {
      const error = new PlatformNotSupportedError('windows', 'phishing');
      expect(error.platform).toBe('windows');
      expect(error.action).toBe('phishing');
      expect(error.message).toContain('phishing');
      expect(error.message).toContain('windows');
    });
  });

  describe('UnsupportedActionError', () => {
    it('should create UnsupportedActionError', () => {
      const error = new UnsupportedActionError('phishing', 'ios');
      expect(error.statusCode).toBe(400);
      expect(error.action).toBe('phishing');
      expect(error.platform).toBe('ios');
      expect(error.message).toContain('phishing');
      expect(error.message).toContain('ios');
    });
  });
});

