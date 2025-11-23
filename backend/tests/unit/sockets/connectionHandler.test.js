/**
 * Unit tests for connectionHandler
 */

const { handleConnection, handleDisconnection } = require('../../../sockets/connectionHandler');
const DeviceService = require('../../../services/deviceService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createMockSocket, createMockIo } = require('../../helpers/mockFactories');

describe('connectionHandler', () => {
  let socket, deviceService, deviceRepository, deviceDataRepository, mockIo;

  beforeEach(async () => {
    deviceRepository = new DeviceRepository();
    deviceDataRepository = new DeviceDataRepository();
    await deviceRepository.init();
    await deviceDataRepository.init();

    mockIo = createMockIo();
    deviceService = new DeviceService(deviceRepository, deviceDataRepository, mockIo);
    // Mock broadcast method
    deviceService.broadcast = jest.fn();

    socket = createMockSocket('test-socket-id', {
      model: 'Test Device',
      version: 'Android 12',
      ip: '192.168.1.1',
      platform: 'android',
    });
  });

  describe('handleConnection', () => {
    it('should create device on connection', async () => {
      await handleConnection(socket, deviceService, deviceRepository, deviceDataRepository);

      const device = await deviceRepository.findById(socket.id);
      expect(device).toBeDefined();
      expect(device.model).toBe('Test Device');
    });

    it('should initialize device data', async () => {
      await handleConnection(socket, deviceService, deviceRepository, deviceDataRepository);

      const data = await deviceDataRepository.findByDeviceId(socket.id);
      expect(data).toBeDefined();
    });

    it('should set socket properties', async () => {
      await handleConnection(socket, deviceService, deviceRepository, deviceDataRepository);

      expect(socket.deviceId).toBe(socket.id);
      expect(socket.model).toBe('Test Device');
      expect(socket.platform).toBe('android');
    });

    it('should detect platform from socket headers', async () => {
      const iosSocket = createMockSocket('ios-socket', {
        model: 'iPhone 14',
        platform: 'ios',
      });

      await handleConnection(iosSocket, deviceService, deviceRepository, deviceDataRepository);

      const device = await deviceRepository.findById(iosSocket.id);
      expect(device.platform).toBe('ios');
    });
  });

  describe('handleDisconnection', () => {
    it('should update device status on disconnect', async () => {
      await handleConnection(socket, deviceService, deviceRepository, deviceDataRepository);
      await handleDisconnection(socket, deviceService, deviceRepository);

      const device = await deviceRepository.findById(socket.id);
      expect(device.online).toBe(false);
      expect(device.disconnectedAt).toBeDefined();
    });

    it('should broadcast device disconnection', async () => {
      await handleConnection(socket, deviceService, deviceRepository, deviceDataRepository);
      await handleDisconnection(socket, deviceService, deviceRepository);

      expect(deviceService.broadcast).toHaveBeenCalledWith(
        'device-disconnected',
        expect.any(Object)
      );
    });
  });
});

