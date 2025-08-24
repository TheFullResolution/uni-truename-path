/**
 * OAuth Resolve Endpoint Types
 * University Final Project - TrueNamePath
 *
 * OIDC-compliant types for OAuth token resolution endpoint
 */

// Standard OIDC Claims Interface
export interface OIDCClaims {
  // Standard OIDC claims
  sub: string; // Subject (user ID)
  iss: string; // Issuer
  aud: string; // Audience (app name)
  iat: number; // Issued at timestamp

  // Optional standard claims (populated from context assignments)
  name?: string; // Full name
  given_name?: string; // First name
  family_name?: string; // Last name
  nickname?: string; // Nickname
  preferred_username?: string; // Preferred username

  // TrueNamePath-specific context information
  context_name: string; // Context name for this resolution
  app_name: string; // Application name
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
