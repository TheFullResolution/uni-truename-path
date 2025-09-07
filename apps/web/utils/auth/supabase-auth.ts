'use client';

/**
 * Authentication utilities using official Supabase SSR client patterns
 *
 * This module provides authentication functions that use the new official
 * Supabase SSR clients from utils/supabase/client and utils/supabase/server
 * instead of the database package clients.
 */

import { createClient } from '../supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { AuthResponse } from './types';

/**
 * Get current authenticated user using official SSR client
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient();
} catch {
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
  const { data: profile } = await supabase
.from('profiles')
.select('*')
.eq('id', user.id)
.single();

  // Profile may not exist yet - this is normal

  return {
user: {
  id: user.id,
  email: user.email || '',
  profile: profile || undefined,
},
error: null,
  };
} catch {
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
return {
  user: null,
  error: {
code: 'TOKEN_VERIFICATION_FAILED',
message:
  error instanceof Error ? error.message : 'Failed to get current user',
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
} catch {
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: 'Failed to initialize authentication service',
},
  };
}

const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
});

if (error) {
  // Log failed login attempt
  try {
// Query profiles table to get user ID from email for failed login logging
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', email.trim())
  .single();

if (profile?.id) {
  await supabase.rpc('log_auth_event', {
p_user_id: profile.id,
p_event_type: 'failed_login',
p_success: false,
p_error_message: error.message || 'Authentication failed',
p_metadata: {
  source: 'web_app',
  timestamp: new Date().toISOString(),
  email: email.trim(),
},
  });
}
  } catch {
// Silent fail - we don't want to expose whether an email exists
// This prevents user enumeration attacks
  }

  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: error.message || 'Authentication failed',
},
  };
}

if (!data.user) {
  return {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: 'Sign in failed - no user returned',
},
  };
}

// Log successful login event
try {
  await supabase.rpc('log_auth_event', {
p_user_id: data.user.id,
p_event_type: 'login',
p_success: true,
p_metadata: {
  source: 'web_app',
  timestamp: new Date().toISOString(),
},
  });
} catch (logError) {
  console.error('Failed to log login event:', logError);
  // Don't fail the login if logging fails
}

return {
  user: {
id: data.user.id,
email: data.user.email || email,
  },
  error: null,
};
  } catch (error) {
return {
  user: null,
  error: {
code: 'AUTHENTICATION_FAILED',
message:
  error instanceof Error
? error.message
: 'Authentication system error',
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
  // For signup failures, we don't have a user ID yet, so we can't log to auth_events
  // This could be enhanced in the future to track anonymous signup attempts
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
return {
  user: null,
  error: {
code: 'AUTHENTICATION_FAILED',
message: error instanceof Error ? error.message : 'Sign up failed',
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

// Log logout event before signing out
try {
  const {
data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
await supabase.rpc('log_auth_event', {
  p_user_id: session.user.id,
  p_event_type: 'logout',
  p_success: true,
  p_metadata: {
source: 'web_app',
timestamp: new Date().toISOString(),
  },
});
  }
} catch (logError) {
  console.error('Failed to log logout event:', logError);
  // Don't fail the logout if logging fails
}

const { error } = await supabase.auth.signOut();

if (error) {
  return { error: error.message };
}

return { error: null };
  } catch (error) {
return {
  error: error instanceof Error ? error.message : 'Sign out failed',
};
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
} catch {
  // Ignore callback errors
}
  });
} catch {
  // Return a dummy subscription that can be safely unsubscribed
  return {
data: {
  subscription: {
unsubscribe: () => {},
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
} catch {
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
} catch {
  return {
data: { session: null, user: null },
error: { message: 'Failed to refresh session' },
  };
}
  },
};
