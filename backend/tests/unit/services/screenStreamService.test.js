/**
 * Unit tests for ScreenStreamService
 */

const ScreenStreamService = require('../../../services/screenStreamService');
const { NotFoundError, ValidationError } = require('../../../utils/errors');
const {
  createMockIo,
  createMockDeviceService,
} = require('../../helpers/mockFactories');

describe('ScreenStreamService', () => {
  let screenStreamService;
  let mockDeviceService;
  let mockIo;

  beforeEach(() => {
    mockIo = createMockIo();
    mockDeviceService = createMockDeviceService();
    screenStreamService = new ScreenStreamService(mockDeviceService, mockIo);
  });

  describe('getDefaultQualitySettings', () => {
    it('should return default quality settings', () => {
      const settings = screenStreamService.getDefaultQualitySettings();
      
      expect(settings.fps).toBe(15);
      expect(settings.resolution).toBe('half');
      expect(settings.compression).toBe(75);
      expect(settings.width).toBeNull();
      expect(settings.height).toBeNull();
    });
  });

  describe('startStreaming', () => {
    it('should throw NotFoundError when device is not connected', async () => {
      mockDeviceService.isDeviceConnected.mockReturnValue(false);

      await expect(
        screenStreamService.startStreaming('device-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when already streaming', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await screenStreamService.startStreaming(deviceId);
      
      await expect(
        screenStreamService.startStreaming(deviceId)
      ).rejects.toThrow(ValidationError);
    });

    it('should start streaming successfully', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);

      const result = await screenStreamService.startStreaming(deviceId);

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session.deviceId).toBe(deviceId);
      expect(result.session.active).toBe(true);
      expect(mockDeviceService.emitToDevice).toHaveBeenCalledWith(
        deviceId,
        'screen-stream-start',
        expect.any(Object)
      );
      expect(mockIo.emit).toHaveBeenCalledWith('screen-stream-started', expect.any(Object));
    });

    it('should use custom quality settings', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      const customSettings = {
        fps: 30,
        resolution: 'full',
        compression: 90,
      };

      const result = await screenStreamService.startStreaming(deviceId, customSettings);

      expect(result.session.settings.fps).toBe(30);
      expect(result.session.settings.resolution).toBe('full');
      expect(result.session.settings.compression).toBe(90);
    });

    it('should merge custom settings with defaults', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      const customSettings = { fps: 20 };

      const result = await screenStreamService.startStreaming(deviceId, customSettings);

      expect(result.session.settings.fps).toBe(20);
      expect(result.session.settings.resolution).toBe('half'); // Default
      expect(result.session.settings.compression).toBe(75); // Default
    });
  });

  describe('stopStreaming', () => {
    it('should throw ValidationError when not streaming', async () => {
      await expect(
        screenStreamService.stopStreaming('device-id')
      ).rejects.toThrow(ValidationError);
    });

    it('should stop streaming successfully', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await screenStreamService.startStreaming(deviceId);
      const result = await screenStreamService.stopStreaming(deviceId);

      expect(result.success).toBe(true);
      expect(mockDeviceService.emitToDevice).toHaveBeenCalledWith(
        deviceId,
        'screen-stream-stop',
        {}
      );
      expect(mockIo.emit).toHaveBeenCalledWith('screen-stream-stopped', expect.any(Object));
      expect(screenStreamService.isStreaming(deviceId)).toBe(false);
    });

    it('should clean up session data', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await screenStreamService.startStreaming(deviceId);
      await screenStreamService.stopStreaming(deviceId);

      expect(screenStreamService.getStreamingStatus(deviceId).active).toBe(false);
    });
  });

  describe('updateQualitySettings', () => {
    it('should throw ValidationError when not streaming', async () => {
      await expect(
        screenStreamService.updateQualitySettings('device-id', { fps: 20 })
      ).rejects.toThrow(ValidationError);
    });

    it('should update quality settings successfully', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await screenStreamService.startStreaming(deviceId);
      const result = await screenStreamService.updateQualitySettings(deviceId, {
        fps: 25,
        compression: 85,
      });

      expect(result.success).toBe(true);
      expect(result.settings.fps).toBe(25);
      expect(result.settings.compression).toBe(85);
      expect(mockDeviceService.emitToDevice).toHaveBeenCalledWith(
        deviceId,
        'screen-stream-quality',
        expect.any(Object)
      );
    });

    it('should validate FPS range', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await screenStreamService.startStreaming(deviceId);

      await expect(
        screenStreamService.updateQualitySettings(deviceId, { fps: 3 })
      ).rejects.toThrow(ValidationError);

      await expect(
        screenStreamService.updateQualitySettings(deviceId, { fps: 35 })
      ).rejects.toThrow(ValidationError);
    });

    it('should validate compression range', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await screenStreamService.startStreaming(deviceId);

      await expect(
        screenStreamService.updateQualitySettings(deviceId, { compression: 50 })
      ).rejects.toThrow(ValidationError);

      await expect(
        screenStreamService.updateQualitySettings(deviceId, { compression: 95 })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('handleFrame', () => {
    it('should ignore frames when not streaming', () => {
      const deviceId = 'test-device';
      const frameData = { frame: 'base64data', timestamp: Date.now() };

      screenStreamService.handleFrame(deviceId, frameData);
      expect(mockIo.emit).not.toHaveBeenCalled();
    });

    it('should handle frame data when streaming', () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      screenStreamService.startStreaming(deviceId);
      
      const frameData = {
        frame: 'base64data',
        timestamp: Date.now(),
        width: 1920,
        height: 1080,
      };

      screenStreamService.handleFrame(deviceId, frameData);

      expect(mockIo.emit).toHaveBeenCalledWith('screen-frame-broadcast', expect.any(Object));
    });

    it('should manage frame buffer size', () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      screenStreamService.startStreaming(deviceId);

      // Add more than maxSize frames
      for (let i = 0; i < 10; i++) {
        screenStreamService.handleFrame(deviceId, {
          frame: `frame${i}`,
          timestamp: Date.now() + i,
        });
      }

      const status = screenStreamService.getStreamingStatus(deviceId);
      expect(status.bufferSize).toBeLessThanOrEqual(5); // maxSize
    });
  });

  describe('getStreamingStatus', () => {
    it('should return inactive status when not streaming', () => {
      const status = screenStreamService.getStreamingStatus('device-id');
      expect(status.active).toBe(false);
    });

    it('should return active status with details when streaming', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await screenStreamService.startStreaming(deviceId);
      const status = screenStreamService.getStreamingStatus(deviceId);

      expect(status.active).toBe(true);
      expect(status.startedAt).toBeDefined();
      expect(status.frameCount).toBe(0);
      expect(status.settings).toBeDefined();
    });
  });

  describe('isStreaming', () => {
    it('should return false when not streaming', () => {
      expect(screenStreamService.isStreaming('device-id')).toBe(false);
    });

    it('should return true when streaming', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await screenStreamService.startStreaming(deviceId);
      expect(screenStreamService.isStreaming(deviceId)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should clean up streaming session', async () => {
      const deviceId = 'test-device';
      mockDeviceService.isDeviceConnected.mockReturnValue(true);
      
      await screenStreamService.startStreaming(deviceId);
      screenStreamService.cleanup(deviceId);

      expect(screenStreamService.isStreaming(deviceId)).toBe(false);
      expect(mockIo.emit).toHaveBeenCalledWith('screen-stream-stopped', expect.objectContaining({
        deviceId,
        reason: 'device_disconnected',
      }));
    });
  });
});

