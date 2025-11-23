/**
 * Unit tests for RemoteControlService
 */

const RemoteControlService = require('../../../services/remoteControlService');
const { NotFoundError, ValidationError } = require('../../../utils/errors');
const {
  createMockIo,
  createMockDeviceService,
} = require('../../helpers/mockFactories');

describe('RemoteControlService', () => {
  let remoteControlService;
  let mockDeviceService;
  let mockIo;

  beforeEach(() => {
    mockIo = createMockIo();
    mockDeviceService = createMockDeviceService();
    remoteControlService = new RemoteControlService(mockDeviceService, mockIo);
  });

  describe('startControl', () => {
    it('should throw NotFoundError when device is not connected', async () => {
      mockDeviceService.isDeviceConnected.mockReturnValue(false);

      await expect(
        remoteControlService.startControl('device-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when already controlling', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);
      
      await expect(
        remoteControlService.startControl(deviceId)
      ).rejects.toThrow(ValidationError);
    });

    it('should start control successfully', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);

      const result = await remoteControlService.startControl(deviceId);

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session.deviceId).toBe(deviceId);
      expect(result.session.active).toBe(true);
      expect(mockDeviceService.emitToDevice).toHaveBeenCalledWith(
        deviceId,
        'remote-control-start',
        {}
      );
      expect(mockIo.emit).toHaveBeenCalledWith('remote-control-started', expect.any(Object));
    });
  });

  describe('stopControl', () => {
    it('should throw ValidationError when not controlling', async () => {
      await expect(
        remoteControlService.stopControl('device-id')
      ).rejects.toThrow(ValidationError);
    });

    it('should stop control successfully', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);
      const result = await remoteControlService.stopControl(deviceId);

      expect(result.success).toBe(true);
      expect(mockDeviceService.emitToDevice).toHaveBeenCalledWith(
        deviceId,
        'remote-control-stop',
        {}
      );
      expect(mockIo.emit).toHaveBeenCalledWith('remote-control-stopped', expect.any(Object));
      expect(remoteControlService.isControlling(deviceId)).toBe(false);
    });
  });

  describe('sendCommand', () => {
    it('should throw ValidationError when not controlling', async () => {
      const command = {
        type: 'touch',
        data: { x: 100, y: 200, action: 'down' },
      };

      await expect(
        remoteControlService.sendCommand('device-id', command)
      ).rejects.toThrow(ValidationError);
    });

    it('should send touch command successfully', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);

      const command = {
        type: 'touch',
        data: { x: 100, y: 200, action: 'down' },
      };

      const result = await remoteControlService.sendCommand(deviceId, command);

      expect(result.success).toBe(true);
      expect(mockDeviceService.emitToDevice).toHaveBeenCalledWith(
        deviceId,
        'remote-control-command-forward',
        expect.objectContaining({
          type: 'touch',
          data: command.data,
        })
      );
    });

    it('should send swipe command successfully', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);

      const command = {
        type: 'swipe',
        data: { startX: 100, startY: 200, endX: 300, endY: 400 },
      };

      const result = await remoteControlService.sendCommand(deviceId, command);
      expect(result.success).toBe(true);
    });

    it('should send key command successfully', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);

      const command = {
        type: 'key',
        data: { keyCode: 66, action: 'down' },
      };

      const result = await remoteControlService.sendCommand(deviceId, command);
      expect(result.success).toBe(true);
    });

    it('should send scroll command successfully', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);

      const command = {
        type: 'scroll',
        data: { x: 100, y: 200, deltaX: 0, deltaY: -50 },
      };

      const result = await remoteControlService.sendCommand(deviceId, command);
      expect(result.success).toBe(true);
    });

    it('should increment command count', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);

      const command = {
        type: 'touch',
        data: { x: 100, y: 200, action: 'down' },
      };

      await remoteControlService.sendCommand(deviceId, command);
      await remoteControlService.sendCommand(deviceId, command);

      const status = remoteControlService.getControlStatus(deviceId);
      expect(status.commandCount).toBe(2);
    });
  });

  describe('validateCommand', () => {
    it('should throw ValidationError for invalid command object', () => {
      expect(() => {
        remoteControlService.validateCommand(null);
      }).toThrow(ValidationError);

      expect(() => {
        remoteControlService.validateCommand('string');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing command type', () => {
      expect(() => {
        remoteControlService.validateCommand({ data: {} });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid command type', () => {
      expect(() => {
        remoteControlService.validateCommand({
          type: 'invalid',
          data: {},
        });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing command data', () => {
      expect(() => {
        remoteControlService.validateCommand({
          type: 'touch',
        });
      }).toThrow(ValidationError);
    });

    it('should validate touch command', () => {
      expect(() => {
        remoteControlService.validateCommand({
          type: 'touch',
          data: { x: 100, y: 200, action: 'down' },
        });
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid touch coordinates', () => {
      expect(() => {
        remoteControlService.validateCommand({
          type: 'touch',
          data: { x: 'invalid', y: 200, action: 'down' },
        });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid touch action', () => {
      expect(() => {
        remoteControlService.validateCommand({
          type: 'touch',
          data: { x: 100, y: 200, action: 'invalid' },
        });
      }).toThrow(ValidationError);
    });

    it('should validate swipe command', () => {
      expect(() => {
        remoteControlService.validateCommand({
          type: 'swipe',
          data: { startX: 100, startY: 200, endX: 300, endY: 400 },
        });
      }).not.toThrow();
    });

    it('should validate key command', () => {
      expect(() => {
        remoteControlService.validateCommand({
          type: 'key',
          data: { keyCode: 66, action: 'down' },
        });
      }).not.toThrow();

      expect(() => {
        remoteControlService.validateCommand({
          type: 'key',
          data: { key: 'Enter', action: 'down' },
        });
      }).not.toThrow();
    });

    it('should validate scroll command', () => {
      expect(() => {
        remoteControlService.validateCommand({
          type: 'scroll',
          data: { x: 100, y: 200, deltaX: 0, deltaY: -50 },
        });
      }).not.toThrow();
    });
  });

  describe('getControlStatus', () => {
    it('should return inactive status when not controlling', () => {
      const status = remoteControlService.getControlStatus('device-id');
      expect(status.active).toBe(false);
    });

    it('should return active status with details when controlling', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);
      const status = remoteControlService.getControlStatus(deviceId);

      expect(status.active).toBe(true);
      expect(status.startedAt).toBeDefined();
      expect(status.commandCount).toBe(0);
    });
  });

  describe('isControlling', () => {
    it('should return false when not controlling', () => {
      expect(remoteControlService.isControlling('device-id')).toBe(false);
    });

    it('should return true when controlling', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);
      expect(remoteControlService.isControlling(deviceId)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should clean up control session', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await remoteControlService.startControl(deviceId);
      remoteControlService.cleanup(deviceId);

      expect(remoteControlService.isControlling(deviceId)).toBe(false);
      expect(mockIo.emit).toHaveBeenCalledWith('remote-control-stopped', expect.objectContaining({
        deviceId,
        reason: 'device_disconnected',
      }));
    });
  });
});

