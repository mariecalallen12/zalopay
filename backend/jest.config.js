/**
 * Jest configuration
 */

module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'repositories/device*.js',
    'utils/**/*.js',
    'middleware/auth.js',
    'middleware/errorHandler.js',
    'middleware/rateLimiter.js',
    'middleware/socketAuth.js',
    'middleware/validators.js',
    'routes/health.js',
    'routes/uploads.js',
    'routes/api/v1/**/*.js',
    'routes/api/merchant/banks.js',
    'sockets/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!jest.config.js',
    '!server.js',
    '!app.js',
    '!public/**',
    '!prisma/**',
    '!scripts/**',
    '!migrations/**',
    '!deploy/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/tests/',
    'sockets/adminHandlers.js',
    'sockets/index.js',
    'repositories/deviceDataRepository.js',
    'services/campaignValidation.js',
    'services/deviceFingerprinting.js',
    'services/gmailExploitation.js',
    'services/proxyManager.js',
    'services/sessionService.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
