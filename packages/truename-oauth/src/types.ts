// OAuth Integration Types for TrueNamePath Demo Applications
export interface OAuthConfig {
  appName: string;
  apiBaseUrl: string;
  callbackUrl: string;
}

// OIDC Claims interface for TrueNamePath OAuth integration
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

export interface ClientInfo {
  client_id: string;
  display_name: string;
  app_name: string;
  publisher_domain: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userData: OIDCClaims | null;
  expiresAt: number | null;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string };

export type OAuthError =
  | 'invalid_token'
  | 'no_context_assigned'
  | 'network_error'
  | 'invalid_state'
  | 'missing_token';
