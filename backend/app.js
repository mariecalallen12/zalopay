// Express app configuration
// Separates Express app setup from server startup

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');

// Middleware
const { apiLimiter, strictLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { setupSwagger } = require('./middleware/swagger');

// Routes
const routes = require('./routes');

/**
 * Create and configure Express app
 * @param {Object} io - Socket.IO server instance (optional)
 * @returns {Object} - Configured Express app
 */
function createApp(io = null) {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files - Merchant web (HTML/JS)
  app.use(express.static(path.join(__dirname, '../static/merchant')));
  
  // Admin web is served via Vite dev server in development
  // In production, serve from dist folder
  if (process.env.NODE_ENV === 'production') {
    const adminDistPath = path.join(__dirname, 'static/admin/dist/public');
    app.use('/admin', express.static(adminDistPath));
    app.get('/admin/*', (req, res, next) => {
      res.sendFile(path.join(adminDistPath, 'index.html'), (err) => {
        if (err) {
          next(err);
        }
      });
    });
  }

  // Rate limiting
  app.use('/api', apiLimiter);
  app.use('/upload', strictLimiter);

  // Swagger documentation
  setupSwagger(app);

  // API routes
  app.use(routes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};

