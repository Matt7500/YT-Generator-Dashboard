import { google } from 'googleapis';
import supabase from '../../utils/supabase';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { channelId } = req.query;
    if (!channelId) {
        return res.status(400).json({ error: 'Channel ID is required' });
    }

    try {
        // Get the channel's access token from Supabase
        const { data: channel, error } = await supabase
            .from('youtube_accounts')
            .select('access_token, refresh_token')
            .eq('channel_id', channelId)
            .single();

        if (error) throw error;

        // Initialize the YouTube API client
        const youtube = google.youtube('v3');
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: channel.access_token,
            refresh_token: channel.refresh_token
        });

        // Fetch channel statistics
        const response = await youtube.channels.list({
            auth: oauth2Client,
            part: 'statistics',
            id: channelId
        });

        const stats = response.data.items[0].statistics;

        res.status(200).json({
            subscriberCount: parseInt(stats.subscriberCount),
            viewCount: parseInt(stats.viewCount),
            videoCount: parseInt(stats.videoCount)
        });
    } catch (error) {
        console.error('Error fetching channel stats:', error);
        res.status(500).json({ error: 'Failed to fetch channel statistics' });
    }
} 