import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Use the same URL as frontend for consistency
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL_DEV;
// Use service key for backend operations
const supabaseKey = process.env.SUPABASE_SERVICE_KEY_DEV;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Decode the JWT to verify we're using the service role key
const [, payload] = supabaseKey.split('.');
try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (decoded.role !== 'service_role') {
        throw new Error(`Expected service_role key but got ${decoded.role} key. Please check your .env file.`);
    }
} catch (error) {
    console.error('Error verifying service role key:', error);
    throw error;
}

console.log('Initializing Supabase client with URL:', supabaseUrl);
console.log('Using service role key for backend operations');

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public'
    }
}); 