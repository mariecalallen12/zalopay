// Route aggregator - Main entry point for all routes
const express = require('express');
const router = express.Router();

// Health check routes
const healthRoutes = require('./health');

// API routes
const apiRoutes = require('./api');

// Auth routes (OAuth)
const authRoutes = require('./api/auth/google');

// Upload routes
const uploadRoutes = require('./uploads');

// Mount routes
router.use('/health', healthRoutes);
router.use('/api', apiRoutes);
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;

