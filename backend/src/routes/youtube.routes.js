import { Router } from 'express';
import * as youtubeController from '../controllers/youtube.controller.js';
import express from 'express';
import { updateChannelStatistics, updateAllChannelStatistics } from '../services/youtube.statistics.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get auth URL
router.get('/auth-url', youtubeController.getAuthUrl);

// OAuth callback
router.post('/callback', youtubeController.handleOAuthCallback);

// Get user's YouTube channels
router.get('/channels/:userId', youtubeController.getUserChannels);

// Get channel statistics (cached)
router.get('/channels/:channelId/stats', youtubeController.getChannelStats);

// Clear channel statistics cache
router.delete('/channels/:channelId/stats/cache', youtubeController.clearChannelStats);

// Disconnect channel
router.delete('/channels/:channelId', youtubeController.disconnectChannel);

// Update statistics for all channels
router.post('/channels/statistics', async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Missing required parameter: userId'
            });
        }

        const results = await updateAllChannelStatistics(userId);
        res.json(results);
    } catch (error) {
        logger.error('Error updating all channel statistics:', {
            error: error.message,
            userId: req.query.userId
        });
        res.status(500).json({
            error: 'Failed to update channel statistics',
            details: error.message
        });
    }
});

// Update statistics for a specific channel
router.post('/channels/:channelId/statistics', async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Missing required parameter: userId'
            });
        }

        const statistics = await updateChannelStatistics(channelId, userId);
        res.json(statistics);
    } catch (error) {
        logger.error('Error updating channel statistics:', {
            error: error.message,
            channelId: req.params.channelId,
            userId: req.query.userId
        });
        res.status(500).json({
            error: 'Failed to update channel statistics',
            details: error.message
        });
    }
});

export default router; 