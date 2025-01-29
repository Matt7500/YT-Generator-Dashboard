import { supabase } from '../config/supabase';

// Base URL for backend API
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

// API functions for authentication
export const auth = {
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }
};

// API functions for user profile
export const profile = {
  get: async () => {
    const user = await auth.getCurrentUser();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (updates) => {
    const user = await auth.getCurrentUser();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// API functions for YouTube accounts
export const youtube = {
  getAccounts: async () => {
    const user = await auth.getCurrentUser();
    const { data, error } = await supabase
      .from('youtube_accounts')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    return data;
  },

  addAccount: async (accountData) => {
    const user = await auth.getCurrentUser();
    const { data, error } = await supabase
      .from('youtube_accounts')
      .insert([{ ...accountData, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateAccount: async (accountId, updates) => {
    const { data, error } = await supabase
      .from('youtube_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteAccount: async (accountId) => {
    const { error } = await supabase
      .from('youtube_accounts')
      .delete()
      .eq('id', accountId);
    
    if (error) throw error;
  }
};

export default {
  auth,
  profile,
  youtube
}; 