const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtube.controller');

// OAuth callback
router.post('/callback', youtubeController.handleOAuthCallback);

// Get user's YouTube channels
router.get('/channels/:userId', youtubeController.getUserChannels);

// Update channel statistics
router.put('/channels/:channelId/stats', youtubeController.updateChannelStats);

// Disconnect channel
router.delete('/channels/:channelId', youtubeController.disconnectChannel);

module.exports = router; 