const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const isDevelopment = process.env.NODE_ENV === 'development';

const supabaseUrl = isDevelopment 
  ? process.env.SUPABASE_URL_DEV 
  : process.env.SUPABASE_URL_PROD;

const supabaseKey = isDevelopment 
  ? process.env.SUPABASE_SERVICE_KEY_DEV 
  : process.env.SUPABASE_SERVICE_KEY_PROD;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

module.exports = supabase; 