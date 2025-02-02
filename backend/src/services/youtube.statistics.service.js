import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

/**
 * @typedef {Object} ChannelStatistics
 * @property {number} subscriberCount - Number of subscribers
 * @property {number} videoCount - Number of videos
 * @property {number} viewCount - Total view count
 * @property {string} lastUpdated - ISO timestamp of last update
 */

/**
 * @typedef {Object} YouTubeChannel
 * @property {string} channel_id - YouTube channel ID
 * @property {string} access_token - OAuth access token
 * @property {string} refresh_token - OAuth refresh token
 * @property {string} token_expiry - ISO timestamp of token expiry
 */

// Constants for update frequencies
const UPDATE_THRESHOLDS = {
    VIEWS: 24 * 60 * 60 * 1000,       // 24 hours in milliseconds
    SUBSCRIBERS: 2 * 60 * 60 * 1000,   // 2 hours in milliseconds
    VIDEOS: 5 * 60 * 1000              // 5 minutes in milliseconds
};

/**
 * Determines if statistics need to be updated based on last update time
 * @param {Object} channel - Channel data from database
 * @returns {boolean} Whether statistics should be updated
 */
function shouldUpdateStatistics(channel) {
    const lastUpdate = new Date(channel.updated_at);
    const now = new Date();
    const timeSinceUpdate = now - lastUpdate;

    // Always update if no previous update time
    if (!channel.updated_at) return true;

    // Check each metric's update threshold
    const needsViewUpdate = timeSinceUpdate >= UPDATE_THRESHOLDS.VIEWS;
    const needsSubUpdate = timeSinceUpdate >= UPDATE_THRESHOLDS.SUBSCRIBERS;
    const needsVideoUpdate = timeSinceUpdate >= UPDATE_THRESHOLDS.VIDEOS;

    logger.debug('Update check:', {
        channelId: channel.channel_id,
        lastUpdate: channel.updated_at,
        timeSinceUpdate: Math.floor(timeSinceUpdate / 1000 / 60), // minutes
        needsViewUpdate,
        needsSubUpdate,
        needsVideoUpdate
    });

    // Update if any metric needs updating
    return needsViewUpdate || needsSubUpdate || needsVideoUpdate;
}

/**
 * Fetches fresh statistics from YouTube API for a channel
 * @param {string} accessToken - Valid OAuth access token
 * @returns {Promise<ChannelStatistics>}
 */
async function fetchYouTubeStatistics(accessToken) {
    const apiBase = 'https://www.googleapis.com/youtube/v3';
    
    try {
        const response = await fetch(
            `${apiBase}/channels?part=statistics&mine=true`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        if (!data.items?.[0]?.statistics) {
            throw new Error('No statistics found in YouTube response');
        }

        const stats = data.items[0].statistics;
        return {
            subscriberCount: parseInt(stats.subscriberCount) || 0,
            videoCount: parseInt(stats.videoCount) || 0,
            viewCount: parseInt(stats.viewCount) || 0,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        logger.error('Error fetching YouTube statistics:', {
            error: error.message,
            accessToken: `${accessToken.substring(0, 10)}...`
        });
        throw error;
    }
}

/**
 * Refreshes an expired OAuth token
 * @param {string} refreshToken - OAuth refresh token
 * @returns {Promise<{access_token: string, expires_in: number}>}
 */
async function refreshAccessToken(refreshToken) {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                refresh_token: refreshToken,
                client_id: process.env.YOUTUBE_CLIENT_ID,
                client_secret: process.env.YOUTUBE_CLIENT_SECRET,
                grant_type: 'refresh_token'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Token refresh failed: ${error.error_description || 'Unknown error'}`);
        }

        return response.json();
    } catch (error) {
        logger.error('Error refreshing access token:', {
            error: error.message,
            refreshToken: `${refreshToken.substring(0, 10)}...`
        });
        throw error;
    }
}

/**
 * Updates statistics for a YouTube channel
 * @param {string} channelId - YouTube channel ID
 * @param {string} userId - User ID
 * @returns {Promise<ChannelStatistics>}
 */
export async function updateChannelStatistics(channelId, userId) {
    try {
        // Get channel details from database
        const { data: channel, error } = await supabase
            .from('youtube_accounts')
            .select('*')
            .eq('user_id', userId)
            .eq('channel_id', channelId)
            .single();

        if (error) {
            logger.error('Database error fetching channel:', {
                error: error.message,
                channelId,
                userId
            });
            throw error;
        }

        if (!channel) {
            throw new Error(`No channel found with ID: ${channelId}`);
        }

        // Check if we need to update statistics
        if (!shouldUpdateStatistics(channel)) {
            logger.info('Using cached statistics', {
                channelId,
                lastUpdate: channel.updated_at
            });
            return {
                subscriberCount: channel.subscriber_count,
                videoCount: channel.video_count,
                viewCount: channel.view_count,
                lastUpdated: channel.updated_at
            };
        }

        // Check if token needs refresh
        let accessToken = channel.access_token;
        const tokenExpiry = new Date(channel.token_expiry);

        if (tokenExpiry <= new Date()) {
            logger.info('Refreshing expired token', {
                channelId,
                expiry: channel.token_expiry
            });

            const newTokens = await refreshAccessToken(channel.refresh_token);
            accessToken = newTokens.access_token;

            // Update tokens in database
            const { error: updateError } = await supabase
                .from('youtube_accounts')
                .update({
                    access_token: newTokens.access_token,
                    token_expiry: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
                })
                .eq('channel_id', channelId)
                .eq('user_id', userId);

            if (updateError) {
                logger.error('Error updating tokens:', {
                    error: updateError.message,
                    channelId,
                    userId
                });
                throw updateError;
            }
        }

        // Fetch fresh statistics from YouTube
        const statistics = await fetchYouTubeStatistics(accessToken);

        // Update statistics in database
        const { error: statsError } = await supabase
            .from('youtube_accounts')
            .update({
                subscriber_count: statistics.subscriberCount,
                video_count: statistics.videoCount,
                view_count: statistics.viewCount,
                updated_at: statistics.lastUpdated
            })
            .eq('channel_id', channelId)
            .eq('user_id', userId);

        if (statsError) {
            logger.error('Error updating statistics:', {
                error: statsError.message,
                channelId,
                userId
            });
            throw statsError;
        }

        return statistics;
    } catch (error) {
        logger.error('Error updating channel statistics:', {
            error: error.message,
            channelId,
            userId
        });
        throw error;
    }
}

/**
 * Updates statistics for all channels belonging to a user
 * @param {string} userId - User ID
 * @returns {Promise<Array<{channelId: string, statistics: ChannelStatistics}>>}
 */
export async function updateAllChannelStatistics(userId) {
    try {
        logger.info('Starting statistics update for user:', { userId });

        // First, let's check what's actually in the database
        const { data: allChannels, error: allError } = await supabase
            .from('youtube_accounts')
            .select('*');

        logger.info('All channels in database:', {
            totalCount: allChannels?.length || 0,
            channels: allChannels?.map(ch => ({
                channelId: ch.channel_id,
                userId: ch.user_id,
                userIdType: typeof ch.user_id,
                channelName: ch.channel_name
            }))
        });

        // Get all channels for user with detailed logging
        const { data: channels, error, count } = await supabase
            .from('youtube_accounts')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

        if (error) {
            logger.error('Error fetching user channels:', {
                error: error.message,
                code: error.code,
                details: error.details,
                userId,
                userIdType: typeof userId
            });
            throw error;
        }

        // Log the raw data for debugging
        logger.info('Raw database response:', {
            userId,
            userIdType: typeof userId,
            totalCount: count,
            rawData: channels,
            query: {
                table: 'youtube_accounts',
                filter: { user_id: userId }
            }
        });

        logger.info('Found channels in database:', {
            userId,
            channelCount: channels?.length || 0,
            channels: channels?.map(ch => ({
                channelId: ch.channel_id,
                channelName: ch.channel_name,
                lastUpdated: ch.updated_at,
                userId: ch.user_id,
                userIdMatch: ch.user_id === userId
            }))
        });

        if (!channels || channels.length === 0) {
            logger.info('No channels found for user:', { userId });
            return [];
        }

        // Update statistics for each channel
        const updates = await Promise.allSettled(
            channels.map(async (channel) => {
                try {
                    logger.info('Updating statistics for channel:', {
                        channelId: channel.channel_id,
                        channelName: channel.channel_name
                    });

                    const statistics = await updateChannelStatistics(channel.channel_id, userId);
                    return {
                        channelId: channel.channel_id,
                        statistics,
                        status: 'success'
                    };
                } catch (error) {
                    logger.error('Failed to update channel statistics:', {
                        channelId: channel.channel_id,
                        error: error.message
                    });
                    return {
                        channelId: channel.channel_id,
                        error: error.message,
                        status: 'error'
                    };
                }
            })
        );

        // Log results
        const results = updates.map(result => ({
            channelId: result.value?.channelId,
            status: result.value?.status || 'error',
            error: result.value?.error || result.reason?.message
        }));

        logger.info('Channel statistics update complete', {
            userId,
            results,
            successCount: results.filter(r => r.status === 'success').length,
            errorCount: results.filter(r => r.status === 'error').length
        });

        return updates
            .filter(result => result.status === 'fulfilled' && result.value.status === 'success')
            .map(result => result.value);
    } catch (error) {
        logger.error('Error updating all channel statistics:', {
            error: error.message,
            userId
        });
        throw error;
    }
} 