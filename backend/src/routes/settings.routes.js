const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settings.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Protect all settings routes
router.use(verifyToken);

// Get user settings
router.get('/', SettingsController.getSettings);

// Update user settings
router.patch('/', SettingsController.updateSettings);

// Get platform connections (for future YouTube integration)
router.get('/platforms', SettingsController.getPlatformConnections);

module.exports = router; 