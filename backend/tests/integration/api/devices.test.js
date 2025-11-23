/**
 * Integration tests for device API endpoints
 */

const request = require('supertest');
const { createTestServer, closeTestServer } = require('../../helpers/testServer');
const DeviceService = require('../../../services/deviceService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createMockIo, createTestDevice } = require('../../helpers/mockFactories');

describe('Device API Endpoints', () => {
  let app, server, io;
  let deviceService, deviceRepository, deviceDataRepository;

  beforeAll(async () => {
    const testServer = createTestServer();
    app = testServer.app;
    server = testServer.server;
    io = testServer.io;

    // Initialize repositories and services
    deviceRepository = new DeviceRepository();
    deviceDataRepository = new DeviceDataRepository();
    await deviceRepository.init();
    await deviceDataRepository.init();

    const mockIo = createMockIo();
    deviceService = new DeviceService(deviceRepository, deviceDataRepository, mockIo);

    // Set services in app
    app.set('deviceService', deviceService);
    app.set('deviceRepository', deviceRepository);
    app.set('deviceDataRepository', deviceDataRepository);
  });

  afterAll((done) => {
    closeTestServer(server, done);
  });

  describe('GET /api/v1/devices', () => {
    it('should return list of devices', async () => {
      const device = createTestDevice({ id: 'test-device-1' });
      await deviceRepository.create(device);

      const response = await request(app)
        .get('/api/v1/devices')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it('should filter devices by platform', async () => {
      const androidDevice = createTestDevice({ id: 'android-1', platform: 'android' });
      const iosDevice = createTestDevice({ id: 'ios-1', platform: 'ios' });
      
      await deviceRepository.create(androidDevice);
      await deviceRepository.create(iosDevice);

      const response = await request(app)
        .get('/api/v1/devices?platform=android')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(d => d.platform === 'android')).toBe(true);
    });

    it('should return empty array when no devices', async () => {
      // Clear all devices
      const devices = await deviceRepository.findAll();
      for (const device of devices) {
        await deviceRepository.delete(device.id);
      }

      const response = await request(app)
        .get('/api/v1/devices')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/v1/devices/:id', () => {
    it('should return device details', async () => {
      const device = createTestDevice({ id: 'test-device-detail' });
      await deviceRepository.create(device);

      const response = await request(app)
        .get('/api/v1/devices/test-device-detail')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.info.id).toBe('test-device-detail');
      expect(response.body.data.data).toBeDefined();
    });

    it('should return 404 when device not found', async () => {
      const response = await request(app)
        .get('/api/v1/devices/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for invalid route', async () => {
      const response = await request(app)
        .get('/api/v1/devices/invalid-id-12345')
        .expect(404);
    });
  });
});
