/**
 * Unit tests for auth middleware
 */

const jwt = require('jsonwebtoken');
const { authenticateToken, optionalAuth, generateToken } = require('../../../middleware/auth');
const { AuthenticationError } = require('../../../utils/errors');
const config = require('../../../config');
const {
  createMockRequest,
  createMockResponse,
  createMockNext,
} = require('../../helpers/mockFactories');

// Mock jwt
jest.mock('jsonwebtoken');

describe('authenticateToken', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  it('should throw AuthenticationError when no token provided', () => {
    req.headers = {};

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it('should throw AuthenticationError when token is invalid', () => {
    req.headers = {
      authorization: 'Bearer invalid-token',
    };

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });

  it('should set req.user when token is valid', () => {
    const user = { id: '123', username: 'test' };
    req.headers = {
      authorization: 'Bearer valid-token',
    };

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, user);
    });

    authenticateToken(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('should extract token from Bearer header', () => {
    const user = { id: '123' };
    req.headers = {
      authorization: 'Bearer test-token-123',
    };

    jwt.verify.mockImplementation((token, secret, callback) => {
      expect(token).toBe('test-token-123');
      callback(null, user);
    });

    authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      'test-token-123',
      config.security.jwtSecret,
      expect.any(Function)
    );
  });
});

describe('optionalAuth', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  it('should call next when no token provided', () => {
    req.headers = {};

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should set req.user when valid token provided', () => {
    const user = { id: '123' };
    req.headers = {
      authorization: 'Bearer valid-token',
    };

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, user);
    });

    optionalAuth(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it('should call next even when token is invalid', () => {
    req.headers = {
      authorization: 'Bearer invalid-token',
    };

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid'), null);
    });

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});

describe('generateToken', () => {
  it('should generate JWT token', () => {
    const payload = { id: '123', username: 'test' };
    const mockToken = 'generated-token';

    jwt.sign.mockReturnValue(mockToken);

    const token = generateToken(payload);

    expect(token).toBe(mockToken);
    expect(jwt.sign).toHaveBeenCalledWith(
      payload,
      config.security.jwtSecret,
      { expiresIn: config.security.jwtExpiresIn }
    );
  });
});

