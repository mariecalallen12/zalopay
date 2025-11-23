// Activity log repository - Data access layer for activity logs
const { PrismaClient } = require('@prisma/client');

class ActivityLogRepository {
  constructor(prisma) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Find activity log by ID
   * @param {string} id - Activity log ID
   * @returns {Promise<Object>} - Activity log record
   */
  async findById(id) {
    return this.prisma.activityLog.findUnique({
      where: { id },
      include: {
        admin: true,
        gmailAccessLogs: true
      }
    });
  }

  /**
   * Create new activity log
   * @param {Object} data - Activity log data
   * @returns {Promise<Object>} - Created activity log
   */
  async create(data) {
    return this.prisma.activityLog.create({
      data
    });
  }

  /**
   * Find activity logs with filters
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - Activity logs list and total count
   */
  async findMany(filters = {}, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(filters);

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          admin: true
        }
      }),
      this.prisma.activityLog.count({ where })
    ]);

    return {
      logs,
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

    if (filters.adminId) {
      where.adminId = filters.adminId;
    }

    if (filters.actionType) {
      where.actionType = filters.actionType;
    }

    if (filters.actionCategory) {
      where.actionCategory = filters.actionCategory;
    }

    if (filters.severityLevel) {
      where.severityLevel = filters.severityLevel;
    }

    if (filters.archived !== undefined) {
      where.archived = filters.archived;
    }

    return where;
  }
}

module.exports = ActivityLogRepository;

