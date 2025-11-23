/**
 * Unit tests for dataHandlers
 */

const {
  handleData,
  handleCommandResponse,
  handleMessage,
  handleFile,
} = require('../../../sockets/dataHandlers');
const DeviceService = require('../../../services/deviceService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createMockSocket, createMockIo } = require('../../helpers/mockFactories');

describe('dataHandlers', () => {
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
      platform: 'android',
    });
    socket.deviceId = socket.id;
  });

  describe('handleData', () => {
    it('should update device data', async () => {
      const dataPacket = {
        type: 'contacts',
        payload: [{ name: 'John', phone: '1234567890' }],
      };

      await handleData(socket, dataPacket, deviceService);

      const data = await deviceDataRepository.findByDeviceId(socket.id);
      expect(data.contacts).toBeDefined();
    });

    it('should broadcast data update', async () => {
      const dataPacket = {
        type: 'sms',
        payload: [{ address: '123', body: 'Hello' }],
      };

      await handleData(socket, dataPacket, deviceService);

      expect(deviceService.broadcast).toHaveBeenCalledWith(
        'device-data-update',
        expect.objectContaining({
          deviceId: socket.id,
          type: 'sms',
        })
      );
    });

    it('should handle missing type gracefully', async () => {
      const dataPacket = { payload: {} };

      await expect(
        handleData(socket, dataPacket, deviceService)
      ).resolves.not.toThrow();
    });
  });

  describe('handleCommandResponse', () => {
    it('should update device data from command response', async () => {
      const response = {
        request: 'contacts',
        result: { contacts: [{ name: 'Jane', phone: '0987654321' }] },
      };

      await handleCommandResponse(socket, response, deviceService);

      const data = await deviceDataRepository.findByDeviceId(socket.id);
      expect(data.contacts).toBeDefined();
    });
  });

  describe('handleMessage', () => {
    it('should handle message from device', async () => {
      const messageData = {
        type: 'info',
        message: 'Test message',
      };

      await handleMessage(socket, messageData, deviceService);

      expect(deviceService.broadcast).toHaveBeenCalledWith(
        'device-message',
        expect.objectContaining({
          deviceId: socket.id,
        })
      );
    });
  });

  describe('handleFile', () => {
    it('should handle file upload from device', async () => {
      const fileData = {
        name: 'test.jpg',
        data: 'base64data',
        type: 'image',
      };

      await handleFile(socket, fileData, deviceService);

      expect(deviceService.broadcast).toHaveBeenCalledWith(
        'device-file',
        expect.objectContaining({
          deviceId: socket.id,
        })
      );
    });
  });
});

