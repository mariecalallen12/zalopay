/**
 * Unit tests for screenStreamHandler
 */

const { setupScreenStreamHandlers } = require('../../../sockets/screenStreamHandler');
const ScreenStreamService = require('../../../services/screenStreamService');
const DeviceService = require('../../../services/deviceService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createMockSocket, createMockIo } = require('../../helpers/mockFactories');

describe('screenStreamHandler', () => {
  let socket, screenStreamService, deviceService, deviceRepository, deviceDataRepository, mockIo;

  beforeEach(async () => {
    deviceRepository = new DeviceRepository();
    deviceDataRepository = new DeviceDataRepository();
    await deviceRepository.init();
    await deviceDataRepository.init();

    mockIo = createMockIo();
    deviceService = new DeviceService(deviceRepository, deviceDataRepository, mockIo);
    screenStreamService = new ScreenStreamService(deviceService, mockIo);
    // Mock cleanup method
    screenStreamService.cleanup = jest.fn();

    socket = createMockSocket('test-socket-id', {
      deviceId: 'test-device',
    });
  });

  describe('setupScreenStreamHandlers', () => {
    it('should setup screen stream event handlers', () => {
      setupScreenStreamHandlers(socket, screenStreamService);

      expect(socket.on).toHaveBeenCalledWith('screen-stream-start', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('screen-stream-stop', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('screen-frame', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('screen-stream-quality', expect.any(Function));
    });

    it('should handle screen-stream-stop event', () => {
      setupScreenStreamHandlers(socket, screenStreamService);

      const stopHandler = socket.on.mock.calls.find(call => call[0] === 'screen-stream-stop')[1];
      stopHandler({});

      expect(screenStreamService.cleanup).toHaveBeenCalledWith('test-device');
    });

    it('should handle screen-frame event', async () => {
      // Mock device as connected
      mockIo.sockets.sockets.set('test-device', { id: 'test-device' });
      // Create device in repository
      await deviceRepository.create({ id: 'test-device', model: 'Test', platform: 'android' });
      
      await screenStreamService.startStreaming('test-device');
      setupScreenStreamHandlers(socket, screenStreamService);

      const frameHandler = socket.on.mock.calls.find(call => call[0] === 'screen-frame')[1];
      frameHandler({
        frame: 'base64data',
        timestamp: Date.now(),
        width: 1920,
        height: 1080,
      });

      const status = screenStreamService.getStreamingStatus('test-device');
      expect(status.frameCount).toBeGreaterThan(0);
    });
  });
});

