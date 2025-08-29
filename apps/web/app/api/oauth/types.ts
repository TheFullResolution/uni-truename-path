// TrueNamePath: OAuth API Type Definitions
// Centralized types for OAuth app registration endpoints
// Date: August 23, 2025
// Academic project - OAuth integration types

import type { Tables } from '@/generated/database';

// =============================================================================
// Database Entity Types (Direct from Generated Schema)
// =============================================================================

export type AppContextAssignment = Tables<'app_context_assignments'>;

export interface OAuthClientRegistryInfo {
  /** Client ID in format tnp_[16 hex chars] */
  client_id: string;
  /** Human-readable display name */
  display_name: string;
  /** Machine-readable app name */
  app_name: string;
  /** Publisher domain for app verification */
  publisher_domain: string;
  /** Client registration timestamp */
  created_at: string;
  /** Last time this client was used (null if never used) */
  last_used_at: string | null;
}

/**
 * OAuth-specific error codes
 * Extends the standard API error codes for OAuth operations
 */
export const OAuthErrorCodes = {
  APP_NAME_TAKEN: 'OAUTH_APP_NAME_TAKEN',
  APP_NOT_FOUND: 'OAUTH_APP_NOT_FOUND',
  INVALID_REDIRECT_URI: 'OAUTH_INVALID_REDIRECT_URI',
  APP_INACTIVE: 'OAUTH_APP_INACTIVE',
  REGISTRATION_FAILED: 'OAUTH_REGISTRATION_FAILED',
  UPDATE_FAILED: 'OAUTH_UPDATE_FAILED',
  DELETION_FAILED: 'OAUTH_DELETION_FAILED',

  // Domain validation errors
  MISSING_ORIGIN_HEADER: 'OAUTH_MISSING_ORIGIN_HEADER',
  INVALID_DOMAIN_FORMAT: 'OAUTH_INVALID_DOMAIN_FORMAT',
  CLIENT_ID_GENERATION_FAILED: 'OAUTH_CLIENT_ID_GENERATION_FAILED',

  // Resolve endpoint errors
  INVALID_TOKEN: 'OAUTH_INVALID_TOKEN',
  TOKEN_EXPIRED: 'OAUTH_TOKEN_EXPIRED',
  NO_CONTEXT_ASSIGNED: 'OAUTH_NO_CONTEXT_ASSIGNED',
  RESOLUTION_FAILED: 'OAUTH_RESOLUTION_FAILED',

  // Revoke endpoint errors
  TOKEN_REVOKED: 'OAUTH_TOKEN_REVOKED',
  REVOCATION_FAILED: 'OAUTH_REVOCATION_FAILED',
} as const;

export type OAuthErrorCode =
  (typeof OAuthErrorCodes)[keyof typeof OAuthErrorCodes];

// =============================================================================
// Re-exports from Resolve Endpoint
// =============================================================================

/**
 * OAuth Resolve endpoint types - exported for external consumption
 * These types support the OAuth Bearer token to OIDC claims resolution flow
 */
export type {
  OIDCClaims,
  OAuthResolveResponseData,
  ResolveErrorCode,
} from './resolve/types';
export { ResolveErrorCodes } from './resolve/types';

/**
 * OAuth Resolve endpoint schemas - exported for validation workflows
 * These schemas validate OIDC claims and resolve response data
 */
export {
  OIDCClaimsSchema,
  OAuthResolveResponseSchema,
} from './resolve/schemas';
