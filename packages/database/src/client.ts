import {
  createClient,
  type SupabaseClient as BaseSupabaseClient,
} from '@supabase/supabase-js';
import type { Database } from './types';

// Client instances for different contexts
let browserClient: BaseSupabaseClient<Database> | null = null;
let serverClient: BaseSupabaseClient<Database> | null = null;

/**
 * Create a Supabase client with optimized JWT Signing Keys configuration
 * @param url Supabase project URL
 * @param key API key (anon or service role)
 * @param isServer Whether this is for server-side use
 */
export const createSupabaseClient = (
  url: string,
  key: string,
  isServer = false,
): BaseSupabaseClient<Database> => {
  return createClient<Database>(url, key, {
auth: {
  persistSession: !isServer,
  autoRefreshToken: !isServer,
  detectSessionInUrl: !isServer,
  // Enable JWT Signing Keys validation
  flowType: isServer ? 'pkce' : 'implicit',
},
// Optimize for JWT Signing Keys performance
global: {
  headers: {
'X-Client-Info': `truename-path-${isServer ? 'server' : 'browser'}`,
  },
},
  });
};

/**
 * Browser-side Supabase client with session persistence
 * Uses NEXT_PUBLIC_ environment variables
 */
export const createBrowserSupabaseClient = (): BaseSupabaseClient<Database> => {
  if (typeof window === 'undefined') {
throw new Error(
  'createBrowserSupabaseClient can only be used in browser environments',
);
  }

  // Singleton pattern for browser client
  if (!browserClient) {
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
'Missing required Supabase environment variables for browser client',
  );
}

// Validate new API key format
if (!anonKey.startsWith('sb_publishable_')) {
  throw new Error(
'Invalid Supabase anon key format. Expected sb_publishable_ prefix.',
  );
}

browserClient = createSupabaseClient(url, anonKey, false);
  }

  return browserClient;
};

/**
 * Server-side Supabase client with service role privileges
 * Uses service role key for admin operations
 */
export const createServerSupabaseClient = (): BaseSupabaseClient<Database> => {
  // Singleton pattern for server client
  if (!serverClient) {
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
'Missing required Supabase environment variables for server client',
  );
}

// Validate new API key format
if (!serviceKey.startsWith('sb_secret_')) {
  throw new Error(
'Invalid Supabase service role key format. Expected sb_secret_ prefix.',
  );
}

serverClient = createSupabaseClient(url, serviceKey, true);
  }

  return serverClient;
};

export type SupabaseClient = BaseSupabaseClient<Database>;
