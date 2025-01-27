const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { loginLimiter, validatePassword, verifyToken } = require('../middleware/auth.middleware');
const { google } = require('googleapis');
const User = require('../models/user.model');
const pool = require('../config/database');

const router = express.Router();

// Temporary storage for pending YouTube data
const pendingYouTubeData = new Map();

// Auth routes
router.post('/register', validatePassword, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', AuthController.logout);

// Verify route - returns user info if authenticated
router.get('/verify', verifyToken, (req, res) => {
    res.json({ 
        authenticated: true,
        user: req.user
    });
});

// YouTube OAuth routes
router.get('/youtube/connect', verifyToken, async (req, res) => {
    try {
        // Log environment variables (without sensitive data)
        console.log('Checking OAuth configuration:', {
            hasClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_REDIRECT_URI
        });

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
            throw new Error('Missing required Google OAuth configuration');
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        // Generate a state parameter to link this request to the callback
        const state = Math.random().toString(36).substring(7);
        
        // Store the user ID with the state
        pendingYouTubeData.set(state, {
            userId: req.user.userId,
            timestamp: Date.now()
        });

        // Clean up old pending data (older than 5 minutes)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        for (const [key, value] of pendingYouTubeData.entries()) {
            if (value.timestamp < fiveMinutesAgo) {
                pendingYouTubeData.delete(key);
            }
        }

        const scopes = [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/yt-analytics.readonly',
            'https://www.googleapis.com/auth/yt-analytics-monetary.readonly'
        ];

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            include_granted_scopes: true,
            state: state
        });

        console.log('Generated Auth URL:', authUrl);
        res.json({ authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ 
            message: 'Failed to generate authorization URL',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/youtube/callback', async (req, res) => {
    try {
        console.log('Received callback with query:', req.query);
        const { code, state, error } = req.query;
        
        if (error) {
            console.error('OAuth error:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/settings?error=${encodeURIComponent(error)}`);
        }
        
        if (!code) {
            console.error('No code received in callback');
            return res.redirect(`${process.env.FRONTEND_URL}/settings?error=No authorization code received`);
        }

        if (!state || !pendingYouTubeData.has(state)) {
            console.error('Invalid or expired state parameter');
            return res.redirect(`${process.env.FRONTEND_URL}/settings?error=Invalid or expired authorization request`);
        }

        const { userId } = pendingYouTubeData.get(state);

        // Get existing YouTube data first
        const existingResult = await pool.query(
            'SELECT youtube FROM users WHERE id = $1',
            [userId]
        );
        const existingData = existingResult.rows[0]?.youtube || {};
        const existingChannels = existingData.channels || [];

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        console.log('Exchanging code for tokens...');
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Received tokens:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiryDate: tokens.expiry_date
        });
        
        oauth2Client.setCredentials(tokens);

        // Create YouTube API client
        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });

        console.log('Fetching channel list...');
        // Get the user's channels
        const response = await youtube.channels.list({
            part: 'snippet,contentDetails,statistics,brandingSettings',
            mine: true,
            maxResults: 50
        });

        if (!response.data.items || response.data.items.length === 0) {
            console.error('No channels found for this account');
            return res.redirect(`${process.env.FRONTEND_URL}/settings?error=No YouTube channels found for this account`);
        }

        console.log(`Found ${response.data.items.length} channels`);

        // Format channels data (without tokens)
        const newChannels = response.data.items.map(channel => ({
            id: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description,
            thumbnailUrl: channel.snippet.thumbnails.default.url,
            customUrl: channel.snippet.customUrl || channel.brandingSettings?.channel?.customUrl,
            statistics: channel.statistics
        }));

        // Merge new channels with existing ones, avoiding duplicates
        const existingChannelIds = new Set(existingChannels.map(c => c.id));
        const mergedChannels = [
            ...existingChannels.filter(channel => !newChannels.find(n => n.id === channel.id)),
            ...newChannels
        ];

        console.log('Channel counts:', {
            existing: existingChannels.length,
            new: newChannels.length,
            merged: mergedChannels.length
        });

        // Create the YouTube data object with tokens at root level
        const youtubeData = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiry: tokens.expiry_date,
            channels: mergedChannels
        };

        // Store the YouTube data in the database
        await pool.query(
            `UPDATE users 
             SET youtube = $1::jsonb
             WHERE id = $2`,
            [JSON.stringify(youtubeData), userId]
        );

        // Clean up the pending data
        pendingYouTubeData.delete(state);

        // Send success response with a script that calls postMessage
        const script = `
            <script>
                (function() {
                    const frontendUrl = '${process.env.FRONTEND_URL || 'http://localhost:5173'}';
                    console.log('Callback window: Starting with frontend URL:', frontendUrl);
                    
                    let messageAttempts = 0;
                    const maxAttempts = 5;
                    
                    function sendSuccessMessage() {
                        if (messageAttempts >= maxAttempts) {
                            console.log('Callback window: Max attempts reached, giving up');
                            return;
                        }
                        
                        messageAttempts++;
                        console.log('Callback window: Attempt ' + messageAttempts + ' to send success message');
                        
                        try {
                            if (window.opener) {
                                console.log('Callback window: Found opener window');
                                
                                // First try sending as string (legacy)
                                try {
                                    console.log('Callback window: Attempting to send legacy success message');
                                    window.opener.postMessage('success', '*');
                                } catch (err) {
                                    console.log('Callback window: Failed to send legacy message:', err);
                                }
                                
                                // Then try sending as object with explicit origin
                                try {
                                    console.log('Callback window: Attempting to send detailed success message');
                                    window.opener.postMessage({
                                        type: 'youtube_success',
                                        channelCount: ${mergedChannels.length},
                                        newChannels: ${newChannels.length},
                                        timestamp: Date.now()
                                    }, frontendUrl);
                                } catch (err) {
                                    console.log('Callback window: Failed to send detailed message:', err);
                                }
                            } else {
                                console.log('Callback window: No opener window found');
                                if (messageAttempts < maxAttempts) {
                                    setTimeout(sendSuccessMessage, 100);
                                }
                            }
                        } catch (err) {
                            console.error('Callback window: Error in sendSuccessMessage:', err);
                            if (messageAttempts < maxAttempts) {
                                setTimeout(sendSuccessMessage, 100);
                            }
                        }
                    }

                    // Start sending messages immediately
                    console.log('Callback window: Starting message sending process');
                    sendSuccessMessage();

                    // Also try when the document is fully loaded
                    document.addEventListener('DOMContentLoaded', () => {
                        console.log('Callback window: Document loaded, trying again');
                        sendSuccessMessage();
                    });

                    window.addEventListener('load', () => {
                        console.log('Callback window: Window loaded, trying again');
                        sendSuccessMessage();
                    });

                    // Close window after a delay to ensure messages are sent
                    setTimeout(() => {
                        console.log('Callback window: Preparing to close');
                        try {
                            window.close();
                        } catch (err) {
                            console.warn('Callback window: Could not close window:', err);
                        }
                        
                        // If window is still open, show a success message
                        setTimeout(() => {
                            if (!window.closed) {
                                console.log('Callback window: Still open, showing success message');
                                document.body.innerHTML = '<div style="text-align: center; padding: 20px;"><h3>Connection successful!</h3><p>You can close this window and return to the app.</p></div>';
                            }
                        }, 1000);
                    }, 2000);
                })();
            </script>
        `;
        res.send(script);
    } catch (error) {
        console.error('Error handling YouTube callback:', error);
        const errorMessage = error.message || 'Failed to connect YouTube account';
        res.redirect(`${process.env.FRONTEND_URL}/settings?error=${encodeURIComponent(errorMessage)}`);
    }
});

module.exports = router; 