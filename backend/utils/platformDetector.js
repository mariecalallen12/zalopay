/**
 * Platform detector utility
 * Detects device platform (Android/iOS) from various sources
 */

const logger = require('./logger');

/**
 * Supported platforms
 */
const PLATFORMS = {
  ANDROID: 'android',
  IOS: 'ios',
};

/**
 * Detect platform from socket handshake headers
 * @param {Object} headers - Socket handshake headers
 * @returns {string} Platform name ('android' or 'ios')
 */
function detectFromHeaders(headers) {
  try {
    // Check explicit platform header
    if (headers.platform) {
      const platform = headers.platform.toLowerCase();
      if (platform === 'ios' || platform === 'android') {
        return platform;
      }
    }

    // Check user-agent header
    if (headers['user-agent']) {
      const userAgent = headers['user-agent'].toLowerCase();
      if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
        return PLATFORMS.IOS;
      }
      if (userAgent.includes('android')) {
        return PLATFORMS.ANDROID;
      }
    }

    // Check model header for iOS devices
    if (headers.model) {
      const model = headers.model.toLowerCase();
      if (model.includes('iphone') || model.includes('ipad') || model.includes('ipod')) {
        return PLATFORMS.IOS;
      }
    }

    // Check version header for iOS version format
    if (headers.version) {
      const version = headers.version.toLowerCase();
      // iOS versions typically start with numbers or contain "iOS"
      if (version.includes('ios') || /^\d+\.\d+/.test(version)) {
        // Could be iOS, but also could be Android, so check model first
        if (headers.model && (headers.model.toLowerCase().includes('iphone') || 
            headers.model.toLowerCase().includes('ipad'))) {
          return PLATFORMS.IOS;
        }
      }
    }

    // Default to Android for backward compatibility
    return PLATFORMS.ANDROID;
  } catch (error) {
    logger.warn('Error detecting platform from headers:', error);
    return PLATFORMS.ANDROID; // Default to Android
  }
}

/**
 * Detect platform from device info object
 * @param {Object} deviceInfo - Device information object
 * @returns {string} Platform name ('android' or 'ios')
 */
function detectFromDeviceInfo(deviceInfo) {
  try {
    // Check explicit platform field
    if (deviceInfo.platform) {
      const platform = deviceInfo.platform.toLowerCase();
      if (platform === 'ios' || platform === 'android') {
        return platform;
      }
    }

    // Check model
    if (deviceInfo.model) {
      const model = deviceInfo.model.toLowerCase();
      if (model.includes('iphone') || model.includes('ipad') || model.includes('ipod')) {
        return PLATFORMS.IOS;
      }
    }

    // Check version
    if (deviceInfo.version) {
      const version = deviceInfo.version.toLowerCase();
      if (version.includes('ios')) {
        return PLATFORMS.IOS;
      }
    }

    // Default to Android for backward compatibility
    return PLATFORMS.ANDROID;
  } catch (error) {
    logger.warn('Error detecting platform from device info:', error);
    return PLATFORMS.ANDROID; // Default to Android
  }
}

/**
 * Detect platform from socket handshake
 * @param {Object} socket - Socket.IO socket object
 * @returns {Object} Object with platform and platformVersion
 */
function detectFromSocket(socket) {
  try {
    const headers = socket.handshake.headers || {};
    const platform = detectFromHeaders(headers);
    
    // Extract platform version
    let platformVersion = headers['platform-version'] || headers.version || null;
    
    // Normalize iOS version format
    if (platform === PLATFORMS.IOS && platformVersion) {
      // Remove "iOS" prefix if present
      platformVersion = platformVersion.replace(/^ios\s*/i, '').trim();
    }

    return {
      platform,
      platformVersion,
    };
  } catch (error) {
    logger.warn('Error detecting platform from socket:', error);
    return {
      platform: PLATFORMS.ANDROID,
      platformVersion: null,
    };
  }
}

/**
 * Validate platform string
 * @param {string} platform - Platform string to validate
 * @returns {boolean} True if valid platform
 */
function isValidPlatform(platform) {
  return platform === PLATFORMS.ANDROID || platform === PLATFORMS.IOS;
}

/**
 * Normalize platform string
 * @param {string} platform - Platform string to normalize
 * @returns {string} Normalized platform string
 */
function normalizePlatform(platform) {
  if (!platform || typeof platform !== 'string') {
    return PLATFORMS.ANDROID; // Default
  }
  
  const normalized = platform.toLowerCase().trim();
  if (normalized === 'ios' || normalized === 'iphone' || normalized === 'ipad') {
    return PLATFORMS.IOS;
  }
  
  // Only return Android if it's explicitly android, otherwise default to android for unknown platforms
  if (normalized === 'android') {
    return PLATFORMS.ANDROID;
  }
  
  // For invalid platforms, default to android (for backward compatibility)
  return PLATFORMS.ANDROID;
}

module.exports = {
  PLATFORMS,
  detectFromHeaders,
  detectFromDeviceInfo,
  detectFromSocket,
  isValidPlatform,
  normalizePlatform,
};

