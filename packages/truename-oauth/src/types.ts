// OAuth Integration Types for TrueNamePath Demo Applications
export interface OAuthConfig {
  appName: string;
  apiBaseUrl: string;
  callbackUrl: string;
}

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
