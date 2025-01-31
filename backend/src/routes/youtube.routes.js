import { Router } from 'express';
import * as youtubeController from '../controllers/youtube.controller.js';

const router = Router();

// OAuth callback
router.post('/callback', youtubeController.handleOAuthCallback);

// Get user's YouTube channels
router.get('/channels/:userId', youtubeController.getUserChannels);

// Update channel statistics
router.put('/channels/:channelId/stats', youtubeController.updateChannelStats);

// Disconnect channel
router.delete('/channels/:channelId', youtubeController.disconnectChannel);

export default router; 