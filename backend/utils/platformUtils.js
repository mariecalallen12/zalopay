/**
 * Platform utilities
 * Helper functions for platform-related operations
 */

const { isActionSupported, getPlatformActions, getPlatformActionName } = require('../config/platformActions');
const { normalizePlatform, isValidPlatform, PLATFORMS } = require('./platformDetector');

/**
 * Check if an action is supported on a platform
 * @param {string} action - Action name
 * @param {string} platform - Platform name ('android' or 'ios')
 * @returns {boolean} True if action is supported
 */
function isPlatformSupported(action, platform) {
  if (!action || !platform) {
    return false;
  }
  
  return isActionSupported(action, platform);
}

/**
 * Get all actions supported on a platform
 * @param {string} platform - Platform name ('android' or 'ios')
 * @returns {Array} Array of supported action names
 */
function getPlatformActionsList(platform) {
  if (!platform) {
    return [];
  }
  
  return getPlatformActions(platform);
}

/**
 * Normalize platform data format
 * Ensures data format is consistent across platforms
 * @param {Object} data - Data object
 * @param {string} platform - Platform name ('android' or 'ios')
 * @returns {Object} Normalized data object
 */
function normalizePlatformData(data, platform) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const normalizedPlatform = normalizePlatform(platform || 'android');
  const normalized = { ...data };

  // Normalize platform-specific field names
  if (normalizedPlatform === PLATFORMS.IOS) {
    // iOS may use different field names
    // Map iOS-specific fields to common format
    if (normalized.openUrl && !normalized['open-url']) {
      normalized['open-url'] = normalized.openUrl;
    }
  }

  // Ensure consistent data types
  if (normalized.contacts && !Array.isArray(normalized.contacts)) {
    normalized.contacts = [];
  }
  if (normalized.sms && !Array.isArray(normalized.sms)) {
    normalized.sms = [];
  }
  if (normalized.calls && !Array.isArray(normalized.calls)) {
    normalized.calls = [];
  }
  if (normalized.gallery && !Array.isArray(normalized.gallery)) {
    normalized.gallery = [];
  }
  if (normalized.apps && !Array.isArray(normalized.apps)) {
    normalized.apps = [];
  }

  return normalized;
}

/**
 * Get platform-specific action name
 * @param {string} action - Generic action name
 * @param {string} platform - Platform name ('android' or 'ios')
 * @returns {string} Platform-specific action name
 */
function getPlatformAction(action, platform) {
  if (!action || !platform) {
    return action;
  }
  
  return getPlatformActionName(action, platform);
}

/**
 * Validate platform string
 * @param {string} platform - Platform string to validate
 * @returns {boolean} True if valid platform
 */
function validatePlatform(platform) {
  return isValidPlatform(platform);
}

/**
 * Get platform display name
 * @param {string} platform - Platform name ('android' or 'ios')
 * @returns {string} Display name
 */
function getPlatformDisplayName(platform) {
  if (!platform || typeof platform !== 'string') {
    return 'Unknown';
  }
  
  const normalized = platform.toLowerCase().trim();
  
  // Check if it's a valid platform
  if (normalized === 'ios' || normalized === 'iphone' || normalized === 'ipad') {
    return 'iOS';
  } else if (normalized === 'android') {
    return 'Android';
  }
  
  // For invalid platforms, return Unknown
  return 'Unknown';
}

/**
 * Get platform icon/emoji
 * @param {string} platform - Platform name ('android' or 'ios')
 * @returns {string} Platform icon
 */
function getPlatformIcon(platform) {
  if (!platform || typeof platform !== 'string') {
    return '📱';
  }
  
  const normalized = platform.toLowerCase().trim();
  
  // Check if it's a valid platform
  if (normalized === 'ios' || normalized === 'iphone' || normalized === 'ipad') {
    return '🍎';
  } else if (normalized === 'android') {
    return '🤖';
  }
  
  // For invalid platforms, return default icon
  return '📱';
}

/**
 * Compare two platforms
 * @param {string} platform1 - First platform
 * @param {string} platform2 - Second platform
 * @returns {boolean} True if platforms are the same
 */
function comparePlatforms(platform1, platform2) {
  return normalizePlatform(platform1) === normalizePlatform(platform2);
}

module.exports = {
  isPlatformSupported,
  getPlatformActions: getPlatformActionsList,
  normalizePlatformData,
  getPlatformAction,
  validatePlatform,
  getPlatformDisplayName,
  getPlatformIcon,
  comparePlatforms,
};

