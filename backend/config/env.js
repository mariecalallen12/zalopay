/**
 * Environment variable validation and configuration
 */

const requiredEnvVars = [
  // Add required environment variables here if needed
  // 'JWT_SECRET',
];

/**
 * Validate required environment variables
 */
function validateEnv() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Get environment variable with default value
 */
function getEnv(key, defaultValue = null) {
  return process.env[key] || defaultValue;
}

/**
 * Get boolean environment variable
 */
function getEnvBool(key, defaultValue = false) {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Get integer environment variable
 */
function getEnvInt(key, defaultValue = null) {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

module.exports = {
  validateEnv,
  getEnv,
  getEnvBool,
  getEnvInt,
};

