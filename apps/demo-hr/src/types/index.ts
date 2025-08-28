/**
 * Type Definitions Index
 *
 * Centralized exports for all type definitions used in the demo HR application.
 * Provides convenient imports for SWR cache types and related utilities.
 */

// SWR Cache Types
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
  OIDCClaims,
} from './swr-cache';

// SWR Cache Utilities
export {
  isSWRState,
  isOAuthCacheKey,
  isOAuthCacheEntry,
  isSerializedCacheData,
  createLoadingSWRState,
  createSuccessSWRState,
  createErrorSWRState,
} from './swr-cache';
