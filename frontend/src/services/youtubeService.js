import { apiService } from './api.service';

class YouTubeService {
    async handleOAuthCallback(code, userId) {
        console.log('\n=== Starting YouTube OAuth Callback ===');
        console.log('Authorization code:', code?.substring(0, 10) + '...');
        console.log('User ID:', userId);
        console.log('API URL:', import.meta.env.VITE_API_URL);

        try {
            const response = await apiService.request('/youtube/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, userId })
            });

            console.log('OAuth callback response:', {
                success: true,
                data: response
            });
            console.log('=== YouTube OAuth Callback Complete ===\n');

            return response;
        } catch (error) {
            console.error('\n=== YouTube OAuth Callback Failed ===');
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                code: code?.substring(0, 10) + '...',
                userId
            });
            throw error;
        }
    }

    async getUserChannels(userId) {
        console.log('\n=== Fetching YouTube Channels ===');
        console.log('User ID:', userId);
        
        try {
            const response = await apiService.request(`/youtube/channels/${userId}`);
            console.log('Channels response:', {
                count: response?.length,
                channels: response?.map(ch => ({
                    id: ch.id,
                    channelName: ch.channel_name,
                    subscriberCount: ch.subscriber_count,
                    videoCount: ch.video_count
                }))
            });
            console.log('=== Fetch Channels Complete ===\n');
            return response;
        } catch (error) {
            console.error('\n=== Fetch Channels Failed ===');
            console.error('Error details:', {
                message: error.message,
                userId
            });
            throw error;
        }
    }

    async getChannelStatistics(channelId, userId) {
        console.log('\n=== Fetching Channel Statistics ===');
        console.log('Channel ID:', channelId);
        console.log('User ID:', userId);

        try {
            const response = await apiService.request(`/youtube/channels/${channelId}/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: { userId }
            });

            console.log('Statistics response:', {
                channelId: response.channelId,
                subscriberCount: response.subscriberCount,
                videoCount: response.videoCount,
                viewCount: response.viewCount,
                lastUpdated: response.lastUpdated
            });

            return response;
        } catch (error) {
            console.error('\n=== Fetch Statistics Failed ===');
            console.error('Error details:', {
                message: error.message,
                channelId,
                userId
            });
            throw error;
        }
    }

    async updateChannelStats(channelId, userId) {
        console.log('\n=== Updating Channel Statistics ===');
        try {
            // Force a fresh fetch of statistics by clearing cache first
            await apiService.request(`/youtube/channels/${channelId}/stats/cache`, {
                method: 'DELETE',
                body: JSON.stringify({ userId })
            });

            // Get fresh statistics
            return this.getChannelStatistics(channelId, userId);
        } catch (error) {
            console.error('\n=== Update Statistics Failed ===');
            console.error('Error details:', {
                message: error.message,
                channelId,
                userId
            });
            throw error;
        }
    }

    async disconnectChannel(channelId, userId) {
        return apiService.request(`/youtube/channels/${channelId}`, {
            method: 'DELETE',
            body: JSON.stringify({ userId })
        });
    }

    async getAuthUrl() {
        console.log('\n=== Fetching YouTube Auth URL ===');
        try {
            const response = await apiService.request('/youtube/auth-url');
            console.log('Received auth URL from backend');
            console.log('=== Auth URL Fetch Complete ===\n');
            return response.authUrl;
        } catch (error) {
            console.error('\n=== Auth URL Fetch Failed ===');
            console.error('Error details:', {
                message: error.message
            });
            throw error;
        }
    }
}

export const youtubeService = new YouTubeService(); 