/**
 * Mock factories for testing
 * Provides reusable mock objects for tests
 */

/**
 * Create mock Socket.IO instance
 */
function createMockIo() {
  const sockets = new Map();
  const emitMock = jest.fn();
  const toEmitMock = jest.fn();
  
  // Create to function that returns an object with emit method
  // This ensures io.to(deviceId).emit() works correctly
  const toMock = jest.fn((id) => {
    return {
      emit: toEmitMock,
      to: jest.fn().mockReturnThis(),
    };
  });
  
  const mockIo = {
    sockets: {
      sockets: sockets,
      has: (id) => sockets.has(id),
      get: (id) => sockets.get(id),
      set: (id, socket) => sockets.set(id, socket),
      delete: (id) => sockets.delete(id),
    },
    to: toMock,
    emit: emitMock,
    on: jest.fn(),
    // Expose toEmitMock for testing purposes
    _toEmitMock: toEmitMock,
  };
  
  // Ensure emit is always defined
  if (!mockIo.emit) {
    mockIo.emit = emitMock;
  }
  
  return mockIo;
}

/**
 * Create mock Socket.IO socket
 */
function createMockSocket(id = 'test-socket-id', options = {}) {
  return {
    id: id,
    deviceId: options.deviceId || id,
    model: options.model || 'Test Device',
    version: options.version || 'Android 12',
    ip: options.ip || '192.168.1.1',
    platform: options.platform || 'android',
    authenticated: options.authenticated !== undefined ? options.authenticated : true,
    user: options.user || null,
    handshake: {
      headers: {
        model: options.model || 'Test Device',
        version: options.version || 'Android 12',
        ip: options.ip || '192.168.1.1',
        platform: options.platform || 'android',
        'user-agent': options.userAgent || 'TestAgent',
        ...options.headers,
      },
      auth: options.auth || {},
      query: options.query || {},
    },
    emit: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
  };
}

/**
 * Create mock DeviceService
 */
function createMockDeviceService(options = {}) {
  return {
    isDeviceConnected: jest.fn().mockReturnValue(options.isConnected !== false),
    getDeviceById: jest.fn().mockResolvedValue(options.device || {
      info: {
        id: 'test-device-id',
        model: 'Test Device',
        version: 'Android 12',
        ip: '192.168.1.1',
        platform: 'android',
        online: true,
      },
      data: {},
    }),
    getAllDevices: jest.fn().mockResolvedValue(options.devices || []),
    createOrUpdateDevice: jest.fn().mockResolvedValue({}),
    initDeviceData: jest.fn().mockResolvedValue({}),
    updateDeviceData: jest.fn().mockResolvedValue({}),
    emitToDevice: jest.fn(),
    broadcast: jest.fn(),
  };
}

/**
 * Create mock DeviceRepository
 */
function createMockDeviceRepository(options = {}) {
  const devices = new Map();
  
  return {
    devices: devices,
    init: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockImplementation((filters = {}) => {
      let results = Array.from(devices.values());
      if (filters.platform) {
        results = results.filter(d => (d.platform || 'android') === filters.platform);
      }
      if (filters.online !== undefined) {
        results = results.filter(d => d.online === filters.online);
      }
      return Promise.resolve(results);
    }),
    findById: jest.fn().mockImplementation((id) => {
      return Promise.resolve(devices.get(id) || null);
    }),
    create: jest.fn().mockImplementation((device) => {
      devices.set(device.id, device);
      return Promise.resolve(device);
    }),
    update: jest.fn().mockImplementation((id, updates) => {
      const device = devices.get(id);
      if (device) {
        Object.assign(device, updates);
        devices.set(id, device);
        return Promise.resolve(device);
      }
      return Promise.resolve(null);
    }),
    delete: jest.fn().mockImplementation((id) => {
      devices.delete(id);
      return Promise.resolve(true);
    }),
  };
}

/**
 * Create mock DeviceDataRepository
 */
function createMockDeviceDataRepository(options = {}) {
  const deviceData = new Map();
  
  return {
    deviceData: deviceData,
    init: jest.fn().mockResolvedValue(undefined),
    findByDeviceId: jest.fn().mockImplementation((deviceId) => {
      return Promise.resolve(deviceData.get(deviceId) || null);
    }),
    update: jest.fn().mockImplementation((deviceId, type, data) => {
      const existing = deviceData.get(deviceId) || {};
      existing[type] = data;
      deviceData.set(deviceId, existing);
      return Promise.resolve(existing);
    }),
    addFile: jest.fn().mockResolvedValue({}),
  };
}

/**
 * Create mock Express request
 */
function createMockRequest(options = {}) {
  return {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {},
    ip: options.ip || '127.0.0.1',
    method: options.method || 'GET',
    url: options.url || '/',
    get: jest.fn().mockImplementation((header) => {
      return (options.headers || {})[header.toLowerCase()] || null;
    }),
    app: {
      get: jest.fn().mockReturnValue(options.service || null),
    },
  };
}

/**
 * Create mock Express response
 */
function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Create mock Express next function
 */
function createMockNext() {
  return jest.fn();
}

/**
 * Create test device data
 */
function createTestDevice(options = {}) {
  return {
    id: options.id || 'test-device-id',
    model: options.model || 'Test Device',
    version: options.version || 'Android 12',
    ip: options.ip || '192.168.1.1',
    platform: options.platform || 'android',
    platformVersion: options.platformVersion || null,
    connectedAt: options.connectedAt || new Date().toISOString(),
    online: options.online !== undefined ? options.online : true,
  };
}

/**
 * Create test device data object
 */
function createTestDeviceData(options = {}) {
  return {
    contacts: options.contacts || [],
    sms: options.sms || [],
    calls: options.calls || [],
    gallery: options.gallery || [],
    camera: options.camera || {
      main: [],
      selfie: [],
    },
    screenshots: options.screenshots || [],
    keylogger: options.keylogger || [],
    clipboard: options.clipboard || null,
    location: options.location || null,
    apps: options.apps || [],
  };
}

module.exports = {
  createMockIo,
  createMockSocket,
  createMockDeviceService,
  createMockDeviceRepository,
  createMockDeviceDataRepository,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createTestDevice,
  createTestDeviceData,
};

