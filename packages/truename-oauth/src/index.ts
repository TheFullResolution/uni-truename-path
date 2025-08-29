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

// SWR Hooks for OAuth token resolution
export { useOAuthToken } from './hooks/useOAuthToken.js';
export { useStoredOAuthToken } from './hooks/useStoredOAuthToken.js';

// SWR OAuth Token Fetching utilities
export {
  generateOAuthCacheKey,
  createOAuthTokenFetcher,
  fetchOAuthToken,
} from './utils/oauth-token-fetcher.js';

// SWR OAuth Cache Provider utilities
export {
  createOAuthCacheProvider,
  clearOAuthCache,
} from './utils/oauth-cache-provider.js';

// SWR Focus-Based Configuration utilities
export {
  swrFocusConfig,
  createFocusConfig,
  swrHighFrequencyFocusConfig,
  swrLowFrequencyFocusConfig,
} from './utils/swr-focus-config.js';

// Type definitions - Core types
export type {
  OAuthConfig,
  OIDCClaims,
  ClientInfo,
  AuthState,
  StorageAdapter,
  ApiResponse,
  OAuthError,
} from './types.js';

// Type definitions - SWR Cache types
export type {
  SWRState,
  OAuthCacheKey,
  OAuthCacheValue,
  OAuthCacheEntry,
  OAuthCacheEntries,
  Cache,
  OAuthSWRCache,
  SerializedCacheData,
  SerializedCacheEntries,
  CacheProvider,
  OAuthCacheProvider,
  CacheProviderOptions,
} from './types/swr-cache.js';

// SWR Cache utility functions
export {
  isSWRState,
  isOAuthCacheKey,
  isOAuthCacheEntry,
  isSerializedCacheData,
  createLoadingSWRState,
  createSuccessSWRState,
  createErrorSWRState,
} from './types/swr-cache.js';
