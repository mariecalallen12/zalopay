/**
 * Unit tests for metrics
 */

const metrics = require('../../../utils/metrics');

describe('Metrics', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('recordRequest', () => {
    it('should record request', () => {
      metrics.recordRequest('GET', '/api/devices');
      
      const m = metrics.getMetrics();
      expect(m.requests.total).toBe(1);
      expect(m.requests.byMethod.GET).toBe(1);
      expect(m.requests.byRoute['/api/devices']).toBe(1);
    });

    it('should increment request counts', () => {
      metrics.recordRequest('GET', '/api/devices');
      metrics.recordRequest('POST', '/api/devices');
      metrics.recordRequest('GET', '/api/devices');

      const m = metrics.getMetrics();
      expect(m.requests.total).toBe(3);
      expect(m.requests.byMethod.GET).toBe(2);
      expect(m.requests.byMethod.POST).toBe(1);
      expect(m.requests.byRoute['/api/devices']).toBe(3);
    });
  });

  describe('recordSocketConnection', () => {
    it('should record socket connection', () => {
      metrics.recordSocketConnection();
      
      const m = metrics.getMetrics();
      expect(m.sockets.total).toBe(1);
      expect(m.sockets.active).toBe(1);
    });

    it('should increment connection counts', () => {
      metrics.recordSocketConnection();
      metrics.recordSocketConnection();
      
      const m = metrics.getMetrics();
      expect(m.sockets.total).toBe(2);
      expect(m.sockets.active).toBe(2);
    });
  });

  describe('recordSocketDisconnection', () => {
    it('should record socket disconnection', () => {
      metrics.recordSocketConnection();
      metrics.recordSocketConnection();
      metrics.recordSocketDisconnection();
      
      const m = metrics.getMetrics();
      expect(m.sockets.active).toBe(1);
      expect(m.sockets.disconnected).toBe(1);
    });

    it('should not go below zero active sockets', () => {
      metrics.recordSocketDisconnection();
      metrics.recordSocketDisconnection();
      
      const m = metrics.getMetrics();
      expect(m.sockets.active).toBe(0);
    });
  });

  describe('recordError', () => {
    it('should record error', () => {
      metrics.recordError('validation_error');
      
      const m = metrics.getMetrics();
      expect(m.errors.total).toBe(1);
      expect(m.errors.byType.validation_error).toBe(1);
    });

    it('should track multiple error types', () => {
      metrics.recordError('validation_error');
      metrics.recordError('not_found_error');
      metrics.recordError('validation_error');
      
      const m = metrics.getMetrics();
      expect(m.errors.total).toBe(3);
      expect(m.errors.byType.validation_error).toBe(2);
      expect(m.errors.byType.not_found_error).toBe(1);
    });
  });

  describe('recordAction', () => {
    it('should record action', () => {
      metrics.recordAction('contacts');
      
      const m = metrics.getMetrics();
      expect(m.actions.total).toBe(1);
      expect(m.actions.byType.contacts).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics with uptime', () => {
      const m = metrics.getMetrics();
      expect(m).toHaveProperty('uptime');
      expect(m).toHaveProperty('timestamp');
      expect(m).toHaveProperty('requests');
      expect(m).toHaveProperty('sockets');
      expect(m).toHaveProperty('errors');
      expect(m).toHaveProperty('actions');
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      metrics.recordRequest('GET', '/test');
      metrics.recordSocketConnection();
      metrics.recordError('test_error');
      
      metrics.reset();
      
      const m = metrics.getMetrics();
      expect(m.requests.total).toBe(0);
      expect(m.sockets.total).toBe(0);
      expect(m.errors.total).toBe(0);
    });
  });
});

