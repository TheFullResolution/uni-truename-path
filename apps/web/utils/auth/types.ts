/**
 * Authentication types for TrueNamePath
 *
 * Centralized authentication type definitions used across client and server
 * authentication utilities. Supports cookie-based session management.
 */

import { Database } from '@/generated/database';

/**
 * Authenticated user structure for both client and server contexts
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  created_at?: string;
  profile?: Database['public']['Tables']['profiles']['Row'];
}

/**
 * Authentication error codes for structured error handling
 * Used consistently across all authentication functions
 */
export type AuthErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHENTICATION_FAILED'
  | 'SESSION_VERIFICATION_FAILED'
  | 'TOKEN_VERIFICATION_FAILED';

/**
 * Standard authentication response structure
 * Provides consistent response format across all auth operations
 */
export interface AuthResponse {
  user: AuthenticatedUser | null;
  error: {
code: AuthErrorCode;
message: string;
  } | null;
}
