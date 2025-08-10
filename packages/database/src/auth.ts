import {
  createServerSupabaseClient,
  createBrowserSupabaseClient,
} from './client';
import type { Database } from './types';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Server-side authentication utilities for JWT Signing Keys system
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  profile?: Database['public']['Tables']['profiles']['Row'];
}

export interface AuthResponse {
  user: AuthenticatedUser | null;
  error: string | null;
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
const supabase = createServerSupabaseClient();

// Use Supabase's JWT Signing Keys validation through getUser
const { data: authData, error: authError } =
  await supabase.auth.getUser(accessToken);

if (authError) {
  return {
user: null,
error: `Authentication failed: ${authError.message}`,
  };
}

if (!authData.user) {
  return {
user: null,
error: 'No user found in token',
  };
}

// Get the user's profile from our database
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
  error: 'Token verification failed',
};
  }
};

/**
 * Get current authenticated user from browser session
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
const supabase = createBrowserSupabaseClient();

const { data: sessionData, error: sessionError } =
  await supabase.auth.getSession();

if (sessionError) {
  return {
user: null,
error: `Session error: ${sessionError.message}`,
  };
}

if (!sessionData.session?.user) {
  return {
user: null,
error: 'No active session',
  };
}

const user = sessionData.session.user;

// Get the user's profile from our database
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

if (profileError && profileError.code !== 'PGRST116') {
  console.warn('Could not fetch user profile:', profileError.message);
}

return {
  user: {
id: user.id,
email: user.email || '',
profile: profile || undefined,
  },
  error: null,
};
  } catch (error) {
console.error('Get current user error:', error);
return {
  user: null,
  error: 'Failed to get current user',
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
 * Sign in with email and password
 */
export const signInWithPassword = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
const supabase = createBrowserSupabaseClient();

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  return {
user: null,
error: error.message,
  };
}

if (!data.user) {
  return {
user: null,
error: 'Sign in failed - no user returned',
  };
}

// Create or update profile
const { error: profileError } = await supabase.from('profiles').upsert(
  {
id: data.user.id,
email: data.user.email || email,
  },
  { onConflict: 'id' },
);

if (profileError) {
  console.warn('Could not create/update profile:', profileError.message);
}

return {
  user: {
id: data.user.id,
email: data.user.email || email,
  },
  error: null,
};
  } catch (error) {
console.error('Sign in error:', error);
return {
  user: null,
  error: 'Sign in failed',
};
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithPassword = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
const supabase = createBrowserSupabaseClient();

const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

if (error) {
  return {
user: null,
error: error.message,
  };
}

if (!data.user) {
  return {
user: null,
error: 'Sign up failed - no user returned',
  };
}

// Profile will be created automatically via trigger or when user signs in
return {
  user: {
id: data.user.id,
email: data.user.email || email,
  },
  error: null,
};
  } catch (error) {
console.error('Sign up error:', error);
return {
  user: null,
  error: 'Sign up failed',
};
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<{ error: string | null }> => {
  try {
const supabase = createBrowserSupabaseClient();

const { error } = await supabase.auth.signOut();

if (error) {
  return { error: error.message };
}

return { error: null };
  } catch (error) {
console.error('Sign out error:', error);
return { error: 'Sign out failed' };
  }
};

/**
 * Session management utilities
 */
export const sessionUtils = {
  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (
callback: (event: string, session: Session | null) => void,
  ) => {
const supabase = createBrowserSupabaseClient();
return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Get current session
   */
  getSession: async () => {
const supabase = createBrowserSupabaseClient();
return await supabase.auth.getSession();
  },

  /**
   * Refresh current session
   */
  refreshSession: async () => {
const supabase = createBrowserSupabaseClient();
return await supabase.auth.refreshSession();
  },
};

/**
 * High-performance auth utilities for API routes using JWT Signing Keys
 */
export const apiAuth = {
  /**
   * Middleware helper for Next.js API routes
   * @param request Next.js request object with headers
   */
  authenticateRequest: async (
headers: Headers | { [key: string]: string | string[] | undefined },
  ): Promise<AuthResponse> => {
let authHeader: string | null = null;

// Handle different header formats (Next.js Request vs regular headers)
if (headers instanceof Headers) {
  authHeader = headers.get('authorization');
} else {
  const auth = headers['authorization'] || headers['Authorization'];
  authHeader = Array.isArray(auth) ? auth[0] : auth || null;
}

const token = extractTokenFromHeader(authHeader);

if (!token) {
  return {
user: null,
error: 'Missing authorization token',
  };
}

return await verifyAndGetUser(token);
  },
};
