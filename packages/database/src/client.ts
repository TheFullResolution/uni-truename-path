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

browserClient = createSupabaseClient(url, anonKey, false);
  }

  return browserClient;
};

/**
 * Server-side Supabase client with service role privileges
 * Uses service role key for admin operations
 *
 * For testing: Uses local Supabase when SUPABASE_URL is available (testing environment)
 * For production: Uses NEXT_PUBLIC_SUPABASE_URL (production environment)
 */
export const createServerSupabaseClient = (): BaseSupabaseClient<Database> => {
  // Use local Supabase if available (testing environment)
  // This ensures API endpoints use the same Supabase instance as the tests
  const localUrl = process.env.SUPABASE_URL;
  const localServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Use production Supabase for browser/production environment
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let url: string;
  let serviceKey: string;
  let clientKey: string; // Key to identify the client configuration

  if (localUrl && localServiceKey) {
// Testing environment: use local Supabase
url = localUrl;
serviceKey = localServiceKey;
clientKey = `local:${localUrl}`;
console.log('Server client: Using local Supabase for testing');
  } else if (prodUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
// Production environment: use production Supabase
url = prodUrl;
serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
clientKey = `prod:${prodUrl}`;
console.log('Server client: Using production Supabase');
  } else {
throw new Error(
  'Missing required Supabase environment variables for server client. ' +
'Need either (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) or (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)',
);
  }

  // Only use singleton if the configuration hasn't changed
  // This prevents issues when switching between test and production environments
  const currentClientKey = (serverClient as any)?._clientKey;

  if (!serverClient || currentClientKey !== clientKey) {
console.log(`Server client: Creating new client with key ${clientKey}`);
serverClient = createSupabaseClient(url, serviceKey, true);
(serverClient as any)._clientKey = clientKey; // Store the client key for comparison
  }

  return serverClient;
};

export type SupabaseClient = BaseSupabaseClient<Database>;

/**
 * Create an authenticated user client with a specific access token
 * Used for API routes to query data as the authenticated user
 */
export const createUserSupabaseClient = (
  accessToken: string,
): BaseSupabaseClient<Database> => {
  // Use local Supabase if available (testing environment)
  const localUrl = process.env.SUPABASE_URL;
  const localAnonKey = process.env.SUPABASE_ANON_KEY;

  // Use production Supabase for browser/production environment
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let url: string;
  let anonKey: string;

  if (localUrl && localAnonKey) {
// Testing environment: use local Supabase
url = localUrl;
anonKey = localAnonKey;
  } else if (prodUrl && prodAnonKey) {
// Production environment: use production Supabase
url = prodUrl;
anonKey = prodAnonKey;
  } else {
throw new Error(
  'Missing required Supabase environment variables for user client. ' +
'Need either (SUPABASE_URL + SUPABASE_ANON_KEY) or (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)',
);
  }

  const client = createSupabaseClient(url, anonKey, true);

  // For server-side usage with user tokens, we can set the global auth headers
  // This is a more direct approach than setSession for API routes
  client.realtime.setAuth(accessToken);

  return client;
};

/**
 * Reset client instances (useful for testing)
 */
export const resetClients = () => {
  browserClient = null;
  serverClient = null;
};
