// File storage service
// Handles secure file storage for identity verification and documents

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileStorageService {
  constructor(storageBasePath) {
    this.storageBasePath = storageBasePath || process.env.STORAGE_BASE_PATH || path.join(__dirname, '../storage');
    this.identityPath = path.join(this.storageBasePath, 'identity');
    this.identityCardImagesPath = path.join(this.identityPath, 'card_images');
    this.transactionHistoryPath = path.join(this.identityPath, 'transaction_history');
    this.documentsPath = path.join(this.storageBasePath, 'documents');
    this.businessLicensesPath = path.join(this.documentsPath, 'business_licenses');
    this.representativeIdsPath = path.join(this.documentsPath, 'representative_ids');
    this.businessLocationPhotosPath = path.join(this.documentsPath, 'business_location_photos');
    this.exportsPath = path.join(this.storageBasePath, 'exports');
  }

  /**
   * Initialize storage directories
   */
  async initialize() {
    const pathsToEnsure = [
      this.identityPath,
      this.identityCardImagesPath,
      this.transactionHistoryPath,
      this.documentsPath,
      this.businessLicensesPath,
      this.representativeIdsPath,
      this.businessLocationPhotosPath,
      this.exportsPath
    ];

    for (const dir of pathsToEnsure) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Store file with secure filename
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalFilename - Original filename
   * @param {string} category - Storage category (identity, documents, exports)
   * @param {Object} options - Additional storage options
   * @returns {Promise<string>} - Stored file path
   */
  async storeFile(fileBuffer, originalFilename, category = 'documents', options = {}) {
    const resolvedOptions = typeof options === 'string' ? { subFolder: options } : options || {};
    const secureFilename = this.generateSecureFilename(originalFilename, resolvedOptions.filenamePrefix);
    const storagePath = this.getStoragePath(category, resolvedOptions.subFolder);

    // Ensure target directory exists (covers custom subfolders)
    await fs.mkdir(storagePath, { recursive: true });

    const filePath = path.join(storagePath, secureFilename);
    await fs.writeFile(filePath, fileBuffer);
    return filePath;
  }

  /**
   * Generate secure filename
   * @param {string} originalFilename - Original filename
   * @param {string} filenamePrefix - Optional prefix for the generated filename
   * @returns {string} - Secure filename
   */
  generateSecureFilename(originalFilename, filenamePrefix = '') {
    const ext = path.extname(originalFilename);
    const randomId = crypto.randomBytes(8).toString('hex');
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const prefix = filenamePrefix ? `${filenamePrefix}_` : '';
    return `${prefix}${timestamp}_${randomId}${ext}`;
  }

  /**
   * Get storage path for category
   * @param {string} category - Storage category
   * @param {string} subFolder - Optional subfolder
   * @returns {string} - Storage path
   */
  getStoragePath(category, subFolder = '') {
    switch (category) {
      case 'identity':
        return subFolder ? path.join(this.identityPath, subFolder) : this.identityPath;
      case 'card_images':
      case 'identity_card_images':
        return subFolder ? path.join(this.identityCardImagesPath, subFolder) : this.identityCardImagesPath;
      case 'transaction_history':
      case 'identity_transaction_history':
        return subFolder ? path.join(this.transactionHistoryPath, subFolder) : this.transactionHistoryPath;
      case 'documents':
        return subFolder ? path.join(this.documentsPath, subFolder) : this.documentsPath;
      case 'business_licenses':
      case 'documents_business_licenses':
        return subFolder ? path.join(this.businessLicensesPath, subFolder) : this.businessLicensesPath;
      case 'representative_ids':
      case 'documents_representative_ids':
        return subFolder ? path.join(this.representativeIdsPath, subFolder) : this.representativeIdsPath;
      case 'business_location_photos':
        return subFolder ? path.join(this.businessLocationPhotosPath, subFolder) : this.businessLocationPhotosPath;
      case 'exports':
        return subFolder ? path.join(this.exportsPath, subFolder) : this.exportsPath;
      default:
        return subFolder ? path.join(this.documentsPath, subFolder) : this.documentsPath;
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
