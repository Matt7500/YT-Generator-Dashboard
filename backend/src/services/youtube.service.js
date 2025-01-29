const supabase = require('../config/supabase');

class YouTubeService {
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