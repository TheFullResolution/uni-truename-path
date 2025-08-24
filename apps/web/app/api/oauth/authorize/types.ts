// TrueNamePath: OAuth Authorization Endpoint Response Type Definitions
// Response types for POST /api/oauth/authorize endpoint
// Date: August 23, 2025
// Academic project - OAuth session token generation with context-aware resolution

// Type definitions for OAuth authorization endpoints

// =============================================================================
// Core Response Data Types
// =============================================================================

/**
 * OAuth Authorization Response Data Structure
 * Main response payload for successful authorization requests
 * Follows API specification requirements with nested objects
 */
export interface OAuthAuthorizeResponseData {
  /** Generated session token in format: tnp_[a-f0-9]{32} */
  session_token: string;
  /** Token expiration timestamp in ISO 8601 format */
  expires_at: string;
  /** Complete redirect URL with token parameter appended */
  redirect_url: string;
  /** Application information for the authorized app */
  app: {
/** Application unique identifier */
id: string;
/** Human-readable application display name */
display_name: string;
  };
  /** Context information for the authorization */
  context: {
/** Context unique identifier */
id: string;
/** User-defined context name */
context_name: string;
  };
}

// =============================================================================
// Database Integration Types
// =============================================================================

/**
 * OAuth session creation data for database insertion
 * Extends the database insert type with computed fields
 */
export interface OAuthSessionCreationData {
  /** User ID who authorized the session */
  user_id: string;
  /** Application ID for the session */
  app_id: string;
  /** Context ID assigned to the session */
  context_id: string;
  /** Generated session token */
  session_token: string;
  /** Token expiration timestamp */
  expires_at: string;
  /** Return URL for the authorization */
  return_url: string;
  /** Session status (always 'active' on creation) */
  status: 'active';
  /** Creation timestamp */
  created_at: string;
}

/**
 * Enriched OAuth application for response building
 * Application data with minimal required fields for external consumption
 */
export interface AuthorizeAppInfo {
  /** Application unique identifier */
  id: string;
  /** Human-readable display name */
  display_name: string;
  /** Machine-readable app name for logging */
  app_name: string;
  /** Whether the application is active */
  is_active: boolean;
}

/**
 * Context information for authorization response
 * User context data with required fields for external consumption
 */
export interface AuthorizeContextInfo {
  /** Context unique identifier */
  id: string;
  /** User-defined context name */
  context_name: string;
  /** Context owner (for validation) */
  user_id: string;
}

// =============================================================================
// Service Integration Types
// =============================================================================

/**
 * Authorization service input parameters
 * Internal service contract for authorization processing
 */
export interface AuthorizationParams {
  /** Authenticated user ID */
  user_id: string;
  /** Target application ID */
  app_id: string;
  /** Selected context ID */
  context_id: string;
  /** Return URL for redirect */
  return_url: string;
  /** Request timestamp for audit logging */
  timestamp: string;
}

/**
 * Authorization service result
 * Complete result object from authorization service
 */
export interface AuthorizationResult {
  /** Generated session data */
  session: OAuthSessionCreationData;
  /** Application information */
  application: AuthorizeAppInfo;
  /** Context information */
  context: AuthorizeContextInfo;
  /** Complete redirect URL with token */
  redirect_url: string;
}

// =============================================================================
// Error and Validation Types
// =============================================================================

/**
 * Authorization error codes specific to the authorize endpoint
 * Extends the base OAuth error codes with authorization-specific errors
 */
export const AuthorizeErrorCodes = {
  /** Application not found or inactive */
  APP_NOT_FOUND: 'OAUTH_APP_NOT_FOUND',
  /** Application is not active */
  APP_INACTIVE: 'OAUTH_APP_INACTIVE',
  /** Context not found or not accessible */
  CONTEXT_NOT_FOUND: 'CONTEXT_NOT_FOUND',
  /** Context does not belong to the user */
  CONTEXT_ACCESS_DENIED: 'CONTEXT_ACCESS_DENIED',
  /** Session token generation failed */
  TOKEN_GENERATION_FAILED: 'TOKEN_GENERATION_FAILED',
  /** Database insertion failed */
  SESSION_CREATION_FAILED: 'SESSION_CREATION_FAILED',
  /** Invalid return URL format */
  INVALID_RETURN_URL: 'INVALID_RETURN_URL',
  /** Return URL domain not allowed */
  RETURN_URL_NOT_ALLOWED: 'RETURN_URL_NOT_ALLOWED',
} as const;

export type AuthorizeErrorCode =
  (typeof AuthorizeErrorCodes)[keyof typeof AuthorizeErrorCodes];

/**
 * Authorization validation context
 * Validation state for authorization requests
 */
export interface AuthorizationValidation {
  /** Whether the application exists and is active */
  app_valid: boolean;
  /** Whether the context exists and is accessible */
  context_valid: boolean;
  /** Whether the return URL is properly formatted and allowed */
  return_url_valid: boolean;
  /** Any validation errors encountered */
  errors: Array<{
field: string;
code: AuthorizeErrorCode;
message: string;
  }>;
}

// =============================================================================
// Response Builder Types
// =============================================================================

/**
 * Response builder configuration
 * Configuration for building standardized authorization responses
 */
export interface AuthorizeResponseConfig {
  /** Request ID for tracking */
  request_id: string;
  /** Response timestamp */
  timestamp: string;
  /** User ID for audit logging */
  user_id: string;
  /** Success/error response builders */
  response_builders: {
success: (data: OAuthAuthorizeResponseData) => unknown;
error: (code: string, message: string, data?: unknown) => unknown;
  };
}

/**
 * Token format validation
 * Ensures generated tokens follow the required format pattern
 */
export interface TokenValidation {
  /** Whether the token follows tnp_[a-f0-9]{32} format */
  format_valid: boolean;
  /** Whether the token is unique in the database */
  uniqueness_verified: boolean;
  /** Token generation timestamp for expiry calculation */
  generated_at: string;
}
