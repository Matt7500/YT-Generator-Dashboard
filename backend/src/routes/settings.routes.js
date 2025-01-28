const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const pool = require('../config/database');
const { google } = require('googleapis');

const router = express.Router();

// Protect all routes in this router
router.use(verifyToken);

// Get user settings
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                email,
                settings
            FROM users
            WHERE id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        const settings = user.settings || {};
        
        res.json({
            email: user.email,
            theme: settings.theme || 'light',
            email_notifications: settings.email_notifications || false,
            two_factor_enabled: settings.two_factor_enabled || false
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// Update user settings
router.patch('/', async (req, res) => {
    try {
        const updates = {};
        for (const [key, value] of Object.entries(req.body)) {
            updates[key] = value;
        }

        const result = await pool.query(
            `UPDATE users 
             SET settings = settings || $1::jsonb 
             WHERE id = $2
             RETURNING email, settings`,
            [JSON.stringify(updates), req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        const settings = user.settings || {};
        
        res.json({
            email: user.email,
            theme: settings.theme || 'light',
            email_notifications: settings.email_notifications || false,
            two_factor_enabled: settings.two_factor_enabled || false
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// Get platform connections
router.get('/platforms', async (req, res) => {
    try {
        console.log('Fetching platforms for user:', req.user.userId);
        
        const result = await pool.query(
            `SELECT youtube
             FROM users
             WHERE id = $1`,
            [req.user.userId]
        );

        if (!result.rows.length) {
            console.log('No user found with ID:', req.user.userId);
            return res.status(404).json({ message: 'User not found' });
        }

        const platforms = [];
        const user = result.rows[0];
        
        console.log('Raw user YouTube data:', JSON.stringify(user?.youtube, null, 2));

        if (user?.youtube?.channels && Array.isArray(user.youtube.channels)) {
            // Filter out null entries and get valid channels
            const validChannels = user.youtube.channels.filter(channel => 
                channel && typeof channel === 'object' && channel.id
            );

            console.log('Found YouTube channels:', {
                total: user.youtube.channels.length,
                valid: validChannels.length,
                channelIds: validChannels.map(c => c.id)
            });
            
            if (validChannels.length > 0) {
                platforms.push({
                    platform: 'youtube',
                    connected: true,
                    channels: validChannels.map(channel => ({
                        id: channel.id,
                        title: channel.title,
                        description: channel.description,
                        thumbnailUrl: channel.thumbnailUrl,
                        customUrl: channel.customUrl,
                        statistics: channel.statistics
                    }))
                });
            } else {
                platforms.push({
                    platform: 'youtube',
                    connected: false,
                    channels: []
                });
            }
        } else {
            console.log('No YouTube channels found for user');
            platforms.push({
                platform: 'youtube',
                connected: false,
                channels: []
            });
        }

        console.log('Returning platforms:', JSON.stringify(platforms, null, 2));
        res.json(platforms);
    } catch (error) {
        console.error('Error fetching platform connections:', error);
        res.status(500).json({ 
            message: 'Error fetching platform connections',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Save YouTube channels
router.post('/youtube/channels', async (req, res) => {
    try {
        const { channelIds } = req.body;
        const result = await pool.query(
            'SELECT youtube FROM users WHERE id = $1',
            [req.user.userId]
        );

        const user = result.rows[0];
        if (!user?.youtube?.accessToken) {
            return res.status(400).json({ message: 'YouTube account not connected' });
        }

        // Create YouTube API client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: user.youtube.accessToken,
            refresh_token: user.youtube.refreshToken
        });

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });

        // Get full channel details for selected channels
        const response = await youtube.channels.list({
            part: 'snippet,contentDetails,statistics',
            id: channelIds.join(',')
        });

        const channels = response.data.items.map(channel => ({
            id: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description,
            thumbnailUrl: channel.snippet.thumbnails.default.url,
            statistics: channel.statistics,
            uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
        }));

        // Clean up existing channels - remove any null values and add new channels
        const existingChannels = user.youtube.channels || [];
        const validExistingChannels = existingChannels.filter(channel => 
            channel && typeof channel === 'object' && channel.id
        );
        
        // Combine existing and new channels, ensuring no duplicates
        const updatedChannels = [
            ...validExistingChannels.filter(channel => !channelIds.includes(channel.id)),
            ...channels
        ];

        // Update user with cleaned up channels array
        await pool.query(
            `UPDATE users 
             SET youtube = jsonb_set(
                COALESCE(youtube::jsonb, '{}'::jsonb),
                '{channels}',
                $1::jsonb
             )
             WHERE id = $2`,
            [JSON.stringify(updatedChannels), req.user.userId]
        );

        res.json({ message: 'Channels saved successfully' });
    } catch (error) {
        console.error('Error saving YouTube channels:', error);
        res.status(500).json({ message: 'Error saving YouTube channels' });
    }
});

// Remove a single YouTube channel
router.delete('/youtube/channels/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        console.log('Removing channel:', channelId);

        // Get current YouTube data
        const result = await pool.query(
            'SELECT youtube FROM users WHERE id = $1',
            [req.user.userId]
        );

        const user = result.rows[0];
        if (!user?.youtube?.channels) {
            return res.status(404).json({ message: 'No YouTube channels found' });
        }

        // Filter out the channel to remove and any null entries
        const updatedChannels = user.youtube.channels
            .filter(channel => 
                channel && 
                typeof channel === 'object' && 
                channel.id && 
                channel.id !== channelId
            );

        console.log('Updating channels:', {
            before: user.youtube.channels.length,
            after: updatedChannels.length
        });

        // Update the channels array
        await pool.query(
            `UPDATE users 
             SET youtube = jsonb_set(
                COALESCE(youtube::jsonb, '{}'::jsonb),
                '{channels}',
                $1::jsonb
             )
             WHERE id = $2`,
            [JSON.stringify(updatedChannels), req.user.userId]
        );

        res.json({ 
            message: 'Channel removed successfully',
            channelId
        });
    } catch (error) {
        console.error('Error removing YouTube channel:', error);
        res.status(500).json({ 
            message: 'Error removing YouTube channel',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Disconnect YouTube account
router.delete('/platforms/youtube', async (req, res) => {
    try {
        // Get the user's YouTube data first
        const result = await pool.query(
            'SELECT youtube FROM users WHERE id = $1',
            [req.user.userId]
        );

        const user = result.rows[0];
        if (user?.youtube?.channels) {
            // Create OAuth2 client
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );

            // Revoke tokens for each channel
            for (const channel of user.youtube.channels) {
                if (channel.accessToken) {
                    try {
                        await oauth2Client.revokeToken(channel.accessToken);
                    } catch (revokeError) {
                        console.warn(`Error revoking access token for channel ${channel.id}:`, revokeError);
                    }
                }
                if (channel.refreshToken) {
                    try {
                        await oauth2Client.revokeToken(channel.refreshToken);
                    } catch (revokeError) {
                        console.warn(`Error revoking refresh token for channel ${channel.id}:`, revokeError);
                    }
                }
            }
        }

        // Remove all YouTube data
        await pool.query(
            'UPDATE users SET youtube = NULL WHERE id = $1',
            [req.user.userId]
        );
        
        res.json({ message: 'YouTube account disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting YouTube account:', error);
        res.status(500).json({ message: 'Error disconnecting YouTube account' });
    }
});

// Get analytics data for selected channels
router.get('/youtube/analytics', verifyToken, async (req, res) => {
    try {
        console.log('Analytics request received:', {
            timeframe: req.query.timeframe,
            channelIds: req.query.channelIds
        });
        
        const { channelIds, timeframe } = req.query;
        const requestedChannels = channelIds ? channelIds.split(',') : [];
        
        // Get the user's YouTube data
        const result = await pool.query(
            'SELECT youtube FROM users WHERE id = $1',
            [req.user.userId]
        );

        const user = result.rows[0];
        if (!user?.youtube?.channels) {
            console.log('No YouTube channels found for user:', req.user.userId);
            return res.status(404).json({ message: 'No YouTube channels found' });
        }

        // Check for refresh token at root level
        if (!user.youtube.refreshToken) {
            console.error('No refresh token found in YouTube account');
            return res.status(401).json({ message: 'YouTube account not properly connected. Please reconnect your account.' });
        }

        // Filter out null entries and get valid channels
        const validChannels = user.youtube.channels.filter(channel => 
            channel && typeof channel === 'object' && channel.id
        );

        if (validChannels.length === 0) {
            return res.status(404).json({ message: 'No valid YouTube channels found' });
        }

        console.log('Found valid channels:', validChannels.length);

        // Create YouTube API client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        // Get the date range based on timeframe
        const endDate = new Date();
        const startDate = new Date();
        switch (timeframe) {
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
            case '365d':
                startDate.setDate(startDate.getDate() - 365);
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }

        // Format dates for YouTube API
        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];

        console.log('Date range:', { startDateString, endDateString });

        // Parse and handle the refresh token
        let refreshToken = user.youtube.refreshToken;
        if (typeof refreshToken === 'string' && refreshToken.startsWith('"') && refreshToken.endsWith('"')) {
            try {
                refreshToken = JSON.parse(refreshToken);
            } catch (err) {
                console.error('Error parsing refresh token:', err);
                refreshToken = refreshToken.slice(1, -1);
            }
        }

        // Refresh the access token once for all requests
        console.log('Refreshing access token...');
        const { tokens } = await oauth2Client.refreshToken(refreshToken);
        
        // Update the tokens in the database
        await pool.query(
            `UPDATE users 
             SET youtube = jsonb_set(
                jsonb_set(youtube::jsonb, '{accessToken}', $1::jsonb),
                '{refreshToken}',
                $2::jsonb
             )
             WHERE id = $3`,
            [JSON.stringify(tokens.access_token), JSON.stringify(tokens.refresh_token), req.user.userId]
        );

        // Set the credentials with the new tokens
        oauth2Client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token
        });

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });

        const youtubeAnalytics = google.youtubeAnalytics({
            version: 'v2',
            auth: oauth2Client
        });

        // Get analytics for each channel using the same oauth client
        const analyticsPromises = validChannels
            .filter(channel => requestedChannels.length === 0 || requestedChannels.includes(channel.id))
            .map(async channel => {
                console.log('Processing channel:', {
                    id: channel.id
                });

                try {
                    // Get analytics data
                    const analyticsResponse = await youtubeAnalytics.reports.query({
                        ids: `channel==${channel.id}`,
                        startDate: startDateString,
                        endDate: endDateString,
                        metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,estimatedRevenue',
                        dimensions: 'day',
                        sort: 'day'
                    });

                    console.log('Successfully fetched analytics for channel:', channel.id);
                    return {
                        channelId: channel.id,
                        channelTitle: channel.title,
                        data: analyticsResponse.data
                    };
                } catch (err) {
                    console.error('Error fetching analytics for channel:', channel.id, err);
                    throw err;
                }
            });

        console.log('Waiting for all analytics promises to resolve...');
        const analyticsResults = await Promise.all(analyticsPromises);
        console.log('All analytics fetched successfully');

        // Aggregate data across all channels
        const aggregatedData = {
            views: {
                total: 0,
                timeline: {}
            },
            watchTime: {
                total: 0,
                timeline: {}
            },
            subscribers: {
                gained: 0,
                lost: 0,
                timeline: {}
            },
            revenue: {
                total: 0,
                timeline: {}
            }
        };

        analyticsResults.forEach(channelData => {
            if (!channelData.data.rows) return;
            
            channelData.data.rows.forEach(row => {
                const [date, views, watchMinutes, avgDuration, subsGained, subsLost, revenue] = row;
                
                // Aggregate views
                aggregatedData.views.total += views;
                aggregatedData.views.timeline[date] = (aggregatedData.views.timeline[date] || 0) + views;

                // Aggregate watch time
                aggregatedData.watchTime.total += watchMinutes;
                aggregatedData.watchTime.timeline[date] = (aggregatedData.watchTime.timeline[date] || 0) + watchMinutes;

                // Aggregate subscribers
                aggregatedData.subscribers.gained += subsGained;
                aggregatedData.subscribers.lost += subsLost;
                aggregatedData.subscribers.timeline[date] = {
                    gained: (aggregatedData.subscribers.timeline[date]?.gained || 0) + subsGained,
                    lost: (aggregatedData.subscribers.timeline[date]?.lost || 0) + subsLost
                };

                // Aggregate revenue
                aggregatedData.revenue.total += revenue;
                aggregatedData.revenue.timeline[date] = (aggregatedData.revenue.timeline[date] || 0) + revenue;
            });
        });

        res.json({
            timeframe,
            channels: analyticsResults.map(r => ({
                id: r.channelId,
                title: r.channelTitle
            })),
            aggregated: aggregatedData
        });
    } catch (error) {
        console.error('Error fetching YouTube analytics:', error);
        if (error.response) {
            console.error('API Response Error:', {
                status: error.response.status,
                data: error.response.data
            });
        }
        res.status(500).json({ 
            message: 'Error fetching YouTube analytics',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 