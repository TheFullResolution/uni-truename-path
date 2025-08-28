/**
 * TrueNamePath OAuth Integration Library
 * Shared package for demo applications
 * University Final Project - Academic Implementation
 */

// Main client class
export { TrueNameOAuthClient } from './TrueNameOAuthClient.js';

// Storage adapters and utilities
export { OAuthStorage, LocalStorageAdapter } from './storage.js';

// Authentication utilities
export {
  generateStateToken,
  validateStateToken,
  parseCallbackParams,
  isAuthenticated,
  getAuthState,
  buildAuthUrl,
} from './auth-utils.js';

// API client functions
export { fetchClientInfo, resolveOIDCClaims } from './api-client.js';

// Type definitions
export type {
  OAuthConfig,
  OIDCClaims,
  ClientInfo,
  AuthState,
  StorageAdapter,
  ApiResponse,
  OAuthError,
} from './types.js';
