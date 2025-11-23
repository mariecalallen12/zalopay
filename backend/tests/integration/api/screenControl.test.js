/**
 * Integration tests for screen control API endpoints
 */

const request = require('supertest');
const { createTestServer, closeTestServer } = require('../../helpers/testServer');
const DeviceService = require('../../../services/deviceService');
const ScreenStreamService = require('../../../services/screenStreamService');
const RemoteControlService = require('../../../services/remoteControlService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createMockIo, createTestDevice } = require('../../helpers/mockFactories');

describe('Screen Control API Endpoints', () => {
  let app, server, io;
  let deviceService, screenStreamService, remoteControlService;
  let deviceRepository, deviceDataRepository;
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
    screenStreamService = new ScreenStreamService(deviceService, mockIo);
    remoteControlService = new RemoteControlService(deviceService, mockIo);

    app.set('deviceService', deviceService);
    app.set('screenStreamService', screenStreamService);
    app.set('remoteControlService', remoteControlService);
  });

  afterAll((done) => {
    closeTestServer(server, done);
  });

  describe('Screen Streaming', () => {
    beforeEach(async () => {
      const device = createTestDevice({ id: 'stream-device' });
      await deviceRepository.create(device);
      mockIo.sockets.sockets.set('stream-device', { id: 'stream-device' });
      // Clean up any existing streaming sessions
      if (screenStreamService.isStreaming('stream-device')) {
        await screenStreamService.stopStreaming('stream-device');
      }
    });

    it('should start screen streaming', async () => {
      const response = await request(app)
        .post('/api/v1/devices/stream-device/screen/start')
        .send({ quality: { fps: 20, resolution: 'half' } })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session).toBeDefined();
    });

    it('should stop screen streaming', async () => {
      await screenStreamService.startStreaming('stream-device');

      const response = await request(app)
        .post('/api/v1/devices/stream-device/screen/stop')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should get streaming status', async () => {
      await screenStreamService.startStreaming('stream-device');

      const response = await request(app)
        .get('/api/v1/devices/stream-device/screen/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.active).toBe(true);
    });
  });

  describe('Remote Control', () => {
    beforeEach(async () => {
      const device = createTestDevice({ id: 'control-device' });
      await deviceRepository.create(device);
      mockIo.sockets.sockets.set('control-device', { id: 'control-device' });
      // Clean up any existing sessions
      if (remoteControlService.isControlling('control-device')) {
        await remoteControlService.stopControl('control-device');
      }
    });

    it('should start remote control', async () => {
      const response = await request(app)
        .post('/api/v1/devices/control-device/control/start')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should stop remote control', async () => {
      await remoteControlService.startControl('control-device');

      const response = await request(app)
        .post('/api/v1/devices/control-device/control/stop')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should send control command', async () => {
      await remoteControlService.startControl('control-device');

      const response = await request(app)
        .post('/api/v1/devices/control-device/control/command')
        .send({
          type: 'touch',
          data: { x: 100, y: 200, action: 'down' },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

