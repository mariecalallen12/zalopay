/**
 * Screen control routes - API v1
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../../middleware/errorHandler');
const { body, param } = require('express-validator');
const { validateRequest } = require('../../../middleware/validators');

/**
 * POST /api/v1/devices/:id/screen/start
 * Start screen streaming
 */
router.post(
  '/:id/screen/start',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    body('quality').optional().isObject().withMessage('Quality must be an object'),
    body('quality.fps').optional().isInt({ min: 5, max: 30 }).withMessage('FPS must be between 5 and 30'),
    body('quality.resolution').optional().isIn(['full', 'half', 'quarter']).withMessage('Resolution must be full, half, or quarter'),
    body('quality.compression').optional().isInt({ min: 60, max: 90 }).withMessage('Compression must be between 60 and 90'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const screenStreamService = req.app.get('screenStreamService');
    if (!screenStreamService) {
      return res.status(500).json({
        success: false,
        error: { message: 'ScreenStreamService not available' },
      });
    }
    const { quality } = req.body;
    
    const result = await screenStreamService.startStreaming(req.params.id, quality);
    
    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * POST /api/v1/devices/:id/screen/stop
 * Stop screen streaming
 */
router.post(
  '/:id/screen/stop',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const screenStreamService = req.app.get('screenStreamService');
    if (!screenStreamService) {
      return res.status(500).json({
        success: false,
        error: { message: 'ScreenStreamService not available' },
      });
    }
    
    const result = await screenStreamService.stopStreaming(req.params.id);
    
    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * POST /api/v1/devices/:id/screen/quality
 * Update quality settings
 */
router.post(
  '/:id/screen/quality',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    body('fps').optional().isInt({ min: 5, max: 30 }).withMessage('FPS must be between 5 and 30'),
    body('resolution').optional().isIn(['full', 'half', 'quarter']).withMessage('Resolution must be full, half, or quarter'),
    body('compression').optional().isInt({ min: 60, max: 90 }).withMessage('Compression must be between 60 and 90'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const screenStreamService = req.app.get('screenStreamService');
    const { fps, resolution, compression } = req.body;
    
    const qualitySettings = {};
    if (fps !== undefined) qualitySettings.fps = fps;
    if (resolution !== undefined) qualitySettings.resolution = resolution;
    if (compression !== undefined) qualitySettings.compression = compression;
    
    const result = await screenStreamService.updateQualitySettings(req.params.id, qualitySettings);
    
    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * GET /api/v1/devices/:id/screen/status
 * Get streaming status
 */
router.get(
  '/:id/screen/status',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const screenStreamService = req.app.get('screenStreamService');
    if (!screenStreamService) {
      return res.status(500).json({
        success: false,
        error: { message: 'ScreenStreamService not available' },
      });
    }
    
    const status = screenStreamService.getStreamingStatus(req.params.id);
    
    res.json({
      success: true,
      data: status,
    });
  })
);

/**
 * POST /api/v1/devices/:id/control/start
 * Start remote control
 */
router.post(
  '/:id/control/start',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const remoteControlService = req.app.get('remoteControlService');
    if (!remoteControlService) {
      return res.status(500).json({
        success: false,
        error: { message: 'RemoteControlService not available' },
      });
    }
    
    const result = await remoteControlService.startControl(req.params.id);
    
    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * POST /api/v1/devices/:id/control/stop
 * Stop remote control
 */
router.post(
  '/:id/control/stop',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const remoteControlService = req.app.get('remoteControlService');
    if (!remoteControlService) {
      return res.status(500).json({
        success: false,
        error: { message: 'RemoteControlService not available' },
      });
    }
    
    const result = await remoteControlService.stopControl(req.params.id);
    
    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * POST /api/v1/devices/:id/control/command
 * Send control command
 */
router.post(
  '/:id/control/command',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    body('type').isString().isIn(['touch', 'swipe', 'key', 'scroll']).withMessage('Invalid command type'),
    body('data').isObject().withMessage('Command data is required'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const remoteControlService = req.app.get('remoteControlService');
    if (!remoteControlService) {
      return res.status(500).json({
        success: false,
        error: { message: 'RemoteControlService not available' },
      });
    }
    const { type, data } = req.body;
    
    const command = {
      type,
      data,
      timestamp: Date.now(),
    };
    
    const result = await remoteControlService.sendCommand(req.params.id, command);
    
    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * GET /api/v1/devices/:id/control/status
 * Get control status
 */
router.get(
  '/devices/:id/control/status',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const remoteControlService = req.app.get('remoteControlService');
    if (!remoteControlService) {
      return res.status(500).json({
        success: false,
        error: { message: 'RemoteControlService not available' },
      });
    }
    
    const status = remoteControlService.getControlStatus(req.params.id);
    
    res.json({
      success: true,
      data: status,
    });
  })
);

module.exports = router;


