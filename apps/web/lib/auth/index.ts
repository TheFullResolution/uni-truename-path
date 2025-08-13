/**
 * Authentication utilities for the web application
 * 
 * This module provides client-side authentication utilities including
 * error message mapping and helper functions for handling auth states.
 */

export {
  getErrorMessage,
  getErrorDetails,
  getFullErrorMessage,
  getErrorAction,
  isAuthenticationRequired,
  isCredentialsError
} from './error-mapping';

export {
  signInWithPassword,
  signUpWithPassword,
  signOut,
  getCurrentUser,
  sessionUtils
} from './supabase-auth';

// Re-export auth types from local auth utilities for convenience
export type { AuthErrorCode, AuthResponse, AuthenticatedUser } from './supabase-auth';