/**
 * Test server setup helper
 * Creates a test Express server with all routes and middleware
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

/**
 * Create test server instance
 */
function createTestServer(options = {}) {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock services if provided
  if (options.services) {
    Object.keys(options.services).forEach(key => {
      app.set(key, options.services[key]);
    });
  }

  // Load routes if provided
  if (options.loadRoutes !== false) {
    // Health routes
    const healthRoutes = require('../../routes/health');
    app.use('/', healthRoutes);

    // API v1 routes
    const deviceRoutes = require('../../routes/api/v1/devices');
    const actionRoutes = require('../../routes/api/v1/actions');
    const screenControlRoutes = require('../../routes/api/v1/screenControl');
    app.use('/api/v1', deviceRoutes);
    app.use('/api/v1', actionRoutes);
    app.use('/api/v1', screenControlRoutes);

    // Upload routes
    const uploadRoutes = require('../../routes/uploads');
    app.use('/', uploadRoutes);
  }

  // Error handler
  const { errorHandler, notFoundHandler } = require('../../middleware/errorHandler');
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, server, io };
}

/**
 * Close test server
 */
function closeTestServer(server, done) {
  server.close(() => {
    if (done) done();
  });
}

module.exports = {
  createTestServer,
  closeTestServer,
};

