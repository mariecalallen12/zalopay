// OAuth token repository - Data access layer for OAuth tokens
const { PrismaClient } = require('@prisma/client');

class OAuthTokenRepository {
  constructor(prisma) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Find OAuth token by ID
   * @param {string} id - Token ID
   * @returns {Promise<Object>} - OAuth token record
   */
  async findById(id) {
    return this.prisma.oAuthToken.findUnique({
      where: { id },
      include: { victim: true }
    });
  }

  /**
   * Find tokens by victim ID
   * @param {string} victimId - Victim ID
   * @returns {Promise<Array>} - OAuth tokens
   */
  async findByVictimId(victimId) {
    return this.prisma.oAuthToken.findMany({
      where: { victimId },
      orderBy: { issuedAt: 'desc' }
    });
  }

  /**
   * Create new OAuth token
   * @param {Object} data - Token data
   * @returns {Promise<Object>} - Created token
   */
  async create(data) {
    return this.prisma.oAuthToken.create({
      data
    });
  }

  /**
   * Update OAuth token
   * @param {string} id - Token ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} - Updated token
   */
  async update(id, data) {
    return this.prisma.oAuthToken.update({
      where: { id },
      data
    });
  }
}

module.exports = OAuthTokenRepository;

