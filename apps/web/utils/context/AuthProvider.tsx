'use client';

/**
 * OPTIMIZED AuthProvider with middleware-first authentication architecture
 *
 * Key optimizations implemented:
 * - Streamlined initial auth state recovery that works with middleware verification
 * - Reduced duplicate server calls by leveraging middleware-handled authentication
 * - Smarter loading state management for better UX
 * - Error handling optimized for middleware-first architecture
 * - Token refresh optimization to prevent unnecessary API calls on public pages
 * - Maintains client-side reactivity for UI state management
 * - Preserves all authentication operations (login, signup, logout)
 * - Full SSR compatibility with official Supabase SSR patterns
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { usePathname } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import {
  signInWithPassword,
  signUpWithPassword,
  signOut,
  getCurrentUser,
  sessionUtils,
  getErrorMessage,
  getErrorAction,
  type AuthenticatedUser,
  type AuthResponse,
  type AuthErrorCode,
} from '../auth/client'; // ✅ Import from client-safe exports
import type { Session } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';

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
  // NEW: Error handling utilities in context
  getErrorMessage: (code: AuthErrorCode) => string;
  getErrorAction: (code: AuthErrorCode) => string | null;
  handleAuthError: (error: { code: AuthErrorCode; message?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if we're on a protected route that middleware already authenticated
  const isProtectedRoute =
pathname?.startsWith('/dashboard') ||
pathname?.startsWith('/profile') ||
pathname?.startsWith('/settings');

  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  // OPTIMIZATION: Skip loading state for protected routes since middleware already verified auth
  const [loading, setLoading] = useState(!isProtectedRoute);
  const [error, setError] = useState<AuthErrorCode | null>(null);

  // Clear error when user changes
  useEffect(() => {
if (user && error) {
  setError(null);
}
  }, [user, error]);

  // OPTIMIZED: Streamlined auth state recovery - middleware already verified auth
  useEffect(() => {
let mounted = true;

const initializeAuth = async () => {
  try {
// OPTIMIZATION: Since middleware handles auth verification, this is primarily
// for UI state restoration rather than authentication verification
// For protected routes, we know user is authenticated via middleware
// For public routes, we still need to check if user has a session
const response = await getCurrentUser();

if (mounted) {
  if (response.user) {
setUser(response.user);
setError(null);
  } else if (
response.error &&
response.error.code !== 'AUTHENTICATION_REQUIRED'
  ) {
// Only set error states that aren't handled by middleware
setError(response.error.code);
  }
  // Note: AUTHENTICATION_REQUIRED errors are expected on public pages
  // and handled by middleware, so we don't set them as UI errors
}
  } catch {
if (mounted) {
  // Minimal error handling since middleware handles most auth failures
  setError('AUTHENTICATION_FAILED');
}
  } finally {
if (mounted) {
  setLoading(false);
}
  }
};

// PERFORMANCE OPTIMIZATION: Reduce initial load delay
// Start auth state recovery immediately but don't block render
initializeAuth();

return () => {
  mounted = false;
};
  }, []);

  // OPTIMIZED: Auth state changes listener - reduced redundant calls
  useEffect(() => {
let mounted = true;
let subscription: { unsubscribe?: () => void } | null = null;

try {
  const authListener = sessionUtils.onAuthStateChange(
async (event: string, session: Session | null) => {
  if (!mounted) return;

  // OPTIMIZATION: Only show loading for meaningful state transitions
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
setLoading(true);
  }

  try {
if (event === 'SIGNED_IN' && session?.user) {
  // Fresh user data on sign in
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
  // OPTIMIZATION: Only refresh user data if we have a current user
  // This prevents unnecessary API calls on token refresh for public pages
  if (user) {
const response = await getCurrentUser();
if (response.user) {
  setUser(response.user);
  setError(null);
}
  }
}
  } catch {
if (mounted) {
  setError('AUTHENTICATION_FAILED');
}
  } finally {
if (mounted && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
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
  }, [user]);

  const login = useCallback(
async (email: string, password: string): Promise<AuthResponse> => {
  setLoading(true);
  setError(null);

  try {
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

// Create name variants using database-direct approach
try {
  const supabase = createClient();

  // Create primary name (always required)
  await supabase.from('names').insert({
user_id: authResponse.user.id,
name_text: legalName,
oidc_property_type: 'name',
oidc_properties: {
  verified: true,
  source: 'signup_form',
  oidc_version: '1.0',
},
is_preferred: !preferredName, // legal is preferred if no preferred name provided
source: 'signup_form',
  });

  // Create preferred username if provided
  if (preferredName && preferredName.trim() !== legalName.trim()) {
await supabase.from('names').insert({
  user_id: authResponse.user.id,
  name_text: preferredName,
  oidc_property_type: 'preferred_username',
  oidc_properties: {
verified: true,
source: 'signup_form',
oidc_version: '1.0',
  },
  is_preferred: true, // preferred name is the preferred one
  source: 'signup_form',
});
  }
} catch (nameError) {
  // Non-blocking name creation - signup succeeds even if names fail
  console.warn('Name creation during signup failed:', nameError);
}

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

  // NEW: Memoized error handler for context
  const handleAuthError = useCallback(
(error: { code: AuthErrorCode; message?: string }) => {
  const errorCode = error.code;
  const title = getErrorAction(errorCode) || 'Authentication Error';
  const message = error.message || getErrorMessage(errorCode);

  notifications.show({
title,
message,
color: 'red',
icon: <IconX size={16} />,
autoClose: 5000,
  });
},
[],
  ); // Empty dependency array as imported functions are static

  const value = useMemo(
() => ({
  user,
  login,
  signup,
  logout,
  loading,
  isAuthenticated: !!user,
  error,
  // NEW: Error handling utilities exposed through context
  getErrorMessage,
  getErrorAction,
  handleAuthError,
}),
[user, login, signup, logout, loading, error, handleAuthError],
  );

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
