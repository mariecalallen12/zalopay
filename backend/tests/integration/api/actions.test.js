/**
 * Integration tests for action API endpoints
 */

const request = require('supertest');
const { createTestServer, closeTestServer } = require('../../helpers/testServer');
const DeviceService = require('../../../services/deviceService');
const ActionService = require('../../../services/actionService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createMockIo, createTestDevice } = require('../../helpers/mockFactories');

describe('Action API Endpoints', () => {
  let app, server, io;
  let deviceService, actionService, deviceRepository, deviceDataRepository;
  let mockIo;

  beforeAll(async () => {
    const testServer = createTestServer();
    app = testServer.app;
    server = testServer.server;
    io = testServer.io;

    deviceRepository = new DeviceRepository();
    deviceDataRepository = new DeviceDataRepository();
    await deviceRepository.init();
    await deviceDataRepository.init();

    mockIo = createMockIo();
    deviceService = new DeviceService(deviceRepository, deviceDataRepository, mockIo);
    actionService = new ActionService(deviceService, mockIo);

    app.set('deviceService', deviceService);
    app.set('actionService', actionService);
  });

  afterAll((done) => {
    closeTestServer(server, done);
  });

  describe('POST /api/v1/devices/:id/action', () => {
    it('should execute action on device', async () => {
      const device = createTestDevice({ id: 'action-device', platform: 'android' });
      await deviceRepository.create(device);
      mockIo.sockets.sockets.set('action-device', { id: 'action-device' });

      const response = await request(app)
        .post('/api/v1/devices/action-device/action')
        .send({ action: 'contacts', params: {} })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.platform).toBe('android');
    });

    it('should return 404 when device not connected', async () => {
      const response = await request(app)
        .post('/api/v1/devices/non-existent/action')
        .send({ action: 'contacts', params: {} })
        .expect(404);
    });

    it('should validate action parameter', async () => {
      const device = createTestDevice({ id: 'test-device' });
      await deviceRepository.create(device);
      mockIo.sockets.sockets.set('test-device', { id: 'test-device' });

      const response = await request(app)
        .post('/api/v1/devices/test-device/action')
        .send({ params: {} })
        .expect(400);
    });
  });

  describe('GET /api/v1/actions', () => {
    it('should return available actions', async () => {
      const response = await request(app)
        .get('/api/v1/actions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });
  });
});

