/**
 * Unit tests for iosHelpers
 */

const {
  normalizeIOSContact,
  normalizeIOSSMS,
  normalizeIOSCall,
  normalizeIOSLocation,
  normalizeIOSApps,
  isIOSFormat,
  normalizeIOSDataArray,
} = require('../../../utils/iosHelpers');

describe('iosHelpers', () => {
  describe('normalizeIOSContact', () => {
    it('should normalize iOS contact format', () => {
      const iosContact = {
        identifier: '123',
        givenName: 'John',
        familyName: 'Doe',
        phoneNumbers: [{ value: '1234567890' }],
        emailAddresses: [{ value: 'john@example.com' }],
      };

      const normalized = normalizeIOSContact(iosContact);
      expect(normalized.name).toBe('John Doe');
      expect(normalized.phone).toBe('1234567890');
      expect(normalized.email).toBe('john@example.com');
    });

    it('should handle missing fields', () => {
      const iosContact = { identifier: '123' };
      const normalized = normalizeIOSContact(iosContact);
      expect(normalized.name).toBe('');
      expect(normalized.phone).toBe('');
    });

    it('should return null for invalid input', () => {
      expect(normalizeIOSContact(null)).toBeNull();
      expect(normalizeIOSContact('string')).toBeNull();
    });
  });

  describe('normalizeIOSSMS', () => {
    it('should normalize iOS SMS format', () => {
      const iosSms = {
        identifier: '123',
        address: '1234567890',
        body: 'Hello',
        date: '2023-01-01T00:00:00Z',
        isRead: true,
      };

      const normalized = normalizeIOSSMS(iosSms);
      expect(normalized.address).toBe('1234567890');
      expect(normalized.body).toBe('Hello');
      expect(normalized.type).toBe('read');
    });

    it('should return null for invalid input', () => {
      expect(normalizeIOSSMS(null)).toBeNull();
    });
  });

  describe('normalizeIOSCall', () => {
    it('should normalize iOS call format', () => {
      const iosCall = {
        identifier: '123',
        phoneNumber: '1234567890',
        callType: 'outgoing',
        date: '2023-01-01T00:00:00Z',
        duration: 60,
      };

      const normalized = normalizeIOSCall(iosCall);
      expect(normalized.number).toBe('1234567890');
      expect(normalized.type).toBe('outgoing');
      expect(normalized.duration).toBe(60);
    });
  });

  describe('normalizeIOSLocation', () => {
    it('should normalize iOS location format', () => {
      const iosLocation = {
        latitude: 10.123,
        longitude: 20.456,
        horizontalAccuracy: 5,
        altitude: 100,
        timestamp: '2023-01-01T00:00:00Z',
      };

      const normalized = normalizeIOSLocation(iosLocation);
      expect(normalized.latitude).toBe(10.123);
      expect(normalized.longitude).toBe(20.456);
      expect(normalized.accuracy).toBe(5);
    });

    it('should handle coordinate object format', () => {
      const iosLocation = {
        coordinate: { latitude: 10, longitude: 20 },
        horizontalAccuracy: 5,
      };

      const normalized = normalizeIOSLocation(iosLocation);
      expect(normalized.latitude).toBe(10);
      expect(normalized.longitude).toBe(20);
    });
  });

  describe('normalizeIOSApps', () => {
    it('should normalize iOS apps array', () => {
      const iosApps = [
        { bundleIdentifier: 'com.test.app', localizedName: 'Test App', version: '1.0' },
      ];

      const normalized = normalizeIOSApps(iosApps);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].packageName).toBe('com.test.app');
      expect(normalized[0].name).toBe('Test App');
    });

    it('should return empty array for invalid input', () => {
      expect(normalizeIOSApps(null)).toEqual([]);
      expect(normalizeIOSApps('string')).toEqual([]);
    });

    it('should filter out invalid apps', () => {
      const iosApps = [
        { bundleIdentifier: 'com.test.app', name: 'Test' },
        { name: 'Invalid' }, // Missing bundleIdentifier
      ];

      const normalized = normalizeIOSApps(iosApps);
      expect(normalized).toHaveLength(1);
    });
  });

  describe('isIOSFormat', () => {
    it('should return true for iOS format data', () => {
      expect(isIOSFormat({ bundleIdentifier: 'com.test' })).toBe(true);
      expect(isIOSFormat({ identifier: '123' })).toBe(true);
      expect(isIOSFormat({ givenName: 'John' })).toBe(true);
    });

    it('should return false for non-iOS format', () => {
      expect(isIOSFormat({ packageName: 'com.test' })).toBe(false);
      expect(isIOSFormat(null)).toBe(false);
    });
  });

  describe('normalizeIOSDataArray', () => {
    it('should normalize contacts array', () => {
      const contacts = [
        { identifier: '1', givenName: 'John', familyName: 'Doe' },
      ];

      const normalized = normalizeIOSDataArray(contacts, 'contacts');
      expect(normalized).toHaveLength(1);
      expect(normalized[0].name).toBe('John Doe');
    });

    it('should normalize SMS array', () => {
      const sms = [{ identifier: '1', address: '123', body: 'Hello' }];
      const normalized = normalizeIOSDataArray(sms, 'sms');
      expect(normalized).toHaveLength(1);
    });

    it('should return array as-is for unknown type', () => {
      const data = [{ test: 'data' }];
      const normalized = normalizeIOSDataArray(data, 'unknown');
      expect(normalized).toEqual(data);
    });
  });
});

