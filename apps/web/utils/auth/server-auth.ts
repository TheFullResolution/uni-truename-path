import { createClient } from '../supabase/server';
import type { User } from '@supabase/supabase-js';

export interface ServerAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  error: Error | null;
}

/**
 * Server-side authentication utility for SSR components
 * Provides consistent auth checking with proper error handling
 * Prevents SSR crashes when authentication fails
 */
export async function getServerAuth(): Promise<ServerAuthResult> {
  try {
const supabase = await createClient();

// Step 1: Quick check if session exists (fast, avoids "Auth session missing!" error)
const {
  data: { session },
  error: sessionError,
} = await supabase.auth.getSession();

if (sessionError) {
  console.warn('Session error in getServerAuth:', sessionError.message);
  return { user: null, isAuthenticated: false, error: sessionError };
}

// If no session, return early (this is normal for unauthenticated users)
if (!session) {
  return { user: null, isAuthenticated: false, error: null };
}

// Step 2: Session exists, now verify it with getUser() for security
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError) {
  // This is a real auth error (not just missing session)
  console.warn(
'Auth verification error in getServerAuth:',
userError.message,
  );
  return { user: null, isAuthenticated: false, error: userError };
}

return { user, isAuthenticated: !!user, error: null };
  } catch (error) {
console.error('Unexpected error in getServerAuth:', error);
return {
  user: null,
  isAuthenticated: false,
  error: error instanceof Error ? error : new Error('Unknown error'),
};
  }
}
