/**
 * Unit tests for reconnectionHandler
 */

const { handleReconnection, setupReconnectionHandling } = require('../../../sockets/reconnectionHandler');
const DeviceService = require('../../../services/deviceService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createMockSocket, createMockIo, createTestDevice } = require('../../helpers/mockFactories');

describe('reconnectionHandler', () => {
  let socket, deviceService, deviceRepository, deviceDataRepository, mockIo;

  beforeEach(async () => {
    deviceRepository = new DeviceRepository();
    deviceDataRepository = new DeviceDataRepository();
    await deviceRepository.init();
    await deviceDataRepository.init();

    // Ép dùng storage in-memory để tránh constraint UUID của Prisma
    deviceRepository.useDatabase = false;
    deviceRepository.devices = new Map();
    deviceDataRepository.useDatabase = false;
    deviceDataRepository.deviceData = new Map();

    mockIo = createMockIo();
    deviceService = new DeviceService(deviceRepository, deviceDataRepository, mockIo);
    // Mock broadcast method
    deviceService.broadcast = jest.fn();

    socket = createMockSocket('test-socket-id', {
      deviceId: 'test-device',
    });
  });

  describe('handleReconnection', () => {
    it('should update device status on reconnection', async () => {
      const device = createTestDevice({ id: 'test-device' });
      await deviceRepository.create(device);

      await handleReconnection(socket, deviceService, deviceRepository);

      const updatedDevice = await deviceRepository.findById('test-device');
      expect(updatedDevice.online).toBe(true);
    });

    it('should broadcast device reconnection', async () => {
      const device = createTestDevice({ id: 'test-device' });
      await deviceRepository.create(device);

      await handleReconnection(socket, deviceService, deviceRepository);

      expect(deviceService.broadcast).toHaveBeenCalledWith(
        'device-reconnected',
        expect.any(Object)
      );
    });

    it('should handle reconnection when device not found', async () => {
      await expect(
        handleReconnection(socket, deviceService, deviceRepository)
      ).resolves.not.toThrow();
    });
  });

  describe('setupReconnectionHandling', () => {
    it('should setup reconnection event handlers', () => {
      setupReconnectionHandling(socket, deviceService, deviceRepository);

      expect(socket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('reconnect_error', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
    });
  });
});

