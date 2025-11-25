/**
 * Application configuration
 * Loads and validates environment variables
 */

require('dotenv').config();
const { validateEnv, getEnv, getEnvBool, getEnvInt } = require('./env');
const path = require('path');

// Validate required environment variables
const envValidationErrors = validateEnv({
  strict: process.env.NODE_ENV === 'production',
});

if (envValidationErrors.length > 0 && process.env.NODE_ENV !== 'production') {
  console.warn(
    'Environment validation warnings:\n - ' +
    envValidationErrors.join('\n - ')
  );
}

const config = {
  // Server Configuration
  server: {
    port: getEnvInt('PORT', 3000),
    env: getEnv('NODE_ENV', 'development'),
    isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
    isProduction: getEnv('NODE_ENV', 'development') === 'production',
  },

  // Security Configuration
  security: {
    jwtSecret: getEnv('JWT_SECRET', 'change-this-secret-key-in-production'),
    jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '24h'),
    bcryptRounds: getEnvInt('BCRYPT_ROUNDS', 10),
  },

  // Database Configuration
  database: {
    mongodbUri: getEnv('MONGODB_URI'),
    databaseUrl: getEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/dogerat'),
    useMongoDB: !!getEnv('MONGODB_URI'),
    usePostgreSQL: !getEnv('MONGODB_URI'), // Use PostgreSQL if MongoDB is not configured
    ssl: getEnvBool('DATABASE_SSL', false),
    sslRejectUnauthorized: getEnvBool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
  },

  // CORS Configuration
  cors: {
    origin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60000),
    maxRequests: getEnvInt('RATE_LIMIT_MAX_REQUESTS', 100),
  },

  // File Upload
  upload: {
    // Align with frontend 16MB limit for identity/document uploads
    maxFileSize: getEnvInt('MAX_FILE_SIZE', 16 * 1024 * 1024),
    uploadDir: path.join(__dirname, '..', getEnv('UPLOAD_DIR', 'uploads')),
  },

  // Logging
  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    logFile: path.join(__dirname, '..', getEnv('LOG_FILE', 'logs/app.log')),
  },

  // Socket.IO
  socket: {
    pingInterval: getEnvInt('SOCKET_PING_INTERVAL', 5000),
    pingTimeout: getEnvInt('SOCKET_PING_TIMEOUT', 60000),
  },

  // Keep Alive
  keepAlive: {
    url: getEnv('KEEP_ALIVE_URL'),
    interval: getEnvInt('KEEP_ALIVE_INTERVAL', 300000), // 5 minutes
  },

  // Legacy data.json support
  legacy: {
    dataFile: path.join(__dirname, '..', 'data.json'),
  },

  // Platform Configuration
  platform: {
    // Default platform (for backward compatibility)
    default: getEnv('DEFAULT_PLATFORM', 'android'),
    
    // Supported platforms
    supported: ['android', 'ios'],
    
    // Platform-specific settings
    android: {
      // Android-specific configurations
      defaultVersion: getEnv('ANDROID_DEFAULT_VERSION', 'unknown'),
    },
    ios: {
      // iOS-specific configurations
      defaultVersion: getEnv('IOS_DEFAULT_VERSION', 'unknown'),
      // iOS may have different data format requirements
      normalizeData: getEnvBool('IOS_NORMALIZE_DATA', true),
    },
  },
};

module.exports = config;
