/**
 * Unit tests for platformDetector
 */

const {
  PLATFORMS,
  detectFromHeaders,
  detectFromDeviceInfo,
  detectFromSocket,
  isValidPlatform,
  normalizePlatform,
} = require('../../../utils/platformDetector');
const { createMockSocket } = require('../../helpers/mockFactories');

describe('platformDetector', () => {
  describe('PLATFORMS', () => {
    it('should have ANDROID and IOS constants', () => {
      expect(PLATFORMS.ANDROID).toBe('android');
      expect(PLATFORMS.IOS).toBe('ios');
    });
  });

  describe('detectFromHeaders', () => {
    it('should detect platform from explicit platform header', () => {
      const headers = { platform: 'ios' };
      expect(detectFromHeaders(headers)).toBe('ios');
    });

    it('should detect platform from user-agent header', () => {
      expect(detectFromHeaders({ 'user-agent': 'iPhone' })).toBe('ios');
      expect(detectFromHeaders({ 'user-agent': 'Android' })).toBe('android');
    });

    it('should detect iOS from model header', () => {
      expect(detectFromHeaders({ model: 'iPhone 14' })).toBe('ios');
      expect(detectFromHeaders({ model: 'iPad Pro' })).toBe('ios');
    });

    it('should default to android when no indicators found', () => {
      expect(detectFromHeaders({})).toBe('android');
    });

    it('should handle case insensitive platform header', () => {
      expect(detectFromHeaders({ platform: 'IOS' })).toBe('ios');
      expect(detectFromHeaders({ platform: 'ANDROID' })).toBe('android');
    });
  });

  describe('detectFromDeviceInfo', () => {
    it('should detect platform from explicit platform field', () => {
      expect(detectFromDeviceInfo({ platform: 'ios' })).toBe('ios');
      expect(detectFromDeviceInfo({ platform: 'android' })).toBe('android');
    });

    it('should detect iOS from model field', () => {
      expect(detectFromDeviceInfo({ model: 'iPhone 14' })).toBe('ios');
      expect(detectFromDeviceInfo({ model: 'iPad' })).toBe('ios');
    });

    it('should detect iOS from version field', () => {
      expect(detectFromDeviceInfo({ version: 'iOS 16' })).toBe('ios');
    });

    it('should default to android when no indicators found', () => {
      expect(detectFromDeviceInfo({})).toBe('android');
    });
  });

  describe('detectFromSocket', () => {
    it('should detect platform from socket headers', () => {
      const socket = createMockSocket('test-id', {
        headers: { platform: 'ios' },
      });

      const result = detectFromSocket(socket);
      expect(result.platform).toBe('ios');
    });

    it('should extract platform version', () => {
      const socket = createMockSocket('test-id', {
        headers: { platform: 'ios', 'platform-version': '16.0' },
      });

      const result = detectFromSocket(socket);
      expect(result.platform).toBe('ios');
      expect(result.platformVersion).toBe('16.0');
    });

    it('should normalize iOS version format', () => {
      const socket = createMockSocket('test-id', {
        headers: { platform: 'ios', version: 'iOS 16.0' },
      });

      const result = detectFromSocket(socket);
      expect(result.platformVersion).toBe('16.0');
    });

    it('should default to android when no indicators found', () => {
      const socket = createMockSocket('test-id', {
        headers: {},
      });

      const result = detectFromSocket(socket);
      expect(result.platform).toBe('android');
    });
  });

  describe('isValidPlatform', () => {
    it('should return true for valid platforms', () => {
      expect(isValidPlatform('android')).toBe(true);
      expect(isValidPlatform('ios')).toBe(true);
    });

    it('should return false for invalid platforms', () => {
      expect(isValidPlatform('windows')).toBe(false);
      expect(isValidPlatform('linux')).toBe(false);
      expect(isValidPlatform('')).toBe(false);
    });
  });

  describe('normalizePlatform', () => {
    it('should normalize iOS variations', () => {
      expect(normalizePlatform('ios')).toBe('ios');
      expect(normalizePlatform('IOS')).toBe('ios');
      expect(normalizePlatform('iphone')).toBe('ios');
      expect(normalizePlatform('iPad')).toBe('ios');
    });

    it('should normalize Android variations', () => {
      expect(normalizePlatform('android')).toBe('android');
      expect(normalizePlatform('ANDROID')).toBe('android');
    });

    it('should default to android for unknown platforms', () => {
      expect(normalizePlatform('windows')).toBe('android');
      expect(normalizePlatform(null)).toBe('android');
      expect(normalizePlatform(undefined)).toBe('android');
    });
  });
});

