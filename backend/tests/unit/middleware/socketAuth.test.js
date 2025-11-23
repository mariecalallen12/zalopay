/**
 * Unit tests for socketAuth middleware
 */

const jwt = require('jsonwebtoken');
const { socketAuth, requireSocketAuth } = require('../../../middleware/socketAuth');
const config = require('../../../config');
const { createMockSocket } = require('../../helpers/mockFactories');

// Mock jwt
jest.mock('jsonwebtoken');

describe('socketAuth', () => {
  let socket, next;

  beforeEach(() => {
    socket = createMockSocket('test-socket-id');
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should allow connection without token (backward compatibility)', () => {
    socket.handshake.auth = {};
    socket.handshake.query = {};

    socketAuth(socket, next);

    expect(socket.authenticated).toBe(false);
    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('should authenticate socket with valid token in auth', () => {
    const user = { id: '123', username: 'test' };
    socket.handshake.auth = { token: 'valid-token' };

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, user);
    });

    socketAuth(socket, next);

    expect(socket.user).toEqual(user);
    expect(socket.authenticated).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  it('should authenticate socket with valid token in query', () => {
    const user = { id: '123' };
    socket.handshake.query = { token: 'valid-token' };

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, user);
    });

    socketAuth(socket, next);

    expect(socket.user).toEqual(user);
    expect(socket.authenticated).toBe(true);
  });

    it('should set authenticated to false when token is invalid', () => {
      socket.handshake.auth = { token: 'invalid-token' };

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      socketAuth(socket, next);

      expect(socket.authenticated).toBe(false);
      expect(socket.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

  it('should prefer auth.token over query.token', () => {
    const user = { id: '123' };
    socket.handshake.auth = { token: 'auth-token' };
    socket.handshake.query = { token: 'query-token' };

    jwt.verify.mockImplementation((token, secret, callback) => {
      expect(token).toBe('auth-token');
      callback(null, user);
    });

    socketAuth(socket, next);

    expect(socket.user).toEqual(user);
  });
});

describe('requireSocketAuth', () => {
  let socket, next;

  beforeEach(() => {
    socket = createMockSocket('test-socket-id');
    next = jest.fn();
  });

  it('should call next with error when not authenticated', () => {
    socket.authenticated = false;

    requireSocketAuth(socket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should call next without error when authenticated', () => {
    socket.authenticated = true;

    requireSocketAuth(socket, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});

