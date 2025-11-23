/**
 * Unit tests for errorHandler middleware
 */

const { errorHandler, asyncHandler, notFoundHandler } = require('../../../middleware/errorHandler');
const {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
} = require('../../../utils/errors');
const {
  createMockRequest,
  createMockResponse,
  createMockNext,
} = require('../../helpers/mockFactories');

describe('errorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  it('should handle AppError', () => {
    const error = new AppError('Test error', 400);
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Test error',
        }),
      })
    );
  });

  it('should handle ValidationError with errors array', () => {
    const error = new ValidationError('Validation failed', [{ field: 'test', message: 'Invalid' }]);
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Validation failed',
          errors: [{ field: 'test', message: 'Invalid' }],
        }),
      })
    );
  });

  it('should handle ValidationError (express-validator)', () => {
    const error = { name: 'ValidationError', message: 'Validation failed' };
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Validation error',
        }),
      })
    );
  });

  it('should handle JWT JsonWebTokenError', () => {
    const error = { name: 'JsonWebTokenError', message: 'Invalid token' };
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Invalid token',
        }),
      })
    );
  });

  it('should handle JWT TokenExpiredError', () => {
    const error = { name: 'TokenExpiredError', message: 'Token expired' };
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Token expired',
        }),
      })
    );
  });

  it('should handle MulterError', () => {
    const error = { name: 'MulterError', message: 'File too large' };
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'File upload error',
        }),
      })
    );
  });

  it('should handle unknown errors', () => {
    const error = new Error('Unknown error');
    error.statusCode = 500;
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.any(String),
        }),
      })
    );
  });

  it('should include stack trace in development mode', () => {
    const config = require('../../../config');
    const originalIsDevelopment = config.server.isDevelopment;
    
    // Force isDevelopment to true for this test
    Object.defineProperty(config.server, 'isDevelopment', {
      value: true,
      writable: true,
      configurable: true,
    });
    
    const error = new Error('Test error');
    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          stack: expect.any(String),
        }),
      })
    );
    
    // Restore original value
    Object.defineProperty(config.server, 'isDevelopment', {
      value: originalIsDevelopment,
      writable: true,
      configurable: true,
    });
  });
});

describe('asyncHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  it('should call next with error when async function throws', async () => {
    const asyncFn = async () => {
      throw new Error('Async error');
    };

    const handler = asyncHandler(asyncFn);
    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should execute async function successfully', async () => {
    const asyncFn = async (req, res) => {
      res.json({ success: true });
    };

    const handler = asyncHandler(asyncFn);
    await handler(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle promise rejection', async () => {
    const asyncFn = () => {
      return Promise.reject(new Error('Promise rejected'));
    };

    const handler = asyncHandler(asyncFn);
    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('notFoundHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest({ method: 'GET', url: '/unknown' });
    res = createMockResponse();
    next = createMockNext();
  });

  it('should return 404 with route information', () => {
    notFoundHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Route GET /unknown not found',
        }),
      })
    );
  });
});

