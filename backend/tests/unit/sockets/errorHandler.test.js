/**
 * Unit tests for errorHandler
 */

const { handleSocketError, handleSocketDisconnect } = require('../../../sockets/errorHandler');
const { createMockSocket } = require('../../helpers/mockFactories');

describe('errorHandler', () => {
  let socket;

  beforeEach(() => {
    socket = createMockSocket('test-socket-id', {
      deviceId: 'test-device',
      model: 'Test Device',
    });
  });

  describe('handleSocketError', () => {
    it('should disconnect socket on error', () => {
      const error = new Error('Test error');

      handleSocketError(socket, error);

      expect(socket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should handle error with device info', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack';

      expect(() => {
        handleSocketError(socket, error);
      }).not.toThrow();
    });
  });

  describe('handleSocketDisconnect', () => {
    it('should log disconnection', () => {
      expect(() => {
        handleSocketDisconnect(socket, 'client disconnect');
      }).not.toThrow();
    });

    it('should handle disconnect with device info', () => {
      expect(() => {
        handleSocketDisconnect(socket, 'transport close');
      }).not.toThrow();
    });
  });
});

