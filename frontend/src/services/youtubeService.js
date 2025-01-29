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

    async updateChannelStats(channelId, userId) {
        return apiService.request(`/youtube/channels/${channelId}/stats`, {
            method: 'PUT',
            body: JSON.stringify({ userId })
        });
    }

    async disconnectChannel(channelId, userId) {
        return apiService.request(`/youtube/channels/${channelId}`, {
            method: 'DELETE',
            body: JSON.stringify({ userId })
        });
    }

    getAuthUrl() {
        console.log('\n=== Generating YouTube Auth URL ===');
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/youtube/callback`;
        
        const params = {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/youtube.readonly',
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
            state: 'youtube_auth'
        };

        console.log('OAuth parameters:', {
            clientId: clientId?.substring(0, 10) + '...',
            redirectUri,
            scope: params.scope
        });

        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryString}`;
        console.log('Generated auth URL:', authUrl);
        console.log('=== Auth URL Generation Complete ===\n');

        return authUrl;
    }
}

export const youtubeService = new YouTubeService(); 