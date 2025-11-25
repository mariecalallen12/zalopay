/**
 * Unit tests for DeviceService
 */

const DeviceService = require('../../../services/deviceService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { NotFoundError } = require('../../../utils/errors');
const {
  createMockIo,
  createTestDevice,
  createTestDeviceData,
} = require('../../helpers/mockFactories');

describe('DeviceService', () => {
  let deviceService;
  let deviceRepository;
  let deviceDataRepository;
  let mockIo;

  beforeEach(async () => {
    deviceRepository = new DeviceRepository();
    deviceDataRepository = new DeviceDataRepository();
    mockIo = createMockIo();
    
    await deviceRepository.init();
    await deviceDataRepository.init();
    
    // Bỏ qua Postgres thật để tránh ràng buộc UUID trong unit test
    deviceRepository.useDatabase = false;
    deviceRepository.devices = new Map();
    deviceDataRepository.useDatabase = false;
    deviceDataRepository.deviceData = new Map();
    
    deviceService = new DeviceService(deviceRepository, deviceDataRepository, mockIo);
  });

  describe('getAllDevices', () => {
    it('should return empty array when no devices', async () => {
      const devices = await deviceService.getAllDevices();
      expect(devices).toEqual([]);
    });

    it('should return all devices with online status', async () => {
      const deviceId = 'test-device-1';
      const device = createTestDevice({ id: deviceId });
      
      await deviceRepository.create(device);
      mockIo.sockets.sockets.set(deviceId, { id: deviceId });

      const devices = await deviceService.getAllDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0].id).toBe(deviceId);
      expect(devices[0].online).toBe(true);
    });

    it('should filter devices by platform', async () => {
      const androidDevice = createTestDevice({ id: 'android-1', platform: 'android' });
      const iosDevice = createTestDevice({ id: 'ios-1', platform: 'ios' });
      
      await deviceRepository.create(androidDevice);
      await deviceRepository.create(iosDevice);

      const androidDevices = await deviceService.getAllDevices({ platform: 'android' });
      expect(androidDevices).toHaveLength(1);
      expect(androidDevices[0].platform).toBe('android');

      const iosDevices = await deviceService.getAllDevices({ platform: 'ios' });
      expect(iosDevices).toHaveLength(1);
      expect(iosDevices[0].platform).toBe('ios');
    });

    it('should mark devices as offline when not in socket map', async () => {
      const deviceId = 'test-device-1';
      const device = createTestDevice({ id: deviceId });
      
      await deviceRepository.create(device);
      // Don't add to socket map

      const devices = await deviceService.getAllDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0].online).toBe(false);
    });
  });

  describe('getDeviceById', () => {
    it('should throw NotFoundError when device not found', async () => {
      await expect(deviceService.getDeviceById('non-existent')).rejects.toThrow(NotFoundError);
    });

    it('should return device with data', async () => {
      const deviceId = 'test-device-1';
      const device = createTestDevice({ id: deviceId });
      const deviceData = createTestDeviceData();
      
      await deviceRepository.create(device);
      await deviceDataRepository.updateByType(deviceId, 'contacts', deviceData.contacts);
      mockIo.sockets.sockets.set(deviceId, { id: deviceId });

      const result = await deviceService.getDeviceById(deviceId);
      expect(result.info.id).toBe(deviceId);
      expect(result.data).toBeDefined();
    });

    it('should return device with empty data when no data exists', async () => {
      const deviceId = 'test-device-1';
      const device = createTestDevice({ id: deviceId });
      
      await deviceRepository.create(device);
      mockIo.sockets.sockets.set(deviceId, { id: deviceId });

      const result = await deviceService.getDeviceById(deviceId);
      expect(result.info.id).toBe(deviceId);
      expect(result.data).toBeDefined();
    });
  });

  describe('createOrUpdateDevice', () => {
    it('should create new device when not exists', async () => {
      const deviceId = 'new-device';
      const deviceInfo = {
        model: 'New Device',
        version: 'Android 13',
        ip: '192.168.1.100',
      };

      const result = await deviceService.createOrUpdateDevice(deviceId, deviceInfo);
      expect(result.id).toBe(deviceId);
      expect(result.model).toBe(deviceInfo.model);
    });

    it('should update existing device', async () => {
      const deviceId = 'existing-device';
      const device = createTestDevice({ id: deviceId });
      
      await deviceRepository.create(device);

      const updatedInfo = {
        model: 'Updated Device',
        version: 'Android 14',
      };

      const result = await deviceService.createOrUpdateDevice(deviceId, updatedInfo);
      expect(result.model).toBe(updatedInfo.model);
    });

    it('should detect platform from device info', async () => {
      const deviceId = 'ios-device';
      const deviceInfo = {
        model: 'iPhone 14',
        version: 'iOS 16',
      };

      const result = await deviceService.createOrUpdateDevice(deviceId, deviceInfo);
      expect(result.platform).toBe('ios');
    });

    it('should normalize platform string', async () => {
      const deviceId = 'android-device';
      const deviceInfo = {
        model: 'Android Device',
        platform: 'ANDROID',
      };

      const result = await deviceService.createOrUpdateDevice(deviceId, deviceInfo);
      expect(result.platform).toBe('android');
    });
  });

  describe('initDeviceData', () => {
    it('should create default device data structure', async () => {
      const deviceId = 'new-device';
      
      const result = await deviceService.initDeviceData(deviceId);
      expect(result.deviceId).toBe(deviceId);
      expect(result.contacts).toEqual([]);
      expect(result.sms).toEqual([]);
      expect(result.camera).toBeDefined();
    });

    it('should return existing data if already exists', async () => {
      const deviceId = 'existing-device';
      const existingData = createTestDeviceData({ contacts: [{ name: 'Test' }] });
      
      await deviceDataRepository.updateByType(deviceId, 'contacts', existingData.contacts);

      const result = await deviceService.initDeviceData(deviceId);
      expect(result.contacts).toHaveLength(1);
    });
  });

  describe('updateDeviceData', () => {
    it('should update device data', async () => {
      const deviceId = 'test-device';
      await deviceService.initDeviceData(deviceId);

      const contacts = [{ name: 'John', phone: '1234567890' }];
      await deviceService.updateDeviceData(deviceId, 'contacts', contacts);

      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.contacts).toEqual(contacts);
    });

    it('should initialize data if not exists', async () => {
      const deviceId = 'new-device';
      const contacts = [{ name: 'Jane', phone: '0987654321' }];

      await deviceService.updateDeviceData(deviceId, 'contacts', contacts);

      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.contacts).toEqual(contacts);
    });
  });

  describe('isDeviceConnected', () => {
    it('should return true when device is connected', () => {
      const deviceId = 'test-device-1';
      mockIo.sockets.sockets.set(deviceId, { id: deviceId });
      expect(deviceService.isDeviceConnected(deviceId)).toBe(true);
    });

    it('should return false when device is not connected', () => {
      expect(deviceService.isDeviceConnected('non-existent')).toBe(false);
    });
  });

  describe('emitToDevice', () => {
    it('should emit event to device', () => {
      const deviceId = 'test-device';
      const event = 'test-event';
      const data = { test: 'data' };

      deviceService.emitToDevice(deviceId, event, data);
      
      // Verify to() was called with deviceId
      expect(mockIo.to).toHaveBeenCalledWith(deviceId);
      
      // Verify the emit method on the returned object was called
      // The to() function returns an object with emit method (toEmitMock)
      expect(mockIo._toEmitMock).toHaveBeenCalledWith(event, data);
    });
  });

  describe('broadcast', () => {
    it('should broadcast event to all clients', () => {
      const event = 'broadcast-event';
      const data = { message: 'test' };

      deviceService.broadcast(event, data);
      expect(mockIo.emit).toHaveBeenCalledWith(event, data);
    });
  });
});
