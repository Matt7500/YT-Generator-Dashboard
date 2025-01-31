import * as youtubeService from '../services/youtube.service.js';
import { supabase } from '../config/supabase.js';

export async function handleOAuthCallback(req, res) {
    try {
        console.log('=== Starting OAuth Callback Handler ===');
        console.log('Request details:', { 
            query: req.query, 
            body: req.body,
            method: req.method,
            path: req.path,
            headers: {
                'content-type': req.headers['content-type'],
                'user-agent': req.headers['user-agent']
            }
        });

        // Check if code is in query or body
        const code = req.query.code || req.body.code;
        const { userId } = req.body;

        console.log('Extracted parameters:', {
            codeExists: !!code,
            codeLength: code?.length,
            userId
        });

        if (!code) {
            console.error('No authorization code received');
            return res.status(400).json({ error: 'No authorization code received' });
        }

        if (!userId) {
            console.error('No user ID provided');
            return res.status(400).json({ error: 'No user ID provided' });
        }

        // Exchange the code for tokens
        const redirectUri = `${process.env.FRONTEND_URL}/auth/youtube/callback`;
        console.log('Exchanging code for tokens with redirect URI:', redirectUri);
        
        const tokens = await youtubeService.exchangeCodeForTokens(code, redirectUri);
        console.log('Token exchange successful:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiresIn: tokens.expires_in
        });
        
        // Get the user's YouTube channel
        console.log('Fetching channel data...');
        const channelData = await youtubeService.getUserChannel(tokens.access_token);
        console.log('Channel data received:', {
            id: channelData.id,
            title: channelData.snippet?.title,
            subscriberCount: channelData.statistics?.subscriberCount,
            videoCount: channelData.statistics?.videoCount
        });
        
        // Save the channel to the database
        console.log('Saving channel to database...');
        const savedChannel = await youtubeService.saveChannelToDatabase(channelData, userId, tokens);
        console.log('Channel saved successfully:', {
            id: savedChannel.id,
            channelId: savedChannel.channel_id,
            userId: savedChannel.user_id
        });

        console.log('=== OAuth Callback Handler Completed Successfully ===');
        res.json({ 
            message: 'YouTube channel connected successfully',
            channel: savedChannel 
        });
    } catch (error) {
        console.error('=== OAuth Callback Handler Failed ===');
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to connect YouTube account',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

export async function updateChannelStats(req, res) {
    try {
        const { channelId } = req.params;
        const { userId } = req.body;

        const updatedStats = await youtubeService.updateChannelStatistics(channelId, userId);
        res.json(updatedStats);
    } catch (error) {
        console.error('Error updating channel statistics:', error);
        res.status(500).json({ 
            error: 'Failed to update channel statistics',
            details: error.message 
        });
    }
}

export async function disconnectChannel(req, res) {
    try {
        const { channelId } = req.params;
        const { userId } = req.body;

        await youtubeService.disconnectChannel(channelId, userId);
        res.json({ message: 'Channel disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting channel:', error);
        res.status(500).json({ 
            error: 'Failed to disconnect channel',
            details: error.message 
        });
    }
}

export async function getUserChannels(req, res) {
    try {
        console.log('\n=== Getting User YouTube Channels ===');
        const { userId } = req.params;
        console.log('User ID:', userId);

        const { data, error } = await supabase
            .from('youtube_accounts')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching channels:', error);
            throw error;
        }

        console.log('Found channels:', {
            count: data?.length,
            channels: data?.map(ch => ({
                id: ch.id,
                channelName: ch.channel_name,
                subscriberCount: ch.subscriber_count
            }))
        });

        res.json(data);
    } catch (error) {
        console.error('Error in getUserChannels:', error);
        res.status(500).json({ 
            error: 'Failed to fetch YouTube channels',
            details: error.message 
        });
    }
} 