// API routes aggregator
const express = require('express');
const router = express.Router();

// Capture routes (OAuth capture)
const captureRoutes = require('./capture');

// Merchant routes
const merchantRoutes = require('./merchant');

// Admin routes
const adminRoutes = require('./admin');

// DogeRat API v1 routes
const v1Routes = require('./v1');

// Mount API routes
router.use('/capture', captureRoutes);
router.use('/merchant', merchantRoutes);
router.use('/admin', adminRoutes);
router.use('/v1', v1Routes);

module.exports = router;

