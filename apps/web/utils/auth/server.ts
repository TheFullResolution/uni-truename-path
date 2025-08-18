// TrueNamePath: Server-side Authentication Utilities
// Cookie-based session management with SSR server client compatibility
// Date: August 15, 2025

import { createClient } from '../supabase/server';
import type { AuthResponse } from './types';

/**
 * Server-side authentication utilities for cookie-based session management
 */

// Re-export types for compatibility
export type { AuthenticatedUser, AuthErrorCode, AuthResponse } from './types';

/**
 * Get current authenticated user from Supabase session
 * Uses cookie-based session management for secure authentication
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
const supabase = await createClient();

// Use Supabase's cookie-based session authentication
const { data: authData, error: authError } = await supabase.auth.getUser();

if (authError) {
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: `Authentication failed: ${authError.message}`,
},
  };
}

if (!authData.user) {
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: 'No authenticated user found',
},
  };
}

// Fetch user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', authData.user.id)
  .single();

// Ignore "Row not found" errors - profile might not exist yet

return {
  user: {
id: authData.user.id,
email: authData.user.email || '',
profile: profile || undefined,
  },
  error: null,
};
  } catch {
return {
  user: null,
  error: {
code: 'SESSION_VERIFICATION_FAILED',
message: 'Session verification failed',
  },
};
  }
};

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

/**
 * Sign out current user
 */
export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
const supabase = await createClient();
const { error } = await supabase.auth.signOut();
return { error };
  } catch (error) {
return { error: error as Error };
  }
};
