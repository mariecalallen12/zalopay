// Merchant QR codes API endpoints
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const qrcode = require('qrcode');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

function requireVictimId(req, res) {
  const victimId = req.body.victim_id || req.query.victim_id;
  if (!victimId) {
    res.status(400).json({ error: 'victim_id is required' });
    return null;
  }
  return victimId;
}

/**
 * GET /api/merchant/qr-codes
 * Get list of QR codes
 */
router.get('/', async (req, res) => {
  try {
    const victimId = req.query.victim_id;
    const where = victimId ? { victimId } : {};

    const [qrCodes, total] = await Promise.all([
      prisma.qrCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.qrCode.count({ where }),
    ]);

    res.json({
      qrCodes,
      total
    });
  } catch (error) {
    logger.error('Error fetching QR codes:', error);
    res.status(500).json({
      error: 'Failed to fetch QR codes',
      message: error.message
    });
  }
});

/**
 * POST /api/merchant/qr-codes
 * Create a new QR code
 */
router.post('/', async (req, res) => {
  try {
    const { name, type, amount, description, design } = req.body;
    const victimId = requireVictimId(req, res);
    if (!victimId) return;

    if (!name) {
      return res.status(400).json({ error: 'QR code name is required' });
    }

    // Generate QR code data
    const qrData = `https://zalopay.vn/pay?merchant=${victimId || 'MERCHANT'}&name=${encodeURIComponent(name)}${amount ? `&amount=${amount}` : ''}`;

    // Generate QR code image (base64)
    let qrImage = null;
    try {
      qrImage = await qrcode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#0033C9',
          light: '#FFFFFF'
        }
      });
    } catch (qrError) {
      logger.warn('Error generating QR code image:', qrError);
    }

    // Create QR code record
    const qrCode = await prisma.qrCode.create({
      data: {
        victimId,
        name,
        type: type || 'static',
        amount: amount ? parseInt(amount, 10) : null,
        description: description || '',
        design: design || 'default',
        qrData,
        qrImage,
        status: 'active',
      },
    });

    res.status(201).json({
      success: true,
      qrCode
    });
  } catch (error) {
    logger.error('Error creating QR code:', error);
    res.status(500).json({
      error: 'Failed to create QR code',
      message: error.message
    });
  }
});

/**
 * GET /api/merchant/qr-codes/:id
 * Get QR code details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const victimId = req.query.victim_id;

    const where = victimId ? { id, victimId } : { id };
    const qrCode = await prisma.qrCode.findUnique({
      where: { id },
    });

    if (!qrCode || (victimId && qrCode.victimId !== victimId)) {
      return res.status(404).json({
        error: 'QR code not found'
      });
    }

    res.json({
      qrCode
    });
  } catch (error) {
    logger.error('Error fetching QR code:', error);
    res.status(500).json({
      error: 'Failed to fetch QR code',
      message: error.message
    });
  }
});

/**
 * PUT /api/merchant/qr-codes/:id
 * Update QR code
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, name, description } = req.body;
    const victimId = req.body.victim_id || req.query.victim_id;

    const updateData = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const existing = await prisma.qrCode.findUnique({ where: { id } });
    if (!existing || (victimId && existing.victimId !== victimId)) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    await prisma.qrCode.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'QR code updated successfully'
    });
  } catch (error) {
    logger.error('Error updating QR code:', error);
    res.status(500).json({
      error: 'Failed to update QR code',
      message: error.message
    });
  }
});

/**
 * DELETE /api/merchant/qr-codes/:id
 * Delete QR code
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const victimId = req.body.victim_id || req.query.victim_id;

    const existing = await prisma.qrCode.findUnique({ where: { id } });
    if (!existing || (victimId && existing.victimId !== victimId)) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    await prisma.qrTransaction.deleteMany({ where: { qrCodeId: id } });
    await prisma.qrCode.delete({ where: { id } });

    res.json({
      success: true,
      message: 'QR code deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting QR code:', error);
    res.status(500).json({
      error: 'Failed to delete QR code',
      message: error.message
    });
  }
});

/**
 * GET /api/merchant/qr-codes/:id/transactions
 * Get transactions for a specific QR code
 */
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const victimId = req.query.victim_id;

    const qrCode = await prisma.qrCode.findUnique({ where: { id } });
    if (!qrCode || (victimId && qrCode.victimId !== victimId)) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const where = { qrCodeId: id };
    if (victimId) where.victimId = victimId;

    const [transactions, total] = await Promise.all([
      prisma.qrTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.qrTransaction.count({ where }),
    ]);

    res.json({
      transactions,
      total
    });
  } catch (error) {
    logger.error('Error fetching QR code transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch QR code transactions',
      message: error.message
    });
  }
});

module.exports = router;
