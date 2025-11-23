/**
 * Unit tests for DeviceRepository
 */

const DeviceRepository = require('../../../repositories/deviceRepository');
const { createTestDevice } = require('../../helpers/mockFactories');

describe('DeviceRepository', () => {
  let deviceRepository;

  beforeEach(async () => {
    deviceRepository = new DeviceRepository();
    await deviceRepository.init();
  });

  describe('init', () => {
    it('should initialize with in-memory storage when database not available', async () => {
      expect(deviceRepository.useDatabase).toBe(false);
      expect(deviceRepository.devices).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a new device', async () => {
      const device = createTestDevice({ id: 'test-device-1' });
      
      const result = await deviceRepository.create(device);
      
      expect(result.id).toBe(device.id);
      expect(result.model).toBe(device.model);
      expect(result.createdAt).toBeDefined();
    });

    it('should set default platform to android if not provided', async () => {
      const device = {
        id: 'test-device-2',
        model: 'Test Device',
      };
      
      const result = await deviceRepository.create(device);
      expect(result.platform).toBe('android');
    });

    it('should preserve platform when provided', async () => {
      const device = createTestDevice({
        id: 'ios-device',
        platform: 'ios',
      });
      
      const result = await deviceRepository.create(device);
      expect(result.platform).toBe('ios');
    });
  });

  describe('findById', () => {
    it('should return null when device not found', async () => {
      const result = await deviceRepository.findById('non-existent');
      expect(result).toBeNull();
    });

    it('should return device when found', async () => {
      const device = createTestDevice({ id: 'test-device-1' });
      await deviceRepository.create(device);
      
      const result = await deviceRepository.findById('test-device-1');
      expect(result).toBeDefined();
      expect(result.id).toBe(device.id);
      expect(result.model).toBe(device.model);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no devices', async () => {
      const result = await deviceRepository.findAll();
      expect(result).toEqual([]);
    });

    it('should return all devices', async () => {
      const device1 = createTestDevice({ id: 'device-1' });
      const device2 = createTestDevice({ id: 'device-2' });
      
      await deviceRepository.create(device1);
      await deviceRepository.create(device2);
      
      const result = await deviceRepository.findAll();
      expect(result).toHaveLength(2);
    });

    it('should filter by platform', async () => {
      const androidDevice = createTestDevice({ id: 'android-1', platform: 'android' });
      const iosDevice = createTestDevice({ id: 'ios-1', platform: 'ios' });
      
      await deviceRepository.create(androidDevice);
      await deviceRepository.create(iosDevice);
      
      const androidDevices = await deviceRepository.findAll({ platform: 'android' });
      expect(androidDevices).toHaveLength(1);
      expect(androidDevices[0].platform).toBe('android');
      
      const iosDevices = await deviceRepository.findAll({ platform: 'ios' });
      expect(iosDevices).toHaveLength(1);
      expect(iosDevices[0].platform).toBe('ios');
    });

    it('should filter by online status', async () => {
      const onlineDevice = createTestDevice({ id: 'online-1', online: true });
      const offlineDevice = createTestDevice({ id: 'offline-1', online: false });
      
      await deviceRepository.create(onlineDevice);
      await deviceRepository.create(offlineDevice);
      
      const onlineDevices = await deviceRepository.findAll({ online: true });
      expect(onlineDevices).toHaveLength(1);
      expect(onlineDevices[0].online).toBe(true);
      
      const offlineDevices = await deviceRepository.findAll({ online: false });
      expect(offlineDevices).toHaveLength(1);
      expect(offlineDevices[0].online).toBe(false);
    });

    it('should filter by both platform and online status', async () => {
      const androidOnline = createTestDevice({ id: 'android-online', platform: 'android', online: true });
      const androidOffline = createTestDevice({ id: 'android-offline', platform: 'android', online: false });
      const iosOnline = createTestDevice({ id: 'ios-online', platform: 'ios', online: true });
      
      await deviceRepository.create(androidOnline);
      await deviceRepository.create(androidOffline);
      await deviceRepository.create(iosOnline);
      
      const result = await deviceRepository.findAll({ platform: 'android', online: true });
      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe('android');
      expect(result[0].online).toBe(true);
    });
  });

  describe('update', () => {
    it('should return null when device not found', async () => {
      const result = await deviceRepository.update('non-existent', { model: 'Updated' });
      expect(result).toBeNull();
    });

    it('should update device successfully', async () => {
      const device = createTestDevice({ id: 'test-device' });
      await deviceRepository.create(device);
      
      const updates = { model: 'Updated Model', version: 'Android 14' };
      const result = await deviceRepository.update('test-device', updates);
      
      expect(result.model).toBe('Updated Model');
      expect(result.version).toBe('Android 14');
      expect(result.updatedAt).toBeDefined();
    });

    it('should update platform', async () => {
      const device = createTestDevice({ id: 'test-device', platform: 'android' });
      await deviceRepository.create(device);
      
      const result = await deviceRepository.update('test-device', { platform: 'ios' });
      expect(result.platform).toBe('ios');
    });

    it('should update online status', async () => {
      const device = createTestDevice({ id: 'test-device', online: true });
      await deviceRepository.create(device);
      
      const result = await deviceRepository.update('test-device', { online: false });
      expect(result.online).toBe(false);
    });

    it('should preserve existing fields when updating', async () => {
      const device = createTestDevice({ id: 'test-device', model: 'Original Model' });
      await deviceRepository.create(device);
      
      const result = await deviceRepository.update('test-device', { version: 'New Version' });
      expect(result.model).toBe('Original Model');
      expect(result.version).toBe('New Version');
    });
  });

  describe('delete', () => {
    it('should return false when device not found', async () => {
      const result = await deviceRepository.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should delete device successfully', async () => {
      const device = createTestDevice({ id: 'test-device' });
      await deviceRepository.create(device);
      
      const result = await deviceRepository.delete('test-device');
      expect(result).toBe(true);
      
      const found = await deviceRepository.findById('test-device');
      expect(found).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return false when device does not exist', async () => {
      const result = await deviceRepository.exists('non-existent');
      expect(result).toBe(false);
    });

    it('should return true when device exists', async () => {
      const device = createTestDevice({ id: 'test-device' });
      await deviceRepository.create(device);
      
      const result = await deviceRepository.exists('test-device');
      expect(result).toBe(true);
    });
  });
});

