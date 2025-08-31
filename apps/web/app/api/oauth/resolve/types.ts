/**
 * OAuth Resolve Endpoint Types
 * University Final Project - TrueNamePath
 *
 * OIDC-compliant types for OAuth token resolution endpoint
 */

// Standard OIDC Claims Interface
// Enhanced with full OIDC compliance for academic Bearer token demonstration
export interface OIDCClaims {
  // Mandatory OIDC claims
  sub: string; // Subject (user ID)
  iss: string; // Issuer
  aud: string; // Audience (app name)
  iat: number; // Issued at timestamp
  exp: number; // Expiration time (iat + 3600)
  nbf: number; // Not before time (same as iat)
  jti: string; // JWT ID (unique token identifier)

  // Optional standard OIDC claims (populated from context assignments)
  name?: string; // Full name
  given_name?: string; // First name
  family_name?: string; // Last name
  nickname?: string; // Nickname
  preferred_username?: string; // Preferred username
  email?: string; // User's email address
  email_verified?: boolean; // Email verification status
  updated_at?: number; // Last profile update timestamp
  locale?: string; // User's locale (default: 'en-GB')
  zoneinfo?: string; // User's timezone (default: 'Europe/London')

  // TrueNamePath-specific context information
  context_name: string; // Context name for this resolution
  app_name: string; // Application name

  // Academic Bearer token metadata (informational only)
  _token_type?: string; // Token type identifier ('bearer_demo')
  _note?: string; // Academic transparency note about Bearer token limitations
}

// Response data for successful OAuth resolve
export interface OAuthResolveResponseData {
  claims: OIDCClaims;
  resolved_at: string; // ISO timestamp when resolved
}

// Resolve-specific error codes
export const ResolveErrorCodes = {
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  NO_CONTEXT_ASSIGNED: 'NO_CONTEXT_ASSIGNED',
  RESOLUTION_FAILED: 'RESOLUTION_FAILED',
} as const;

export type ResolveErrorCode = keyof typeof ResolveErrorCodes;
