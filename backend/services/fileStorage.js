// File storage service
// Handles secure file storage for identity verification and documents

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileStorageService {
  constructor(storageBasePath) {
    this.storageBasePath = storageBasePath || path.join(__dirname, '../storage');
    this.identityPath = path.join(this.storageBasePath, 'identity');
    this.documentsPath = path.join(this.storageBasePath, 'documents');
    this.exportsPath = path.join(this.storageBasePath, 'exports');
  }

  /**
   * Initialize storage directories
   */
  async initialize() {
    await fs.mkdir(this.identityPath, { recursive: true });
    await fs.mkdir(this.documentsPath, { recursive: true });
    await fs.mkdir(this.exportsPath, { recursive: true });
  }

  /**
   * Store file with secure filename
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalFilename - Original filename
   * @param {string} category - Storage category (identity, documents, exports)
   * @returns {Promise<string>} - Stored file path
   */
  async storeFile(fileBuffer, originalFilename, category = 'documents') {
    const secureFilename = this.generateSecureFilename(originalFilename);
    const storagePath = this.getStoragePath(category);
    const filePath = path.join(storagePath, secureFilename);
    
    await fs.writeFile(filePath, fileBuffer);
    return filePath;
  }

  /**
   * Generate secure filename
   * @param {string} originalFilename - Original filename
   * @returns {string} - Secure filename
   */
  generateSecureFilename(originalFilename) {
    const ext = path.extname(originalFilename);
    const randomId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${randomId}${ext}`;
  }

  /**
   * Get storage path for category
   * @param {string} category - Storage category
   * @returns {string} - Storage path
   */
  getStoragePath(category) {
    switch (category) {
      case 'identity':
        return this.identityPath;
      case 'documents':
        return this.documentsPath;
      case 'exports':
        return this.exportsPath;
      default:
        return this.documentsPath;
    }
  }

  /**
   * Delete file
   * @param {string} filePath - File path to delete
   */
  async deleteFile(filePath) {
    await fs.unlink(filePath);
  }
}

module.exports = FileStorageService;

