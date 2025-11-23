// Advanced Device Fingerprinting Service
// Validates and enriches device fingerprint data
// Based on comprehensive-system-architecture.md lines 201-244

const crypto = require('crypto');
const logger = require('../utils/logger');

class DeviceFingerprintingService {
  constructor() {
    this.entropySources = [
      'canvas',
      'webgl',
      'audio',
      'fonts',
      'plugins',
      'screen',
      'timezone',
      'language',
      'hardware'
    ];

    // Regional profiles for fingerprint validation
    this.regionalProfiles = {
      VN: {
        browsers: {
          chrome: 0.68,
          edge: 0.15,
          firefox: 0.12,
          safari: 0.05
        },
        screenResolutions: {
          '1366x768': 0.35,
          '1920x1080': 0.40,
          '1440x900': 0.15,
          '1280x720': 0.10
        },
        operatingSystems: {
          'Windows 10': 0.55,
          'Windows 11': 0.25,
          'macOS': 0.15,
          'Linux': 0.05
        },
        timezone: 'Asia/Ho_Chi_Minh',
        languages: ['vi-VN', 'vi', 'en-US', 'en']
      }
    };
  }

  /**
   * Validate and enrich device fingerprint data
   * @param {Object} fingerprint - Raw fingerprint data from client
   * @param {string} region - Region code (default: 'VN')
   * @returns {Promise<Object>} - Validated and enriched fingerprint
   */
  async validateAndEnrich(fingerprint, region = 'VN') {
    const validated = {
      ...fingerprint,
      fingerprint_id: this.generateFingerprintId(fingerprint),
      validated_at: new Date().toISOString(),
      validation_score: 0,
      anomalies: []
    };

    // Validate basic properties
    if (!fingerprint.screen_resolution) {
      validated.anomalies.push('missing_screen_resolution');
    } else {
      validated.validation_score += 10;
    }

    if (!fingerprint.timezone) {
      validated.anomalies.push('missing_timezone');
    } else {
      validated.validation_score += 10;
      // Check if timezone matches region
      const profile = this.regionalProfiles[region];
      if (profile && fingerprint.timezone !== profile.timezone) {
        validated.anomalies.push('timezone_mismatch');
      }
    }

    if (!fingerprint.language) {
      validated.anomalies.push('missing_language');
    } else {
      validated.validation_score += 10;
      // Check if language matches region
      const profile = this.regionalProfiles[region];
      if (profile && !profile.languages.includes(fingerprint.language)) {
        validated.anomalies.push('language_mismatch');
      }
    }

    // Validate canvas fingerprint
    if (fingerprint.canvas_signature) {
      validated.validation_score += 15;
      validated.canvas_fingerprint_valid = this.validateCanvasSignature(fingerprint.canvas_signature);
    } else {
      validated.anomalies.push('missing_canvas_signature');
    }

    // Validate WebGL fingerprint
    if (fingerprint.webgl_vendor && fingerprint.webgl_renderer) {
      validated.validation_score += 15;
      validated.webgl_fingerprint_valid = this.validateWebGLFingerprint(
        fingerprint.webgl_vendor,
        fingerprint.webgl_renderer
      );
    } else {
      validated.anomalies.push('missing_webgl_fingerprint');
    }

    // Validate audio fingerprint
    if (fingerprint.audio_fingerprint) {
      validated.validation_score += 15;
      validated.audio_fingerprint_valid = this.validateAudioFingerprint(fingerprint.audio_fingerprint);
    } else {
      validated.anomalies.push('missing_audio_fingerprint');
    }

    // Validate plugins
    if (fingerprint.plugins && Array.isArray(fingerprint.plugins) && fingerprint.plugins.length > 0) {
      validated.validation_score += 10;
      validated.plugins_count = fingerprint.plugins.length;
    } else {
      validated.anomalies.push('missing_plugins');
    }

    // Validate fonts
    if (fingerprint.fonts && Array.isArray(fingerprint.fonts) && fingerprint.fonts.length > 0) {
      validated.validation_score += 10;
      validated.fonts_count = fingerprint.fonts.length;
    } else {
      validated.anomalies.push('missing_fonts');
    }

    // Validate user agent
    if (fingerprint.user_agent) {
      validated.validation_score += 10;
      validated.browser_info = this.parseUserAgent(fingerprint.user_agent);
    } else {
      validated.anomalies.push('missing_user_agent');
    }

    // Calculate final validation score (0-100)
    validated.validation_score = Math.min(100, validated.validation_score);
    validated.is_valid = validated.validation_score >= 70 && validated.anomalies.length < 3;

    return validated;
  }

  /**
   * Generate unique fingerprint ID from fingerprint data
   * @param {Object} fingerprint - Fingerprint data
   * @returns {string} - Unique fingerprint ID
   */
  generateFingerprintId(fingerprint) {
    const fingerprintString = JSON.stringify({
      screen: fingerprint.screen_resolution,
      timezone: fingerprint.timezone,
      language: fingerprint.language,
      canvas: fingerprint.canvas_signature,
      webgl: `${fingerprint.webgl_vendor}-${fingerprint.webgl_renderer}`,
      audio: fingerprint.audio_fingerprint,
      user_agent: fingerprint.user_agent
    });

    return crypto
      .createHash('sha256')
      .update(fingerprintString)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Validate canvas signature format
   * @param {string} signature - Canvas signature
   * @returns {boolean} - True if valid
   */
  validateCanvasSignature(signature) {
    if (!signature || typeof signature !== 'string') {
      return false;
    }
    // Canvas signatures are typically base64 encoded strings
    // Check if it's a valid base64 string
    try {
      const decoded = Buffer.from(signature, 'base64');
      return decoded.length > 0 && decoded.length < 10000; // Reasonable size
    } catch {
      return false;
    }
  }

  /**
   * Validate WebGL fingerprint
   * @param {string} vendor - WebGL vendor
   * @param {string} renderer - WebGL renderer
   * @returns {boolean} - True if valid
   */
  validateWebGLFingerprint(vendor, renderer) {
    if (!vendor || !renderer) {
      return false;
    }
    // Common WebGL vendors
    const validVendors = [
      'Intel Inc.',
      'NVIDIA Corporation',
      'AMD',
      'Apple',
      'Google Inc.',
      'Microsoft Corporation'
    ];
    return validVendors.some(v => vendor.includes(v)) && renderer.length > 0;
  }

  /**
   * Validate audio fingerprint format
   * @param {string} fingerprint - Audio fingerprint
   * @returns {boolean} - True if valid
   */
  validateAudioFingerprint(fingerprint) {
    if (!fingerprint || typeof fingerprint !== 'string') {
      return false;
    }
    // Audio fingerprints are typically in format: "sampleRate:channels:format"
    const pattern = /^\d+:\d+:[a-zA-Z0-9]+$/;
    return pattern.test(fingerprint);
  }

  /**
   * Parse user agent to extract browser and OS info
   * @param {string} userAgent - User agent string
   * @returns {Object} - Parsed browser info
   */
  parseUserAgent(userAgent) {
    const info = {
      browser: 'unknown',
      browserVersion: null,
      os: 'unknown',
      osVersion: null,
      device: 'desktop'
    };

    // Chrome detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      info.browser = 'chrome';
      info.browserVersion = match ? match[1] : null;
    }
    // Edge detection
    else if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      info.browser = 'edge';
      info.browserVersion = match ? match[1] : null;
    }
    // Firefox detection
    else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      info.browser = 'firefox';
      info.browserVersion = match ? match[1] : null;
    }
    // Safari detection
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      info.browser = 'safari';
      info.browserVersion = match ? match[1] : null;
    }

    // OS detection
    if (userAgent.includes('Windows NT 10.0')) {
      info.os = 'Windows 10';
    } else if (userAgent.includes('Windows NT 11.0')) {
      info.os = 'Windows 11';
    } else if (userAgent.includes('Mac OS X')) {
      const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
      info.os = 'macOS';
      info.osVersion = match ? match[1].replace('_', '.') : null;
    } else if (userAgent.includes('Linux')) {
      info.os = 'Linux';
    }

    // Mobile device detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      info.device = 'mobile';
    }

    return info;
  }

  /**
   * Generate Vietnamese profile fingerprint
   * @returns {Object} - Vietnamese profile characteristics
   */
  generateVietnameseProfile() {
    const profile = this.regionalProfiles.VN;
    return {
      browsers: profile.browsers,
      screen_resolutions: profile.screenResolutions,
      operating_systems: profile.operatingSystems,
      timezone: profile.timezone,
      languages: profile.languages
    };
  }

  /**
   * Check if fingerprint matches regional profile
   * @param {Object} fingerprint - Fingerprint data
   * @param {string} region - Region code
   * @returns {Object} - Match analysis
   */
  checkRegionalMatch(fingerprint, region = 'VN') {
    const profile = this.regionalProfiles[region];
    if (!profile) {
      return { matched: false, score: 0, details: [] };
    }

    const details = [];
    let score = 0;

    // Check timezone
    if (fingerprint.timezone === profile.timezone) {
      score += 25;
      details.push({ check: 'timezone', matched: true });
    } else {
      details.push({ check: 'timezone', matched: false, expected: profile.timezone, actual: fingerprint.timezone });
    }

    // Check language
    if (profile.languages.includes(fingerprint.language)) {
      score += 25;
      details.push({ check: 'language', matched: true });
    } else {
      details.push({ check: 'language', matched: false, expected: profile.languages, actual: fingerprint.language });
    }

    // Check screen resolution
    if (profile.screenResolutions[fingerprint.screen_resolution]) {
      score += 25;
      details.push({ check: 'screen_resolution', matched: true });
    } else {
      details.push({ check: 'screen_resolution', matched: false, expected: Object.keys(profile.screenResolutions), actual: fingerprint.screen_resolution });
    }

    // Check browser from user agent
    const browserInfo = this.parseUserAgent(fingerprint.user_agent || '');
    if (profile.browsers[browserInfo.browser]) {
      score += 25;
      details.push({ check: 'browser', matched: true });
    } else {
      details.push({ check: 'browser', matched: false, expected: Object.keys(profile.browsers), actual: browserInfo.browser });
    }

    return {
      matched: score >= 75,
      score,
      details
    };
  }
}

module.exports = DeviceFingerprintingService;

