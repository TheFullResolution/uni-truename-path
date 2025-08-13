import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import type { Database } from './types';

// Type definitions
export type SupabaseClient = BaseSupabaseClient<Database>;

// Cookie handler types for SSR
type CookieOptions = {
  name: string;
  value: string;
  options?: {
domain?: string;
maxAge?: number;
path?: string;
sameSite?: 'lax' | 'strict' | 'none';
secure?: boolean;
httpOnly?: boolean;
  };
};

// Client instances cache
let browserClientInstance: SupabaseClient | null = null;

/**
 * Get environment variables for Supabase configuration
 * Uses consistent NEXT_PUBLIC_ variables as per official patterns
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
throw new Error(
  'Missing required Supabase environment variables. ' +
'Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
);
  }

  return { url, anonKey };
}

/**
 * Create a browser-side Supabase client using official SSR patterns
 * Uses singleton pattern to avoid multiple instances
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
throw new Error(
  'createBrowserSupabaseClient can only be used in browser environments',
);
  }

  // Return cached instance if available
  if (browserClientInstance) {
return browserClientInstance;
  }

  const { url, anonKey } = getSupabaseConfig();

  browserClientInstance = createBrowserClient<Database>(url, anonKey, {
global: {
  headers: {
'X-Client-Info': 'truename-path-browser',
  },
},
  });

  return browserClientInstance;
}

/**
 * Create a server-side Supabase client using official SSR patterns
 * @deprecated Use utils/supabase/server.ts createClient() instead
 */
export function createSSRServerSupabaseClient(
  cookieStore: ReadonlyRequestCookies,
  cookieOptions?: {
onSet?: (cookie: CookieOptions) => void;
onRemove?: (name: string) => void;
  },
): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
cookies: {
  get(name: string) {
return cookieStore.get(name)?.value;
  },
  set(name: string, value: string, options: any) {
try {
  cookieOptions?.onSet?.({ name, value, options });
} catch {
  // The `set` method was called from a Server Component.
  // This can be ignored if you have middleware refreshing
  // user sessions.
}
  },
  remove(name: string, options: any) {
try {
  cookieOptions?.onRemove?.(name);
} catch {
  // The `remove` method was called from a Server Component.
  // This can be ignored if you have middleware refreshing
  // user sessions.
}
  },
},
global: {
  headers: {
'X-Client-Info': 'truename-path-server',
  },
},
  });
}

/**
 * Create a server-side Supabase client for Route Handlers
 * Uses ResponseCookies for proper cookie management in API routes
 */
export function createRouteHandlerSupabaseClient(
  request: Request,
  response: Response,
): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
cookies: {
  get(name: string) {
const cookies = request.headers.get('cookie');
if (!cookies) return undefined;

const cookie = cookies
  .split(';')
  .find((c) => c.trim().startsWith(`${name}=`));

return cookie?.split('=')[1];
  },
  set(name: string, value: string, options: any) {
response.headers.append(
  'Set-Cookie',
  `${name}=${value}; Path=/; ${options.httpOnly ? 'HttpOnly; ' : ''}${
options.secure ? 'Secure; ' : ''
  }SameSite=${options.sameSite || 'lax'}`,
);
  },
  remove(name: string, options: any) {
response.headers.append(
  'Set-Cookie',
  `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
);
  },
},
global: {
  headers: {
'X-Client-Info': 'truename-path-route-handler',
  },
},
  });
}

/**
 * Create a service role Supabase client for admin operations
 * Uses service role key for elevated privileges
 */
export function createServiceSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
throw new Error(
  'Missing required Supabase service role environment variables. ' +
'Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
);
  }

  return createClient<Database>(url, serviceKey, {
auth: {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
},
global: {
  headers: {
'X-Client-Info': 'truename-path-service',
  },
},
  });
}

/**
 * Legacy compatibility function - creates a basic client
 * @deprecated Use specific SSR functions instead
 */
export const createSupabaseClient = (
  url: string,
  key: string,
  isServer = false,
): SupabaseClient => {
  return createClient<Database>(url, key, {
auth: {
  persistSession: !isServer,
  autoRefreshToken: !isServer,
  detectSessionInUrl: !isServer,
},
global: {
  headers: {
'X-Client-Info': `truename-path-${isServer ? 'server' : 'browser'}-legacy`,
  },
},
  });
};

/**
 * Legacy compatibility function - creates server client
 * @deprecated Use createServiceSupabaseClient instead
 */
export const createServerSupabaseClient = createServiceSupabaseClient;

/**
 * Create an authenticated user client with a specific access token
 * Used for API routes to query data as the authenticated user
 */
export const createUserSupabaseClient = (
  accessToken: string,
): SupabaseClient => {
  const { url, anonKey } = getSupabaseConfig();

  const client = createClient<Database>(url, anonKey, {
auth: {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
},
global: {
  headers: {
'Authorization': `Bearer ${accessToken}`,
'X-Client-Info': 'truename-path-user-token',
  },
},
  });

  return client;
};

/**
 * Reset client instances (useful for testing)
 */
export const resetClients = () => {
  browserClientInstance = null;
};
