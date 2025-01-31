import { supabase } from '../config/supabase.js';

/**
 * Sign up a new user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} name - User's name
 */
export async function signUp(email, password, name) {
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
  return data;
}

/**
 * Sign in a user
 * @param {string} email - User's email
 * @param {string} password - User's password
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current user's profile
 * @param {string} userId - User's ID
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user's profile
 * @param {string} userId - User's ID
 * @param {Object} updates - Profile updates
 */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
  return data;
}

/**
 * Update user's password
 * @param {string} newPassword - New password
 */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return data;
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