/**
 * Upload routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config');
const logger = require('../utils/logger');

// Ensure upload directory exists
if (!fs.existsSync(config.upload.uploadDir)) {
  fs.mkdirSync(config.upload.uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.uploadDir);
  },
  filename: (req, file, cb) => {
    const deviceModel = req.headers.model || 'unknown';
    const timestamp = Date.now();
    const sanitizedModel = deviceModel.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedModel}-${timestamp}-${file.originalname}`);
  },
});

const uploader = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

/**
 * POST /upload
 * Upload file from device
 */
router.post(
  '/upload',
  uploader.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded',
        },
      });
    }

    const fileName = req.file.filename;
    const deviceModel = req.headers.model || 'unknown';
    const filePath = `/uploads/${fileName}`;

    // Find device by model and add file to its data
    const deviceService = req.app.get('deviceService');
    const deviceRepository = req.app.get('deviceRepository');
    const deviceDataRepository = req.app.get('deviceDataRepository');

    let targetDeviceId = null;
    const devices = await deviceRepository.findAll();
    for (const device of devices) {
      if (device.model === deviceModel) {
        targetDeviceId = device.id;
        break;
      }
    }

    if (targetDeviceId) {
      await deviceDataRepository.addFile(targetDeviceId, {
        name: req.file.originalname,
        path: filePath,
        size: req.file.size,
      });
    }

    // Emit to web clients
    deviceService.broadcast('file-uploaded', {
      deviceId: targetDeviceId,
      deviceModel: deviceModel,
      file: {
        name: req.file.originalname,
        path: filePath,
        size: req.file.size,
      },
    });

    logger.info(`File uploaded: ${fileName} from device ${targetDeviceId || 'unknown'}`);

    res.json({
      success: true,
      filePath: filePath,
    });
  })
);

module.exports = router;

