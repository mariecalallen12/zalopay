// Route aggregator - Main entry point for all routes
const express = require('express');
const router = express.Router();

// Health check routes
const healthRoutes = require('./health');

// API routes
const apiRoutes = require('./api');

// Upload routes
const uploadRoutes = require('./uploads');

// Mount routes
router.use('/health', healthRoutes);
router.use('/api', apiRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;

