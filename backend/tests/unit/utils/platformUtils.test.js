/**
 * Unit tests for platformUtils
 */

const {
  isPlatformSupported,
  getPlatformActions,
  normalizePlatformData,
  getPlatformAction,
  validatePlatform,
  getPlatformDisplayName,
  getPlatformIcon,
  comparePlatforms,
} = require('../../../utils/platformUtils');

describe('platformUtils', () => {
  describe('isPlatformSupported', () => {
    it('should return true for supported actions', () => {
      expect(isPlatformSupported('contacts', 'android')).toBe(true);
      expect(isPlatformSupported('contacts', 'ios')).toBe(true);
    });

    it('should return false for unsupported actions', () => {
      expect(isPlatformSupported('phishing', 'ios')).toBe(false);
    });

    it('should return false for invalid inputs', () => {
      expect(isPlatformSupported(null, 'android')).toBe(false);
      expect(isPlatformSupported('contacts', null)).toBe(false);
    });
  });

  describe('getPlatformActions', () => {
    it('should return actions for Android', () => {
      const actions = getPlatformActions('android');
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should return actions for iOS', () => {
      const actions = getPlatformActions('ios');
      expect(Array.isArray(actions)).toBe(true);
    });

    it('should return empty array for invalid platform', () => {
      expect(getPlatformActions(null)).toEqual([]);
      expect(getPlatformActions('windows')).toEqual([]);
    });
  });

  describe('normalizePlatformData', () => {
    it('should return data as-is for non-object', () => {
      expect(normalizePlatformData(null, 'android')).toBeNull();
      expect(normalizePlatformData('string', 'android')).toBe('string');
    });

    it('should normalize iOS data format', () => {
      const data = { openUrl: 'https://test.com' };
      const normalized = normalizePlatformData(data, 'ios');
      expect(normalized['open-url']).toBe('https://test.com');
    });

    it('should ensure arrays for list fields', () => {
      const data = { contacts: 'not-array' };
      const normalized = normalizePlatformData(data, 'android');
      expect(Array.isArray(normalized.contacts)).toBe(true);
    });
  });

  describe('getPlatformAction', () => {
    it('should return action name as-is when no platform specified', () => {
      expect(getPlatformAction('contacts', null)).toBe('contacts');
    });

    it('should return platform-specific action name', () => {
      const action = getPlatformAction('openUrl', 'ios');
      expect(typeof action).toBe('string');
    });
  });

  describe('validatePlatform', () => {
    it('should return true for valid platforms', () => {
      expect(validatePlatform('android')).toBe(true);
      expect(validatePlatform('ios')).toBe(true);
    });

    it('should return false for invalid platforms', () => {
      expect(validatePlatform('windows')).toBe(false);
    });
  });

  describe('getPlatformDisplayName', () => {
    it('should return display name for iOS', () => {
      expect(getPlatformDisplayName('ios')).toBe('iOS');
    });

    it('should return display name for Android', () => {
      expect(getPlatformDisplayName('android')).toBe('Android');
    });

    it('should return Unknown for invalid platform', () => {
      expect(getPlatformDisplayName('windows')).toBe('Unknown');
    });
  });

  describe('getPlatformIcon', () => {
    it('should return icon for iOS', () => {
      expect(getPlatformIcon('ios')).toBe('🍎');
    });

    it('should return icon for Android', () => {
      expect(getPlatformIcon('android')).toBe('🤖');
    });

    it('should return default icon for invalid platform', () => {
      expect(getPlatformIcon('windows')).toBe('📱');
    });
  });

  describe('comparePlatforms', () => {
    it('should return true for same platforms', () => {
      expect(comparePlatforms('android', 'android')).toBe(true);
      expect(comparePlatforms('ios', 'ios')).toBe(true);
    });

    it('should return false for different platforms', () => {
      expect(comparePlatforms('android', 'ios')).toBe(false);
    });

    it('should handle case variations', () => {
      expect(comparePlatforms('android', 'ANDROID')).toBe(true);
      expect(comparePlatforms('ios', 'IOS')).toBe(true);
    });
  });
});

