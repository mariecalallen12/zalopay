/**
 * Integration tests for upload routes
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { createTestServer, closeTestServer } = require('../../helpers/testServer');
const DeviceService = require('../../../services/deviceService');
const DeviceRepository = require('../../../repositories/deviceRepository');
const DeviceDataRepository = require('../../../repositories/deviceDataRepository');
const { createMockIo, createTestDevice } = require('../../helpers/mockFactories');

describe('Upload Routes', () => {
  let app, server;
  let deviceService, deviceRepository, deviceDataRepository;
  const testUploadDir = path.join(__dirname, '../../../test-uploads');

  beforeAll(async () => {
    // Create test upload directory
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }

    const testServer = createTestServer();
    app = testServer.app;
    server = testServer.server;

    deviceRepository = new DeviceRepository();
    deviceDataRepository = new DeviceDataRepository();
    await deviceRepository.init();
    await deviceDataRepository.init();

    const mockIo = createMockIo();
    deviceService = new DeviceService(deviceRepository, deviceDataRepository, mockIo);

    app.set('deviceService', deviceService);
    app.set('deviceRepository', deviceRepository);
    app.set('deviceDataRepository', deviceDataRepository);
  });

  afterAll((done) => {
    // Clean up test upload directory
    if (fs.existsSync(testUploadDir)) {
      fs.readdirSync(testUploadDir).forEach(file => {
        fs.unlinkSync(path.join(testUploadDir, file));
      });
      fs.rmdirSync(testUploadDir);
    }
    closeTestServer(server, done);
  });

  describe('POST /upload', () => {
    it('should upload file successfully', async () => {
      const device = createTestDevice({ id: 'upload-device', model: 'TestDevice' });
      await deviceRepository.create(device);

      const response = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .set('model', 'TestDevice')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filePath).toBeDefined();
    });

    it('should return 400 when no file uploaded', async () => {
      const response = await request(app)
        .post('/upload')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

