/**
 * OAuth Integration Types for TrueNamePath Demo Applications
 * University Final Project - Academic Implementation
 */

// OAuth Configuration for initializing the client
export interface OAuthConfig {
  appName: string;
  apiBaseUrl: string;
  callbackUrl: string;
}

// OIDC Claims object returned from TrueNamePath
export interface OIDCClaims {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  nickname: string;
  preferred_username: string;
  iss: string;
  aud: string;
  iat: number;
  context_name: string;
  app_name: string;
}

// Client information from OAuth registry
export interface ClientInfo {
  client_id: string;
  display_name: string;
  app_name: string;
  publisher_domain: string;
}

// Authentication state combining token and user data
export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userData: OIDCClaims | null;
  expiresAt: number | null;
}

// Storage adapter interface for flexibility
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// API response wrapper for error handling with discriminated union
export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string };

// OAuth flow error types
export type OAuthError =
  | 'invalid_token'
  | 'no_context_assigned'
  | 'network_error'
  | 'invalid_state'
  | 'missing_token';
