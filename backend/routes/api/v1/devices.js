/**
 * Device routes - API v1
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../../middleware/errorHandler');
const { body, param, query, validationResult } = require('express-validator');
const { validateRequest } = require('../../../middleware/validators');
const { normalizePlatform, isValidPlatform } = require('../../../utils/platformDetector');

/**
 * GET /api/v1/devices
 * Get all devices
 * Query params:
 *   - platform: Filter by platform ('android' or 'ios')
 *   - online: Filter by online status (true/false)
 */
router.get(
  '/',
  [
    query('platform').optional().isIn(['android', 'ios']).withMessage('Platform must be android or ios'),
    query('online').optional().isBoolean().withMessage('Online must be a boolean'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const deviceService = req.app.get('deviceService');
    
    // Build filters
    const filters = {};
    if (req.query.platform) {
      filters.platform = normalizePlatform(req.query.platform);
    }
    if (req.query.online !== undefined) {
      filters.online = req.query.online === 'true';
    }
    
    const devices = await deviceService.getAllDevices(filters);
    
    res.json({
      success: true,
      data: devices,
      count: devices.length,
      filters: filters,
    });
  })
);

/**
 * GET /api/v1/devices/:id
 * Get device by ID
 */
router.get(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const deviceService = req.app.get('deviceService');
    const device = await deviceService.getDeviceById(req.params.id);
    
    res.json({
      success: true,
      data: device,
    });
  })
);

module.exports = router;

