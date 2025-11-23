/**
 * Metrics collection utility
 */

const logger = require('../utils/logger');

class Metrics {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byRoute: {},
      },
      sockets: {
        total: 0,
        active: 0,
        disconnected: 0,
      },
      errors: {
        total: 0,
        byType: {},
      },
      actions: {
        total: 0,
        byType: {},
      },
      startTime: Date.now(),
    };
  }

  /**
   * Record request
   */
  recordRequest(method, route) {
    this.metrics.requests.total++;
    
    if (!this.metrics.requests.byMethod[method]) {
      this.metrics.requests.byMethod[method] = 0;
    }
    this.metrics.requests.byMethod[method]++;

    if (!this.metrics.requests.byRoute[route]) {
      this.metrics.requests.byRoute[route] = 0;
    }
    this.metrics.requests.byRoute[route]++;
  }

  /**
   * Record socket connection
   */
  recordSocketConnection() {
    this.metrics.sockets.total++;
    this.metrics.sockets.active++;
  }

  /**
   * Record socket disconnection
   */
  recordSocketDisconnection() {
    this.metrics.sockets.active = Math.max(0, this.metrics.sockets.active - 1);
    this.metrics.sockets.disconnected++;
  }

  /**
   * Record error
   */
  recordError(errorType) {
    this.metrics.errors.total++;
    
    if (!this.metrics.errors.byType[errorType]) {
      this.metrics.errors.byType[errorType] = 0;
    }
    this.metrics.errors.byType[errorType]++;
  }

  /**
   * Record action
   */
  recordAction(actionType) {
    this.metrics.actions.total++;
    
    if (!this.metrics.actions.byType[actionType]) {
      this.metrics.actions.byType[actionType] = 0;
    }
    this.metrics.actions.byType[actionType]++;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);
    
    return {
      ...this.metrics,
      uptime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byRoute: {},
      },
      sockets: {
        total: 0,
        active: 0,
        disconnected: 0,
      },
      errors: {
        total: 0,
        byType: {},
      },
      actions: {
        total: 0,
        byType: {},
      },
      startTime: Date.now(),
    };
  }
}

// Singleton instance
const metrics = new Metrics();

module.exports = metrics;

