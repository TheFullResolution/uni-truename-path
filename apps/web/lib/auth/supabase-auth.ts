'use client';

/**
 * Authentication utilities using official Supabase SSR client patterns
 * 
 * This module provides authentication functions that use the new official
 * Supabase SSR clients from utils/supabase/client and utils/supabase/server
 * instead of the database package clients.
 */

import { createClient } from '../../utils/supabase/client';
import type { Session } from '@supabase/supabase-js';

// Re-export types for compatibility
export interface AuthenticatedUser {
  id: string;
  email: string;
  profile?: {
id: string;
email: string;
created_at: string;
updated_at: string;
  };
}

export type AuthErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHENTICATION_FAILED'
  | 'TOKEN_VERIFICATION_FAILED';

export interface AuthResponse {
  user: AuthenticatedUser | null;
  error: {
code: AuthErrorCode;
message: string;
  } | null;
}

/**
 * Get current authenticated user using official SSR client
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient();
} catch (clientError) {
  console.error('Failed to create Supabase client:', clientError);
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: 'Failed to initialize authentication service',
},
  };
}

const { data: sessionData, error: sessionError } =
  await supabase.auth.getSession();

if (sessionError) {
  console.error('Session error:', sessionError);
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: `Session error: ${sessionError.message}`,
},
  };
}

if (!sessionData.session?.user) {
  return {
user: null,
error: {
  code: 'AUTHENTICATION_REQUIRED',
  message: 'No active session',
},
  };
}

const user = sessionData.session.user;

// Get the user's profile from our database with error handling
try {
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
} catch (profileError) {
  console.warn('Profile fetch error:', profileError);
  // Return user without profile if profile fetch fails
  return {
user: {
  id: user.id,
  email: user.email || '',
  profile: undefined,
},
error: null,
  };
}
  } catch (error) {
console.error('Get current user error:', error);
return {
  user: null,
  error: {
code: 'TOKEN_VERIFICATION_FAILED',
message: error instanceof Error ? error.message : 'Failed to get current user',
  },
};
  }
};

/**
 * Sign in with email and password using official SSR client
 */
export const signInWithPassword = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
// Input validation
if (!email || !password) {
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: 'Email and password are required',
},
  };
}

// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient();
} catch (clientError) {
  console.error('Failed to create Supabase client for sign in:', clientError);
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: 'Failed to initialize authentication service',
},
  };
}

console.log('Attempting sign in for:', email);

const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
});

if (error) {
  console.error('Supabase auth error:', error);
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: error.message || 'Authentication failed',
},
  };
}

if (!data.user) {
  console.error('No user returned from authentication');
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: 'Sign in failed - no user returned',
},
  };
}

console.log('Authentication successful for user:', data.user.id);

return {
  user: {
id: data.user.id,
email: data.user.email || email,
  },
  error: null,
};
  } catch (error) {
console.error('Sign in critical error:', error);
return {
  user: null,
  error: {
code: 'AUTHENTICATION_FAILED',
message: error instanceof Error ? error.message : 'Authentication system error',
  },
};
  }
};

/**
 * Sign up with email and password using official SSR client
 */
export const signUpWithPassword = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
const supabase = createClient();

const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

if (error) {
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: error.message,
},
  };
}

if (!data.user) {
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: 'Sign up failed - no user returned',
},
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
  error: {
code: 'AUTHENTICATION_FAILED',
message: 'Sign up failed',
  },
};
  }
};

/**
 * Sign out current user using official SSR client
 */
export const signOut = async (): Promise<{ error: string | null }> => {
  try {
const supabase = createClient();

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
 * Session management utilities using official SSR client
 */
export const sessionUtils = {
  /**
   * Listen to auth state changes with error handling
   */
  onAuthStateChange: (
callback: (event: string, session: Session | null) => void,
  ) => {
try {
  const supabase = createClient();
  return supabase.auth.onAuthStateChange((event, session) => {
try {
  callback(event, session);
} catch (callbackError) {
  console.error('Auth state change callback error:', callbackError);
}
  });
} catch (error) {
  console.error('Failed to set up auth state change listener:', error);
  // Return a dummy subscription that can be safely unsubscribed
  return {
data: {
  subscription: {
unsubscribe: () => {
  console.warn('Dummy auth subscription unsubscribed');
},
  },
},
  };
}
  },

  /**
   * Get current session with error handling
   */
  getSession: async () => {
try {
  const supabase = createClient();
  return await supabase.auth.getSession();
} catch (error) {
  console.error('Failed to get session:', error);
  return {
data: { session: null },
error: { message: 'Failed to get session' },
  };
}
  },

  /**
   * Refresh current session with error handling
   */
  refreshSession: async () => {
try {
  const supabase = createClient();
  return await supabase.auth.refreshSession();
} catch (error) {
  console.error('Failed to refresh session:', error);
  return {
data: { session: null, user: null },
error: { message: 'Failed to refresh session' },
  };
}
  },
};