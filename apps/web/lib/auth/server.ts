// TrueNamePath: Server-side Authentication Utilities
// JWT Signing Keys system with SSR server client compatibility
// Date: August 12, 2025

import { createClient } from '../../utils/supabase/server';
import type { Database } from '../types/database';

/**
 * Server-side authentication utilities for JWT Signing Keys system
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  profile?: Database['public']['Tables']['profiles']['Row'];
}

/**
 * Authentication error codes for structured error handling
 */
export type AuthErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHENTICATION_FAILED'
  | 'TOKEN_VERIFICATION_FAILED';

/**
 * Enhanced AuthResponse interface with structured error handling
 */
export interface AuthResponse {
  user: AuthenticatedUser | null;
  error: {
code: AuthErrorCode;
message: string;
  } | null;
}

/**
 * Verify JWT token and get user claims using Supabase's built-in JWT Signing Keys validation
 * This function leverages Supabase's getClaims() method for high-performance token verification
 * @param accessToken JWT access token
 */
export const verifyAndGetUser = async (
  accessToken: string,
): Promise<AuthResponse> => {
  try {
const supabase = await createClient();

// Use Supabase's JWT Signing Keys validation through getUser with explicit token
const { data: authData, error: authError } =
  await supabase.auth.getUser(accessToken);

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
  message: 'No user found in token',
},
  };
}

// For profile lookup, use service role privileges (bypasses RLS)
// This is safe because we've already validated the user's identity
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', authData.user.id)
  .single();

if (profileError && profileError.code !== 'PGRST116') {
  console.warn('Could not fetch user profile:', profileError.message);
}

return {
  user: {
id: authData.user.id,
email: authData.user.email || '',
profile: profile || undefined,
  },
  error: null,
};
  } catch (error) {
console.error('JWT verification error:', error);
return {
  user: null,
  error: {
code: 'TOKEN_VERIFICATION_FAILED',
message: 'Token verification failed',
  },
};
  }
};

/**
 * Extract JWT token from Authorization header
 * @param authHeader Authorization header value
 */
export const extractTokenFromHeader = (
  authHeader: string | null,
): string | null => {
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/);
  return match ? match[1] : null;
};

/**
 * Create authenticated Supabase client with user token context
 * Supports both cookie-based and token-based authentication
 * @param accessToken Optional JWT access token for token-based auth
 */
export const createClientWithToken = async (accessToken?: string) => {
  if (accessToken) {
// Token-based authentication: create client with explicit token
const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
return createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
global: {
  headers: {
Authorization: `Bearer ${accessToken}`,
  },
},
  }
);
  } else {
// Cookie-based authentication: use existing SSR client
return await createClient();
  }
};

/**
 * High-performance auth utilities for API routes using cookie-based SSR authentication
 */
export const apiAuth = {
  /**
   * Middleware helper for Next.js API routes
   * Uses the same cookie-based authentication as middleware for consistency
   * @param request Next.js request object
   */
  authenticateRequest: async (
request: Request,
  ): Promise<AuthResponse> => {
try {
  // First, try cookie-based authentication (consistent with middleware)
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (!authError && authData.user) {
// Success with cookie authentication
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', authData.user.id)
  .single();

if (profileError && profileError.code !== 'PGRST116') {
  console.warn('Could not fetch user profile:', profileError.message);
}

return {
  user: {
id: authData.user.id,
email: authData.user.email || '',
profile: profile || undefined,
  },
  error: null,
};
  }

  // Fallback to header-based authentication for API clients
  let authHeader: string | null = null;
  if ('headers' in request && typeof request.headers.get === 'function') {
authHeader = request.headers.get('authorization');
  }

  const token = extractTokenFromHeader(authHeader);

  if (!token) {
return {
  user: null,
  error: {
code: 'AUTHENTICATION_REQUIRED',
message: 'Missing authorization token',
  },
};
  }

  return await verifyAndGetUser(token);
} catch (error) {
  console.error('Authentication error:', error);
  return {
user: null,
error: {
  code: 'TOKEN_VERIFICATION_FAILED',
  message: 'Authentication failed',
},
  };
}
  },
};