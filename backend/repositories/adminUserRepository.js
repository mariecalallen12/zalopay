// Admin user repository - Data access layer for admin users
const { PrismaClient } = require('@prisma/client');

class AdminUserRepository {
  constructor(prisma) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Find admin user by ID
   * @param {string} id - Admin user ID
   * @returns {Promise<Object>} - Admin user record
   */
  async findById(id) {
    return this.prisma.adminUser.findUnique({
      where: { id }
    });
  }

  /**
   * Find admin user by username
   * @param {string} username - Username
   * @returns {Promise<Object>} - Admin user record
   */
  async findByUsername(username) {
    return this.prisma.adminUser.findUnique({
      where: { username }
    });
  }

  /**
   * Find admin user by email
   * @param {string} email - Email address
   * @returns {Promise<Object>} - Admin user record
   */
  async findByEmail(email) {
    return this.prisma.adminUser.findUnique({
      where: { email }
    });
  }

  /**
   * Create new admin user
   * @param {Object} data - Admin user data
   * @returns {Promise<Object>} - Created admin user
   */
  async create(data) {
    return this.prisma.adminUser.create({
      data
    });
  }

  /**
   * Update admin user
   * @param {string} id - Admin user ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} - Updated admin user
   */
  async update(id, data) {
    return this.prisma.adminUser.update({
      where: { id },
      data
    });
  }
}

module.exports = AdminUserRepository;

