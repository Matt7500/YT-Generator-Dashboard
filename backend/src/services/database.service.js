class DatabaseService {
    constructor() {
        console.log('Initializing DatabaseService with Supabase URL:', process.env.SUPABASE_URL);
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        console.log('DatabaseService initialized successfully');
    }

    async saveYouTubeChannel(channelData, userId, tokens) {
        try {
            console.log('=== Starting saveYouTubeChannel ===');
            console.log('Saving channel for user:', userId);
            console.log('Channel data to save:', {
                id: channelData.id,
                title: channelData.snippet?.title,
                description: channelData.snippet?.description?.substring(0, 50) + '...',
                statistics: channelData.statistics
            });

            // Check if channel already exists
            const { data: existingChannel, error: fetchError } = await this.supabase
                .from('youtube_accounts')
                .select('*')
                .eq('channel_id', channelData.id)
                .eq('user_id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error checking for existing channel:', fetchError);
                throw fetchError;
            }

            console.log('Existing channel check result:', {
                exists: !!existingChannel,
                channelId: existingChannel?.channel_id
            });

            const channelInfo = {
                user_id: userId,
                channel_id: channelData.id,
                title: channelData.snippet.title,
                description: channelData.snippet.description,
                custom_url: channelData.snippet.customUrl,
                thumbnail_url: channelData.snippet.thumbnails?.default?.url,
                subscriber_count: channelData.statistics.subscriberCount,
                video_count: channelData.statistics.videoCount,
                view_count: channelData.statistics.viewCount,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                last_updated: new Date().toISOString()
            };

            let result;
            if (existingChannel) {
                console.log('Updating existing channel record');
                const { data, error } = await this.supabase
                    .from('youtube_accounts')
                    .update(channelInfo)
                    .eq('channel_id', channelData.id)
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (error) {
                    console.error('Error updating channel:', error);
                    throw error;
                }
                result = data;
                console.log('Channel updated successfully');
            } else {
                console.log('Creating new channel record');
                const { data, error } = await this.supabase
                    .from('youtube_accounts')
                    .insert([channelInfo])
                    .select()
                    .single();

                if (error) {
                    console.error('Error inserting channel:', error);
                    throw error;
                }
                result = data;
                console.log('Channel created successfully');
            }

            console.log('Operation result:', {
                id: result.id,
                channelId: result.channel_id,
                userId: result.user_id,
                operation: existingChannel ? 'update' : 'insert'
            });

            console.log('=== saveYouTubeChannel Completed Successfully ===');
            return result;
        } catch (error) {
            console.error('=== saveYouTubeChannel Failed ===');
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                stack: error.stack
            });
            throw error;
        }
    }
} 