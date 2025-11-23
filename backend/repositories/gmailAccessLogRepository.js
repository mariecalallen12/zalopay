// Gmail access log repository - Data access layer for Gmail access logs
const { PrismaClient } = require('@prisma/client');

class GmailAccessLogRepository {
  constructor(prisma) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Find Gmail access log by ID
   * @param {string} id - Gmail access log ID
   * @returns {Promise<Object>} - Gmail access log record
   */
  async findById(id) {
    return this.prisma.gmailAccessLog.findUnique({
      where: { id },
      include: {
        victim: true,
        admin: true,
        parentActivityLog: true
      }
    });
  }

  /**
   * Find Gmail access log by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Gmail access log record
   */
  async findBySessionId(sessionId) {
    return this.prisma.gmailAccessLog.findUnique({
      where: { sessionId },
      include: {
        victim: true,
        admin: true
      }
    });
  }

  /**
   * Find Gmail access logs by victim ID
   * @param {string} victimId - Victim ID
   * @returns {Promise<Array>} - Gmail access logs
   */
  async findByVictimId(victimId) {
    return this.prisma.gmailAccessLog.findMany({
      where: { victimId },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: true
      }
    });
  }

  /**
   * Create new Gmail access log
   * @param {Object} data - Gmail access log data
   * @returns {Promise<Object>} - Created Gmail access log
   */
  async create(data) {
    return this.prisma.gmailAccessLog.create({
      data
    });
  }

  /**
   * Update Gmail access log
   * @param {string} id - Gmail access log ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} - Updated Gmail access log
   */
  async update(id, data) {
    return this.prisma.gmailAccessLog.update({
      where: { id },
      data
    });
  }
}

module.exports = GmailAccessLogRepository;

