/**
 * Unit tests for remoteControlHandler
 */

const { setupRemoteControlHandlers } = require('../../../sockets/remoteControlHandler');
const RemoteControlService = require('../../../services/remoteControlService');
const DeviceService = require('../../../services/deviceService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createMockSocket, createMockIo } = require('../../helpers/mockFactories');

describe('remoteControlHandler', () => {
  let socket, remoteControlService, deviceService, deviceRepository, deviceDataRepository, mockIo;

  beforeEach(async () => {
    deviceRepository = new DeviceRepository();
    deviceDataRepository = new DeviceDataRepository();
    await deviceRepository.init();
    await deviceDataRepository.init();

    mockIo = createMockIo();
    deviceService = new DeviceService(deviceRepository, deviceDataRepository, mockIo);
    remoteControlService = new RemoteControlService(deviceService, mockIo);
    // Mock cleanup method
    remoteControlService.cleanup = jest.fn();
    remoteControlService.sendCommand = jest.fn().mockResolvedValue({ success: true });

    socket = createMockSocket('test-socket-id', {
      deviceId: 'test-device',
    });
  });

  describe('setupRemoteControlHandlers', () => {
    it('should setup remote control event handlers', () => {
      setupRemoteControlHandlers(socket, remoteControlService);

      expect(socket.on).toHaveBeenCalledWith('remote-control-start', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('remote-control-stop', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('remote-control-command', expect.any(Function));
    });

    it('should handle remote-control-stop event', () => {
      setupRemoteControlHandlers(socket, remoteControlService);

      const stopHandler = socket.on.mock.calls.find(call => call[0] === 'remote-control-stop')[1];
      stopHandler({});

      expect(remoteControlService.cleanup).toHaveBeenCalledWith('test-device');
    });

    it('should handle remote-control-command event', async () => {
      // Mock device as connected
      mockIo.sockets.sockets.set('test-device', { id: 'test-device' });
      // Create device in repository
      const DeviceRepository = require('../../../repositories/deviceRepository');
      const deviceRepository = new DeviceRepository();
      await deviceRepository.init();
      await deviceRepository.create({ id: 'test-device', model: 'Test', platform: 'android' });
      
      await remoteControlService.startControl('test-device');
      setupRemoteControlHandlers(socket, remoteControlService);

      const commandHandler = socket.on.mock.calls.find(call => call[0] === 'remote-control-command')[1];
      await commandHandler({
        deviceId: 'test-device',
        type: 'touch',
        data: { x: 100, y: 200, action: 'down' },
      });

      expect(remoteControlService.sendCommand).toHaveBeenCalled();
    });
  });
});

