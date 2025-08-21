/**
 * Authentication utilities for TrueNamePath web application
 *
 * ⚠️  IMPORTANT: Client components should import from './client' instead
 *
 * This main index exports both client and server functions, which can cause
 * Next.js client-server boundary violations when imported in client components.
 *
 * USE THIS PATTERN:
 * - Client components: import from '@/lib/auth/client'
 * - Server components: import from '@/lib/auth' (this file)
 * - Server-only code: import from '@/lib/auth/server'
 */

// ============================================================================
// CLIENT-SAFE EXPORTS (can be imported in client components via ./client)
// ============================================================================

// Client-side authentication functions
export {
  signInWithPassword,
  signUpWithPassword,
  signOut,
  getCurrentUser,
  sessionUtils,
} from './supabase-auth';

// Authentication error handling utilities
export {
  getErrorMessage,
  getErrorDetails,
  getFullErrorMessage,
  getErrorAction,
  isAuthenticationRequired,
  isCredentialsError,
} from './error-mapping';

// ============================================================================
// SERVER-ONLY EXPORTS (❌ DO NOT import these in client components)
// ============================================================================

// Server-side authentication functions (uses next/headers)
export { createClientWithToken } from './server';

// ============================================================================
// SHARED TYPES (safe for both client and server)
// ============================================================================

// Centralized authentication types
export type { AuthErrorCode, AuthResponse, AuthenticatedUser } from './types';
