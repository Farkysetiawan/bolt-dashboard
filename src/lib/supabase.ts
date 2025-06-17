import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Optimized Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Faster initial load
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 5 // Reduced for better performance
    }
  },
  global: {
    headers: {
      'x-client-info': 'flexboard-app'
    }
  },
  db: {
    schema: 'public'
  }
});