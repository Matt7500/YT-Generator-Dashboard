import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { updateChannelStatistics } from './youtube.service.js';

/**
 * Sign up a new user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} name - User's name
 */
export async function signUp(email, password, name) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (error) throw error;

    // Create a profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email: email,
          name: name
        }
      ]);

    if (profileError) throw profileError;

    return data;
  } catch (error) {
    logger.error('Sign up failed:', error);
    throw error;
  }
}

/**
 * Update all channel statistics for a user
 * @param {string} userId - User's ID
 */
async function updateAllChannelStats(userId) {
    try {
        // Get all channels for the user
        const { data: channels, error } = await supabase
            .from('youtube_accounts')
            .select('channel_id')
            .eq('user_id', userId);

        if (error) throw error;

        // Update stats for each channel
        const updatePromises = channels.map(channel => 
            updateChannelStatistics(channel.channel_id, userId)
        );

        await Promise.all(updatePromises);
        logger.info(`Updated statistics for ${channels.length} channels for user ${userId}`);
    } catch (error) {
        logger.error('Failed to update channel statistics:', error);
        // Don't throw the error - we don't want to break the login flow
    }
}

/**
 * Sign in a user
 * @param {string} email - User's email
 * @param {string} password - User's password
 */
export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Update channel statistics in the background after successful login
        updateAllChannelStats(data.user.id);

        return data;
    } catch (error) {
        logger.error('Sign in failed:', error);
        throw error;
    }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    logger.error('Sign out failed:', error);
    throw error;
  }
}

/**
 * Get the current user's profile
 * @param {string} userId - User's ID
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Get user profile failed:', error);
    throw error;
  }
}

/**
 * Update user's profile
 * @param {string} userId - User's ID
 * @param {Object} updates - Profile updates
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Update user profile failed:', error);
    throw error;
  }
}

/**
 * Update user's password
 * @param {string} newPassword - New password
 */
export async function updatePassword(userId, newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { message: 'Password updated successfully' };
  } catch (error) {
    logger.error('Update password failed:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - User's email
 */
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return data;
}

/**
 * Verify email with token
 * @param {string} token - Verification token
 */
export async function verifyEmail(token) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email'
  });

  if (error) throw error;
  return data;
} 