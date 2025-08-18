/**
 * Client-side authentication utilities for TrueNamePath web application
 *
 * This module provides ONLY client-safe authentication functions that can be
 * imported in client components without causing server-client boundary violations.
 *
 * IMPORTANT: This file should NEVER import server-only utilities that use next/headers
 */

// Client-side authentication functions only
export {
  signInWithPassword,
  signUpWithPassword,
  signOut,
  getCurrentUser,
  sessionUtils,
} from './supabase-auth';

// Authentication error handling utilities (client-safe)
export {
  getErrorMessage,
  getErrorDetails,
  getFullErrorMessage,
  getErrorAction,
  isAuthenticationRequired,
  isCredentialsError,
} from './error-mapping';

// Centralized authentication types (client-safe)
export type { AuthErrorCode, AuthResponse, AuthenticatedUser } from './types';
