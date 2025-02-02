import { supabase } from '../config/supabase.js';
import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';

const apiBase = 'https://www.googleapis.com/youtube/v3';
const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

logger.info('YouTube Service initialized with:', {
    apiBase,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret
});

// Cache keys and TTLs
const CACHE_KEYS = {
    CHANNEL_STATS: (channelId) => `youtube:stats:${channelId}`,
    CHANNEL_INFO: (channelId) => `youtube:info:${channelId}`,
    USER_CHANNELS: (userId) => `youtube:user:${userId}:channels`
};

const CACHE_TTL = {
    STATS: 3600,        // 1 hour
    CHANNEL_INFO: 7200, // 2 hours
    USER_LIST: 1800     // 30 minutes
};

export function generateAuthUrl() {
    console.log('\n=== Generating YouTube Auth URL ===');
    const redirectUri = `${process.env.FRONTEND_URL}/auth/youtube/callback`;
    
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

export async function exchangeCodeForTokens(code, redirectUri) {
  console.log('\n=== Starting Token Exchange ===');
  console.log('Code length:', code?.length);
  console.log('Redirect URI:', redirectUri);
  console.log('Client ID:', clientId?.substring(0, 10) + '...');
  
  try {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    console.log('Making token request to:', tokenUrl);
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Token exchange error:', data);
      throw new Error(data.error_description || 'Failed to exchange code for tokens');
    }

    console.log('Token exchange successful:', {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in
    });
    console.log('=== Token Exchange Complete ===\n');

    return data;
  } catch (error) {
    console.error('Token exchange failed:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return response.json();
}

export async function getUserChannel(accessToken) {
  console.log('\n=== Fetching YouTube Channel Data ===');
  console.log('Using access token:', accessToken.substring(0, 10) + '...');
  
  const response = await fetch(
    `${apiBase}/channels?part=id,snippet,statistics,brandingSettings&mine=true`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('Channel fetch error:', data);
    throw new Error(data.error?.message || 'Failed to fetch user channel');
  }

  if (!data.items || data.items.length === 0) {
    console.error('No channel found in response:', data);
    throw new Error('No channel found for this user');
  }

  const channelData = data.items[0];

  // If the channel has a custom branding image, try to get it
  let bestThumbnailUrl = null;
  
  // Try to get the high-quality channel branding image first
  if (channelData.brandingSettings?.image?.bannerExternalUrl) {
    bestThumbnailUrl = `${channelData.brandingSettings.image.bannerExternalUrl}=s240-c-k-c0x00ffffff-no-rj`;
  }
  
  // Fallback to profile pictures in descending quality
  if (!bestThumbnailUrl) {
    const thumbnails = channelData.snippet?.thumbnails || {};
    bestThumbnailUrl = thumbnails.high?.url || 
                      thumbnails.medium?.url || 
                      thumbnails.default?.url;
  }

  // Add the best thumbnail URL to the channel data
  channelData.bestThumbnailUrl = bestThumbnailUrl;

  console.log('Channel data received:', {
    id: channelData.id,
    title: channelData.snippet?.title,
    description: channelData.snippet?.description?.substring(0, 100) + '...',
    customUrl: channelData.snippet?.customUrl,
    hasBrandingImage: !!channelData.brandingSettings?.image?.bannerExternalUrl,
    thumbnails: Object.keys(channelData.snippet?.thumbnails || {}),
    bestThumbnailUrl: bestThumbnailUrl,
    statistics: {
      subscriberCount: channelData.statistics?.subscriberCount,
      videoCount: channelData.statistics?.videoCount,
      viewCount: channelData.statistics?.viewCount
    }
  });
  console.log('=== Channel Data Fetch Complete ===\n');

  return channelData;
}

export async function saveChannelToDatabase(channelData, userId, tokens) {
  try {
    console.log('\n=== Starting Database Save ===');
    console.log('User ID:', userId);
    console.log('Channel Data:', {
      id: channelData.id,
      title: channelData.snippet?.title,
      customUrl: channelData.snippet?.customUrl,
      thumbnails: Object.keys(channelData.snippet?.thumbnails || {}),
      bestThumbnailUrl: channelData.bestThumbnailUrl,
      statistics: channelData.statistics
    });
    console.log('Tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in
    });

    // Check if channel already exists
    const { data: existingChannel, error: fetchError } = await supabase
      .from('youtube_accounts')
      .select('*')
      .eq('channel_id', channelData.id)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing channel:', fetchError);
      throw fetchError;
    }

    const channelInfo = {
      user_id: userId,
      channel_id: channelData.id,
      channel_name: channelData.snippet.title,
      thumbnail_url: channelData.bestThumbnailUrl,
      subscriber_count: parseInt(channelData.statistics?.subscriberCount) || 0,
      video_count: parseInt(channelData.statistics?.videoCount) || 0,
      view_count: parseInt(channelData.statistics?.viewCount) || 0,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Prepared channel info for database:', {
      ...channelInfo,
      access_token: channelInfo.access_token.substring(0, 10) + '...',
      refresh_token: channelInfo.refresh_token.substring(0, 10) + '...'
    });

    let result;
    if (existingChannel) {
      console.log('Updating existing channel:', existingChannel.id);
      const { data, error } = await supabase
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
      console.log('Creating new channel entry');
      const { data, error } = await supabase
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

    console.log('Database operation result:', {
      id: result.id,
      channelId: result.channel_id,
      userId: result.user_id,
      operation: existingChannel ? 'update' : 'insert'
    });
    console.log('=== Database Save Complete ===\n');

    return result;
  } catch (error) {
    console.error('\n=== Database Save Failed ===');
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

export async function getChannelStatistics(channelId, userId) {
    try {
        // Get channel data directly from database
        const { data: channel, error } = await supabase
            .from('youtube_accounts')
            .select('subscriber_count, video_count, view_count, updated_at')
            .eq('channel_id', channelId)
            .single();

        if (error) {
            logger.error('Error fetching channel statistics:', error);
            throw error;
        }

        if (!channel) {
            throw new Error('Channel not found');
        }

        return {
            subscriberCount: channel.subscriber_count,
            viewCount: channel.view_count,
            videoCount: channel.video_count,
            lastUpdated: channel.updated_at
        };
    } catch (error) {
        logger.error('Error getting channel statistics:', error);
        throw error;
    }
}

export async function updateChannelStatistics(channelId, userId) {
    try {
        // Get the channel from database
        const { data: channel, error: fetchError } = await supabase
            .from('youtube_accounts')
            .select('refresh_token')
            .eq('channel_id', channelId)
            .single();

        if (fetchError || !channel) {
            throw new Error('Channel not found');
        }

        // Get fresh data from YouTube API
        const accessToken = await getValidAccessToken(channel.refresh_token);
        const youtubeData = await getUserChannel(accessToken);

        // Update database with new statistics
        const { data: updatedChannel, error: updateError } = await supabase
            .from('youtube_accounts')
            .update({
                subscriber_count: parseInt(youtubeData.statistics?.subscriberCount) || 0,
                video_count: parseInt(youtubeData.statistics?.videoCount) || 0,
                view_count: parseInt(youtubeData.statistics?.viewCount) || 0,
                updated_at: new Date().toISOString()
            })
            .eq('channel_id', channelId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return {
            subscriberCount: updatedChannel.subscriber_count,
            viewCount: updatedChannel.view_count,
            videoCount: updatedChannel.video_count,
            lastUpdated: updatedChannel.updated_at
        };
    } catch (error) {
        logger.error('Error updating channel statistics:', error);
        throw error;
    }
}

export async function getUserChannels(userId) {
    try {
        const { data: channels, error } = await supabase
            .from('youtube_accounts')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            logger.error('Error fetching user channels:', error);
            throw error;
        }

        return channels;
    } catch (error) {
        logger.error('Error getting user channels:', error);
        throw error;
    }
}

// Add a function to manually clear cache for a channel
export function clearChannelStatisticsCache(channelId, userId) {
  const cacheKey = `stats:${channelId}:${userId}`;
  cacheService.delete(cacheKey);
  console.log('Cleared statistics cache for channel:', channelId);
}