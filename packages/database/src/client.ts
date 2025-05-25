import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export const createSupabaseClient = (url: string, anonKey: string) => {
  // Singleton pattern - only create one client instance
  if (!supabaseClient) {
supabaseClient = createClient<Database>(url, anonKey, {
  auth: {
persistSession: true,
autoRefreshToken: true,
  },
});
  }
  return supabaseClient;
};

// Alternative: Create a pre-configured client for browser use
export const createBrowserSupabaseClient = () => {
  if (typeof window === 'undefined') {
throw new Error('createBrowserSupabaseClient can only be used in browser environments');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(url, anonKey);
};

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;