// Campaign repository - Data access layer for campaigns
const { PrismaClient } = require('@prisma/client');

class CampaignRepository {
  constructor(prisma) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Find campaign by ID
   * @param {string} id - Campaign ID
   * @returns {Promise<Object>} - Campaign record
   */
  async findById(id) {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: {
        creator: true,
        victims: {
          take: 10,
          orderBy: { captureTimestamp: 'desc' }
        }
      }
    });
  }

  /**
   * Find campaign by code
   * @param {string} code - Campaign code
   * @returns {Promise<Object>} - Campaign record
   */
  async findByCode(code) {
    return this.prisma.campaign.findUnique({
      where: { code }
    });
  }

  /**
   * Create new campaign
   * @param {Object} data - Campaign data
   * @returns {Promise<Object>} - Created campaign
   */
  async create(data) {
    return this.prisma.campaign.create({
      data
    });
  }

  /**
   * Update campaign
   * @param {string} id - Campaign ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} - Updated campaign
   */
  async update(id, data) {
    return this.prisma.campaign.update({
      where: { id },
      data
    });
  }

  /**
   * Find campaigns with filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} - Campaigns list
   */
  async findMany(filters = {}) {
    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    return this.prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: true,
        _count: {
          select: { victims: true }
        }
      }
    });
  }
}

module.exports = CampaignRepository;

