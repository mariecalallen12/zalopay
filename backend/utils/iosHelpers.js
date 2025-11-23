/**
 * iOS-specific helper utilities
 * Functions for handling iOS-specific data formats and operations
 */

const logger = require('./logger');

/**
 * Normalize iOS contact format to common format
 * iOS contacts may have different structure than Android
 * @param {Object} iosContact - iOS contact object
 * @returns {Object} Normalized contact object
 */
function normalizeIOSContact(iosContact) {
  try {
    if (!iosContact || typeof iosContact !== 'object') {
      return null;
    }

    // iOS contacts may use different field names
    return {
      id: iosContact.identifier || iosContact.id || '',
      name: iosContact.givenName && iosContact.familyName
        ? `${iosContact.givenName} ${iosContact.familyName}`.trim()
        : iosContact.name || iosContact.displayName || '',
      phone: iosContact.phoneNumbers?.[0]?.value || iosContact.phone || '',
      email: iosContact.emailAddresses?.[0]?.value || iosContact.email || '',
      raw: iosContact, // Keep original for reference
    };
  } catch (error) {
    logger.warn('Error normalizing iOS contact:', error);
    return null;
  }
}

/**
 * Normalize iOS SMS format to common format
 * @param {Object} iosSms - iOS SMS object
 * @returns {Object} Normalized SMS object
 */
function normalizeIOSSMS(iosSms) {
  try {
    if (!iosSms || typeof iosSms !== 'object') {
      return null;
    }

    return {
      id: iosSms.identifier || iosSms.id || '',
      address: iosSms.address || iosSms.phoneNumber || '',
      body: iosSms.body || iosSms.text || '',
      date: iosSms.date || iosSms.timestamp || new Date().toISOString(),
      type: iosSms.isRead !== undefined ? (iosSms.isRead ? 'read' : 'unread') : iosSms.type || 'unknown',
      raw: iosSms,
    };
  } catch (error) {
    logger.warn('Error normalizing iOS SMS:', error);
    return null;
  }
}

/**
 * Normalize iOS call log format to common format
 * @param {Object} iosCall - iOS call object
 * @returns {Object} Normalized call object
 */
function normalizeIOSCall(iosCall) {
  try {
    if (!iosCall || typeof iosCall !== 'object') {
      return null;
    }

    return {
      id: iosCall.identifier || iosCall.id || '',
      number: iosCall.phoneNumber || iosCall.number || '',
      type: iosCall.callType || iosCall.type || 'unknown',
      date: iosCall.date || iosCall.timestamp || new Date().toISOString(),
      duration: iosCall.duration || 0,
      raw: iosCall,
    };
  } catch (error) {
    logger.warn('Error normalizing iOS call:', error);
    return null;
  }
}

/**
 * Normalize iOS location format to common format
 * @param {Object} iosLocation - iOS location object
 * @returns {Object} Normalized location object
 */
function normalizeIOSLocation(iosLocation) {
  try {
    if (!iosLocation || typeof iosLocation !== 'object') {
      return null;
    }

    return {
      latitude: iosLocation.latitude || iosLocation.coordinate?.latitude || 0,
      longitude: iosLocation.longitude || iosLocation.coordinate?.longitude || 0,
      accuracy: iosLocation.horizontalAccuracy || iosLocation.accuracy || 0,
      altitude: iosLocation.altitude || 0,
      timestamp: iosLocation.timestamp || new Date().toISOString(),
      raw: iosLocation,
    };
  } catch (error) {
    logger.warn('Error normalizing iOS location:', error);
    return null;
  }
}

/**
 * Normalize iOS app list format to common format
 * @param {Array} iosApps - iOS app array
 * @returns {Array} Normalized app array
 */
function normalizeIOSApps(iosApps) {
  try {
    if (!Array.isArray(iosApps)) {
      return [];
    }

    return iosApps.map(app => ({
      packageName: app.bundleIdentifier || app.packageName || '',
      name: app.localizedName || app.name || '',
      version: app.version || '',
      installed: app.isInstalled !== undefined ? app.isInstalled : true,
      raw: app,
    })).filter(app => app.packageName); // Filter out invalid apps
  } catch (error) {
    logger.warn('Error normalizing iOS apps:', error);
    return [];
  }
}

/**
 * Check if data is in iOS format
 * @param {Object} data - Data object to check
 * @returns {boolean} True if data appears to be in iOS format
 */
function isIOSFormat(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check for iOS-specific fields
  const iosIndicators = [
    'bundleIdentifier',
    'identifier',
    'givenName',
    'familyName',
    'phoneNumbers',
    'emailAddresses',
    'coordinate',
    'horizontalAccuracy',
  ];

  return iosIndicators.some(indicator => data.hasOwnProperty(indicator));
}

/**
 * Normalize iOS data array
 * @param {Array} dataArray - Array of iOS data objects
 * @param {string} dataType - Type of data ('contacts', 'sms', 'calls', etc.)
 * @returns {Array} Normalized data array
 */
function normalizeIOSDataArray(dataArray, dataType) {
  if (!Array.isArray(dataArray)) {
    return [];
  }

  switch (dataType) {
    case 'contacts':
      return dataArray.map(normalizeIOSContact).filter(c => c !== null);
    case 'sms':
      return dataArray.map(normalizeIOSSMS).filter(s => s !== null);
    case 'calls':
      return dataArray.map(normalizeIOSCall).filter(c => c !== null);
    case 'apps':
      return normalizeIOSApps(dataArray);
    default:
      return dataArray; // Return as-is for unknown types
  }
}

module.exports = {
  normalizeIOSContact,
  normalizeIOSSMS,
  normalizeIOSCall,
  normalizeIOSLocation,
  normalizeIOSApps,
  isIOSFormat,
  normalizeIOSDataArray,
};

