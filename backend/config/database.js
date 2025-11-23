/**
 * Database configuration and connection
 */

const path = require('path');
const util = require('util');
const { execFile } = require('child_process');
const logger = require('../utils/logger');
const config = require('./index');

let mongoose = null;
let dbConnection = null;
const execFileAsync = util.promisify(execFile);
const backendRoot = path.join(__dirname, '..');

/**
 * Initialize MongoDB connection
 */
async function connectMongoDB() {
  try {
    if (!config.database.useMongoDB) {
      logger.info('MongoDB not configured, skipping connection');
      return null;
    }

    mongoose = require('mongoose');
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    await mongoose.connect(config.database.mongodbUri, options);
    
    logger.info('MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Initialize PostgreSQL connection
 */
async function connectPostgreSQL() {
  try {
    if (!config.database.usePostgreSQL) {
      logger.info('PostgreSQL not configured, skipping connection');
      return null;
    }

    const { Pool } = require('pg');
    
    const useSSL = config.database.ssl;
    const sslOptions = useSSL
      ? { rejectUnauthorized: config.database.sslRejectUnauthorized }
      : false;

    dbConnection = new Pool({
      connectionString: config.database.databaseUrl,
      ssl: sslOptions,
    });

    // Test connection
    await dbConnection.query('SELECT NOW()');
    
    logger.info('PostgreSQL connected successfully');
    
    dbConnection.on('error', (err) => {
      logger.error('PostgreSQL connection error:', err);
    });

    return dbConnection;
  } catch (error) {
    logger.error('PostgreSQL connection failed:', error);
    throw error;
  }
}

/**
 * Deploy Prisma migrations to ensure schema is up to date
 */
async function deployPrismaMigrations() {
  try {
    if (!dbConnection) {
      logger.warn('Database connection not available, skipping Prisma migrate deploy');
      return;
    }

    await execFileAsync('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        DATABASE_URL: config.database.databaseUrl,
      },
    });

    logger.info('Prisma migrations deployed successfully');
  } catch (error) {
    logger.error('Failed to deploy Prisma migrations:', error);
    throw error;
  }
}

/**
 * Connect to database
 */
async function connect() {
  try {
    // Prioritize PostgreSQL
    if (config.database.usePostgreSQL) {
      const connection = await connectPostgreSQL();
      await deployPrismaMigrations();
      return connection;
    } else if (config.database.useMongoDB) {
      return await connectMongoDB();
    } else {
      logger.info('No database configured, using in-memory storage');
      return null;
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from database
 */
async function disconnect() {
  try {
    if (mongoose && mongoose.connection) {
      await mongoose.connection.close();
      logger.info('MongoDB disconnected');
    }
    
    if (dbConnection) {
      await dbConnection.end();
      logger.info('PostgreSQL disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
}

module.exports = {
  connect,
  disconnect,
  getConnection: () => mongoose || dbConnection,
  isConnected: () => {
    if (mongoose) {
      return mongoose.connection.readyState === 1;
    }
    if (dbConnection) {
      return !dbConnection.ended;
    }
    return false;
  },
};

