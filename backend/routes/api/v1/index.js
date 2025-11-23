// DogeRat API v1 routes aggregator
const express = require('express');
const router = express.Router();

const devicesRoutes = require('./devices');
const actionsRoutes = require('./actions');
const screenControlRoutes = require('./screenControl');

router.use('/devices', devicesRoutes);
router.use('/', actionsRoutes);
router.use('/devices', screenControlRoutes);

module.exports = router;

