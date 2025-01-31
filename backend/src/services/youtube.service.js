const supabase = require('../config/supabase');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class YouTubeService {
  constructor() {
    this.apiBase = 'https://www.googleapis.com/youtube/v3';
    this.clientId = process.env.YOUTUBE_CLIENT_ID;
    this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    console.log('YouTube Service initialized with:', {
      apiBase: this.apiBase,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret
    });
  }

  async exchangeCodeForTokens(code, redirectUri) {
    console.log('\n=== Starting Token Exchange ===');
    console.log('Code length:', code?.length);
    console.log('Redirect URI:', redirectUri);
    console.log('Client ID:', this.clientId?.substring(0, 10) + '...');
    
    try {
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const params = new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
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

  async refreshAccessToken(refreshToken) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    return response.json();
  }

  async getUserChannel(accessToken) {
    console.log('\n=== Fetching YouTube Channel Data ===');
    console.log('Using access token:', accessToken.substring(0, 10) + '...');
    
    const response = await fetch(
      `${this.apiBase}/channels?part=id,snippet,statistics,brandingSettings&mine=true`,
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

  async saveChannelToDatabase(channelData, userId, tokens) {
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
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      throw error;
    }
  }

  async updateChannelStatistics(channelId, userId) {
    try {
      // Get the stored tokens
      const { data: account, error: accountError } = await supabase
        .from('youtube_accounts')
        .select('*')
        .eq('channel_id', channelId)
        .eq('user_id', userId)
        .single();

      if (accountError) {
        console.error('Error fetching account:', accountError);
        throw accountError;
      }

      // Check if token needs refresh
      if (new Date(account.token_expiry) <= new Date()) {
        console.log('Token expired, refreshing...');
        const tokens = await this.refreshAccessToken(account.refresh_token);
        account.access_token = tokens.access_token;
        account.token_expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      }

      // Get fresh channel statistics
      console.log('Fetching fresh channel statistics...');
      const response = await fetch(
        `${this.apiBase}/channels?part=statistics&id=${channelId}`,
        {
          headers: {
            'Authorization': `Bearer ${account.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch channel statistics:', errorData);
        throw new Error('Failed to fetch channel statistics');
      }

      const data = await response.json();
      const stats = data.items[0].statistics;

      console.log('Updating channel statistics in database...');
      // Update database
      const { data: updatedAccount, error } = await supabase
        .from('youtube_accounts')
        .update({
          subscriber_count: parseInt(stats.subscriberCount),
          video_count: parseInt(stats.videoCount),
          view_count: parseInt(stats.viewCount),
          updated_at: new Date().toISOString(),
          access_token: account.access_token,
          token_expiry: account.token_expiry
        })
        .eq('channel_id', channelId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating channel statistics:', error);
        throw error;
      }

      console.log('Channel statistics updated successfully');
      return updatedAccount;
    } catch (error) {
      console.error('Error in updateChannelStatistics:', error);
      throw error;
    }
  }

  async disconnectChannel(channelId, userId) {
    const { error } = await supabase
      .from('youtube_accounts')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get all YouTube accounts for a user
   * @param {string} userId - User's ID
   */
  async getUserYouTubeAccounts(userId) {
    const { data, error } = await supabase
      .from('youtube_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  /**
   * Add a new YouTube account
   * @param {string} userId - User's ID
   * @param {Object} accountData - YouTube account data
   */
  async addYouTubeAccount(userId, accountData) {
    const { data, error } = await supabase
      .from('youtube_accounts')
      .insert([{
        user_id: userId,
        channel_id: accountData.channel_id,
        channel_name: accountData.channel_name,
        channel_thumbnail: accountData.channel_thumbnail,
        access_token: accountData.access_token,
        refresh_token: accountData.refresh_token
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a YouTube account
   * @param {string} accountId - YouTube account ID
   * @param {Object} updates - Account updates
   */
  async updateYouTubeAccount(accountId, updates) {
    const { data, error } = await supabase
      .from('youtube_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a YouTube account
   * @param {string} accountId - YouTube account ID
   */
  async deleteYouTubeAccount(accountId) {
    const { error } = await supabase
      .from('youtube_accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
  }

  /**
   * Get a specific YouTube account
   * @param {string} accountId - YouTube account ID
   */
  async getYouTubeAccount(accountId) {
    const { data, error } = await supabase
      .from('youtube_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new YouTubeService(); 