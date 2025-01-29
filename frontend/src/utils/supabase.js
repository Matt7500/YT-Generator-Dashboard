import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl); // Debug log
console.log('Supabase Key exists:', !!supabaseAnonKey); // Debug log (don't log the actual key)
console.log('Environment:', import.meta.env.MODE); // Debug log for environment

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
    });
    throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with custom config for development
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 