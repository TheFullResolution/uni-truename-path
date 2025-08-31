// TrueNamePath OAuth Integration Library
export { TrueNameOAuthClient } from './TrueNameOAuthClient.js';

export { OAuthStorage, LocalStorageAdapter } from './storage.js';
export {
  generateStateToken,
  validateStateToken,
  parseCallbackParams,
  isAuthenticated,
  getAuthState,
  buildAuthUrl,
} from './auth-utils.js';

export { fetchClientInfo, resolveOIDCClaims } from './api-client.js';
export { useOAuthToken } from './hooks/useOAuthToken.js';
export { useStoredOAuthToken } from './hooks/useStoredOAuthToken.js';
export {
  generateOAuthCacheKey,
  createOAuthTokenFetcher,
  fetchOAuthToken,
} from './utils/oauth-token-fetcher.js';
export {
  createOAuthCacheProvider,
  clearOAuthCache,
} from './utils/oauth-cache-provider.js';
export {
  swrFocusConfig,
  createFocusConfig,
  swrHighFrequencyFocusConfig,
  swrLowFrequencyFocusConfig,
} from './utils/swr-focus-config.js';
export type {
  OAuthConfig,
  OIDCClaims,
  ClientInfo,
  AuthState,
  StorageAdapter,
  ApiResponse,
  OAuthError,
} from './types.js';
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
export {
  isSWRState,
  isOAuthCacheKey,
  isOAuthCacheEntry,
  isSerializedCacheData,
  createLoadingSWRState,
  createSuccessSWRState,
  createErrorSWRState,
} from './types/swr-cache.js';
