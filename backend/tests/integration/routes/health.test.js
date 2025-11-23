/**
 * Integration tests for health routes
 */

const request = require('supertest');
const { createTestServer, closeTestServer } = require('../../helpers/testServer');

describe('Health Routes', () => {
  let app, server;

  beforeAll(() => {
    const testServer = createTestServer();
    app = testServer.app;
    server = testServer.server;
  });

  afterAll((done) => {
    closeTestServer(server, done);
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.uptime).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.memory).toBeDefined();
      expect(response.body.node).toBeDefined();
      expect(response.body.database).toBeDefined();
    });
  });

  describe('GET /health/metrics', () => {
    it('should return system metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.requests).toBeDefined();
      expect(response.body.data.sockets).toBeDefined();
    });
  });
});

