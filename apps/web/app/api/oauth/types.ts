// TrueNamePath: OAuth API Type Definitions
// Centralized types for OAuth app registration endpoints
// Date: August 23, 2025
// Academic project - OAuth integration types

import type { Tables } from '@/generated/database';

// =============================================================================
// Database Entity Types (Direct from Generated Schema)
// =============================================================================

/**
 * OAuth session database entity
 */
export type OAuthSession = Tables<'oauth_sessions'>;

/**
 * App context assignment database entity
 */
export type AppContextAssignment = Tables<'app_context_assignments'>;

/**
 * App usage log database entity
 */
export type AppUsageLog = Tables<'app_usage_log'>;

// =============================================================================
// API Response Types (JSend compliant)
// =============================================================================

/**
 * OAuth application info response data
 * Returns basic application information for external consumption
 */
export interface OAuthAppInfoResponse {
  /** Client ID in format tnp_[16 hex chars] */
  client_id: string;
  /** Machine-readable app name */
  app_name: string;
  /** Human-readable display name */
  display_name: string;
  /** Optional app description */
  description: string | null;
  /** Publisher domain for app verification */
  publisher_domain: string;
  /** App creation timestamp */
  created_at: string;
  /** Last time this client was used */
  last_used_at: string | null;
}

/**
 * OAuth client registry information for client ID-based responses
 * Used for lightweight client identification and validation
 */
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
 * Response data for POST /api/oauth/apps (app registration)
 */
export interface CreateOAuthAppResponseData {
  /** Success message */
  message: string;
  /** Created application details */
  application: OAuthAppInfoResponse;
}

/**
 * Response data for GET /api/oauth/apps/[appName] (app details)
 */
export interface GetOAuthAppResponseData {
  /** Client registry information */
  client: OAuthClientRegistryInfo;
  /** Optional metadata */
  metadata?: {
/** Request timestamp */
retrieved_at: string;
/** App status information */
status: 'active' | 'inactive';
  };
}

/**
 * Response data for PUT /api/oauth/apps/[appName] (app updates)
 */
export interface UpdateOAuthAppResponseData {
  /** Success message */
  message: string;
  /** Updated application details */
  application: OAuthAppInfoResponse;
  /** Fields that were updated */
  updated_fields: string[];
}

/**
 * Response data for DELETE /api/oauth/apps/[appName] (app deletion)
 */
export interface DeleteOAuthAppResponseData {
  /** Success message */
  message: string;
  /** Client ID of the deleted application */
  deleted_client_id: string;
  /** Name of the deleted application */
  app_name: string;
  /** Deletion timestamp */
  deleted_at: string;
}

/**
 * Response data for GET /api/oauth/apps (list applications)
 */
export interface ListOAuthAppsResponseData {
  /** Array of registered applications */
  applications: OAuthAppInfoResponse[];
  /** Result metadata */
  metadata: {
/** Total number of applications */
total_count: number;
/** Number of active applications */
active_count: number;
/** Filters applied to the query */
filters_applied: {
  /** Optional active status filter */
  is_active?: boolean;
  /** Optional result limit */
  limit?: number;
};
/** Request timestamp */
retrieved_at: string;
  };
}

/**
 * Response data for POST /api/oauth/revoke (token revocation)
 */
export interface OAuthRevokeResponseData {
  /** Whether the token was successfully revoked */
  revoked: boolean;
  /** Session ID that was revoked */
  session_id: string;
  /** Timestamp when the token was revoked (ISO 8601) */
  revoked_at: string;
  /** Whether the associated app context assignment was removed */
  app_context_assignment_removed: boolean;
}

// =============================================================================
// Internal Service Types
// =============================================================================

/**
 * OAuth app creation parameters for internal service calls
 */
export interface CreateOAuthAppParams {
  app_name: string;
  display_name: string;
  publisher_domain: string;
}

/**
 * OAuth app update parameters for internal service calls
 */
export interface UpdateOAuthAppParams {
  display_name?: string;
  last_used_at?: string | null;
}

// =============================================================================
// Validation and Error Types
// =============================================================================

/**
 * OAuth app validation result
 * Used internally for validation workflows
 */
export interface OAuthAppValidation {
  /** Whether the app name is available */
  name_available: boolean;
  /** Whether the redirect URI is valid */
  redirect_uri_valid: boolean;
  /** Any validation warnings */
  warnings: string[];
  /** Any validation errors */
  errors: string[];
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
