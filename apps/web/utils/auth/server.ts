// TrueNamePath: Server-side Authentication Utilities
// Cookie-based session management with SSR server client compatibility
// Date: August 15, 2025

import { createClient } from '../supabase/server';

/**
 * Server-side authentication utilities for cookie-based session management
 */

// Re-export types for compatibility
export type { AuthenticatedUser, AuthErrorCode, AuthResponse } from './types';

/**
 * Create authenticated Supabase client with optional token support
 * Supports both cookie-based and token-based authentication for compatibility
 * @param accessToken Optional access token for API client compatibility
 */
export const createClientWithToken = async (accessToken?: string) => {
  if (accessToken) {
// Token-based authentication: create client with explicit token
const { createClient: createSupabaseClient } = await import(
  '@supabase/supabase-js'
);
return createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
global: {
  headers: {
Authorization: `Bearer ${accessToken}`,
  },
},
  },
);
  } else {
// Cookie-based authentication: use existing SSR client
return await createClient();
  }
};
