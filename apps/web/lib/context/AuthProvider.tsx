'use client';

/**
 * AuthProvider with official Supabase SSR patterns
 *
 * This provider uses the official Supabase SSR client implementation which:
 * - Uses official createClient from utils/supabase/client for optimal SSR session persistence
 * - Handles authentication state with proper SSR cookie management
 * - Maintains session across browser refreshes and SSR hydration
 * - Provides seamless authentication experience in Next.js App Router
 * - Follows official Supabase SSR patterns for Next.js
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  signInWithPassword,
  signUpWithPassword,
  signOut,
  getCurrentUser,
  sessionUtils,
  type AuthenticatedUser,
  type AuthResponse,
  type AuthErrorCode,
} from '../auth';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '../../utils/supabase/client';

interface AuthContextType {
  user: AuthenticatedUser | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (
email: string,
password: string,
legalName: string,
preferredName?: string,
  ) => Promise<AuthResponse>;
  logout: () => Promise<{ error: string | null }>;
  loading: boolean;
  isAuthenticated: boolean;
  error: AuthErrorCode | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthErrorCode | null>(null);

  // Clear error when user changes
  useEffect(() => {
if (user && error) {
  setError(null);
}
  }, [user, error]);

  // Initialize auth state with SSR-compatible session recovery
  useEffect(() => {
let mounted = true;

const initializeAuth = async () => {
  try {
// getCurrentUser uses official SSR browser client for seamless session restoration
const response = await getCurrentUser();

if (mounted) {
  if (response.user) {
setUser(response.user);
setError(null);
  } else if (response.error) {
// Only set error if it's not just "authentication required"
if (response.error.code !== 'AUTHENTICATION_REQUIRED') {
  setError(response.error.code);
}
  }
}
  } catch {
if (mounted) {
  setError('AUTHENTICATION_FAILED');
}
  } finally {
if (mounted) {
  setLoading(false);
}
  }
};

initializeAuth();

return () => {
  mounted = false;
};
  }, []);

  // Listen to auth state changes with SSR-compatible session management
  useEffect(() => {
let mounted = true;
let subscription: { unsubscribe?: () => void } | null = null;

try {
  // sessionUtils uses official SSR browser client for reliable auth state tracking
  const authListener = sessionUtils.onAuthStateChange(
async (event: string, session: Session | null) => {
  if (!mounted) {
return;
  }

  setLoading(true);

  try {
if (event === 'SIGNED_IN' && session?.user) {
  // Get full user data including profile
  const response = await getCurrentUser();
  if (response.user) {
setUser(response.user);
setError(null);
  } else if (response.error) {
setError(response.error.code);
setUser(null);
  }
} else if (event === 'SIGNED_OUT') {
  setUser(null);
  setError(null);
} else if (event === 'TOKEN_REFRESHED' && session?.user) {
  // Refresh user data
  const response = await getCurrentUser();
  if (response.user) {
setUser(response.user);
setError(null);
  }
}
  } catch {
if (mounted) {
  setError('AUTHENTICATION_FAILED');
}
  } finally {
if (mounted) {
  setLoading(false);
}
  }
},
  );

  subscription = authListener?.data?.subscription;
} catch {
  if (mounted) {
setError('AUTHENTICATION_FAILED');
setLoading(false);
  }
}

return () => {
  mounted = false;
  try {
subscription?.unsubscribe?.();
  } catch {
// Silent cleanup - errors here are not critical
  }
};
  }, []);

  const login = useCallback(
async (email: string, password: string): Promise<AuthResponse> => {
  setLoading(true);
  setError(null);

  try {
// signInWithPassword uses official SSR browser client for secure authentication
const response = await signInWithPassword(email, password);

if (response.user) {
  setUser(response.user);
  setError(null);
} else if (response.error) {
  setError(response.error.code);
  setUser(null);
}

return response;
  } catch (err) {
const errorResponse: AuthResponse = {
  user: null,
  error: {
code: 'AUTHENTICATION_FAILED',
message:
  err instanceof Error
? err.message
: 'Login failed due to unexpected error',
  },
};
setError('AUTHENTICATION_FAILED');
return errorResponse;
  } finally {
setLoading(false);
  }
},
[],
  );

  const signup = useCallback(
async (
  email: string,
  password: string,
  legalName: string,
  preferredName?: string,
): Promise<AuthResponse> => {
  setLoading(true);
  setError(null);

  try {
// Use existing signUpWithPassword function from auth utilities
const authResponse = await signUpWithPassword(email, password);

if (authResponse.error) {
  setError(authResponse.error.code);
  return authResponse;
}

if (!authResponse.user) {
  const errorResponse: AuthResponse = {
user: null,
error: {
  code: 'AUTHENTICATION_FAILED',
  message: 'Signup succeeded but no user returned',
},
  };
  setError('AUTHENTICATION_FAILED');
  return errorResponse;
}

// Create name variants using database-direct approach with authenticated client
try {
  const supabase = createClient();

  // Create LEGAL name (always required)
  await supabase.from('names').insert({
user_id: authResponse.user.id,
name_text: legalName,
name_type: 'LEGAL',
is_preferred: !preferredName, // legal is preferred if no preferred name provided
verified: true,
source: 'signup_form',
  });

  // Create PREFERRED name if provided
  if (preferredName && preferredName.trim() !== legalName.trim()) {
await supabase.from('names').insert({
  user_id: authResponse.user.id,
  name_text: preferredName,
  name_type: 'PREFERRED',
  is_preferred: true, // preferred name is the preferred one
  verified: true,
  source: 'signup_form',
});
  }
} catch (nameError) {
  // Non-blocking name creation - signup succeeds even if names fail
  console.warn('Name creation during signup failed:', nameError);
  // Could log this for monitoring but don't fail the signup
}

// Update authentication state on successful signup
setUser(authResponse.user);
setError(null);

return authResponse;
  } catch (err) {
const errorResponse: AuthResponse = {
  user: null,
  error: {
code: 'AUTHENTICATION_FAILED',
message:
  err instanceof Error
? err.message
: 'Signup failed due to unexpected error',
  },
};
setError('AUTHENTICATION_FAILED');
return errorResponse;
  } finally {
setLoading(false);
  }
},
[],
  );

  const logout = useCallback(async (): Promise<{ error: string | null }> => {
setLoading(true);

try {
  // signOut uses official SSR browser client for secure session termination
  const result = await signOut();

  if (!result.error) {
setUser(null);
setError(null);
  }

  return result;
} catch {
  return { error: 'Logout failed due to unexpected error' };
} finally {
  setLoading(false);
}
  }, []);

  const value: AuthContextType = {
user,
login,
signup,
logout,
loading,
isAuthenticated: !!user,
error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export types for convenience
export type { AuthContextType, AuthenticatedUser, AuthResponse, AuthErrorCode };
