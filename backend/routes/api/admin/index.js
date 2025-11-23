// Admin platform routes aggregator
const express = require('express');
const router = express.Router();

// Authentication middleware
const { authenticateAdmin } = require('../../../middleware/auth');

// Import route modules
const authRoutes = require('./auth');
const victimsRoutes = require('./victims');
const campaignsRoutes = require('./campaigns');
const gmailRoutes = require('./gmail');
const activityRoutes = require('./activity');
const dashboardRoutes = require('./dashboard');
const transactionsRoutes = require('./transactions');
const verificationsRoutes = require('./verifications');

// Auth routes - login and MFA don't require authentication
// But permissions and sessions do require auth
router.use('/auth', authRoutes);

// All other admin routes require authentication
router.use(authenticateAdmin);

// Mount protected routes
router.use('/victims', victimsRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/gmail', gmailRoutes);
router.use('/activity-logs', activityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/verifications', verificationsRoutes);

module.exports = router;

