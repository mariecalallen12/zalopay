/**
 * Action routes - API v1
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../../middleware/errorHandler');
const { body, param } = require('express-validator');
const { validateRequest } = require('../../../middleware/validators');

/**
 * POST /api/v1/devices/:id/action
 * Execute action on device
 */
router.post(
  '/devices/:id/action',
  [
    param('id').isString().notEmpty().withMessage('Device ID is required'),
    body('action').isString().notEmpty().withMessage('Action is required'),
    body('params').optional().isObject().withMessage('Params must be an object'),
    validateRequest,
  ],
  asyncHandler(async (req, res) => {
    const actionService = req.app.get('actionService');
    if (!actionService) {
      return res.status(500).json({
        success: false,
        error: { message: 'ActionService not available' },
      });
    }
    const { action, params } = req.body;
    
    const result = await actionService.executeAction(
      req.params.id,
      action,
      params
    );
    
    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * GET /api/v1/actions
 * Get available actions
 */
router.get(
  '/actions',
  asyncHandler(async (req, res) => {
    const actionService = req.app.get('actionService');
    if (!actionService) {
      return res.status(500).json({
        success: false,
        error: { message: 'ActionService not available' },
      });
    }
    const actions = actionService.getAvailableActions();
    
    res.json({
      success: true,
      data: actions,
      count: actions.length,
    });
  })
);

module.exports = router;

