/**
 * Environment variable validation and configuration
 */

const requiredEnvVars = [
  { key: 'JWT_SECRET', minLength: 32 },
  { key: 'CARD_ENCRYPTION_KEY', minLength: 32 },
  { key: 'OAUTH_ENCRYPTION_KEY', minLength: 32 },
  { key: 'ADMIN_PASSWORD', minLength: 12 },
  { key: 'DATABASE_URL' },
  { key: 'CORS_ORIGIN' },
  { key: 'GOOGLE_CLIENT_ID' },
  { key: 'GOOGLE_CLIENT_SECRET' },
];

const integerEnvVars = [
  'PORT',
  'BCRYPT_ROUNDS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'MAX_FILE_SIZE',
  'SOCKET_PING_INTERVAL',
  'SOCKET_PING_TIMEOUT',
  'KEEP_ALIVE_INTERVAL',
];

const booleanEnvVars = [
  'DATABASE_SSL',
  'DATABASE_SSL_REJECT_UNAUTHORIZED',
  'IOS_NORMALIZE_DATA',
];

/**
 * Validate integer env
 */
function validateInteger(key, value) {
  if (value === undefined) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? `${key} must be an integer` : null;
}

/**
 * Validate boolean env
 */
function validateBoolean(key, value) {
  if (value === undefined) return null;
  return ['true', 'false', '1', '0'].includes(String(value).toLowerCase())
    ? null
    : `${key} must be a boolean (true/false)`;
}

/**
 * Validate required environment variables
 */
function validateEnv(options = {}) {
  const { strict = process.env.NODE_ENV === 'production' } = options;
  const errors = [];

  requiredEnvVars.forEach(({ key, minLength }) => {
    const value = process.env[key];
    if (!value) {
      errors.push(`${key} is required`);
      return;
    }
    if (minLength && value.length < minLength) {
      errors.push(`${key} should be at least ${minLength} characters long`);
    }
  });

  integerEnvVars.forEach(key => {
    const error = validateInteger(key, process.env[key]);
    if (error) errors.push(error);
  });

  booleanEnvVars.forEach(key => {
    const error = validateBoolean(key, process.env[key]);
    if (error) errors.push(error);
  });

  // Ensure JWT secret is not using default placeholder
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.includes('change-me')) {
    errors.push('JWT_SECRET should be replaced with a secure random string');
  }

  if (errors.length > 0 && strict) {
    const error = new Error(
      `Missing or invalid environment variables:\n - ${errors.join('\n - ')}`
    );
    error.validationErrors = errors;
    throw error;
  }

  return errors;
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
