/**
 * SWR Cache Type Definitions for OAuth Integration
 *
 * Comprehensive type definitions for SWR v2 cache structure and OAuth-specific
 * implementations. Ensures strict typing for OAuth token resolution caching
 * with localStorage persistence support.
 *
 * Academic Implementation: Zero `any` types, strict TypeScript compliance
 */

import type { OIDCClaims } from '../types.js';

// =============================================================================
// SWR v2 Internal State Structure
// =============================================================================

/**
 * SWR v2 State type - matches the actual SWR State interface
 * This is imported directly from SWR's type definitions
 *
 * @template TData - The type of data being cached
 * @template TError - The type of error that may occur
 */
export interface SWRState<TData = unknown, TError = Error> {
  /** The actual cached data, undefined if not yet loaded or failed */
  data?: TData;

  /** Error state, undefined if no error occurred */
  error?: TError;

  /** True when SWR is revalidating the data (background refresh) */
  isValidating?: boolean;

  /** True when initial data loading is in progress */
  isLoading?: boolean;
}

// =============================================================================
// OAuth-Specific Cache Types
// =============================================================================

/**
 * OAuth cache key type - includes generated keys and token storage key
 * Formats: "oauth-token-{last8chars}" | "stored-oauth-token"
 */
export type OAuthCacheKey = `oauth-token-${string}` | 'stored-oauth-token';

/**
 * OAuth cache value - SWR state containing OIDC claims
 * This is what gets stored in the SWR cache for OAuth token resolution
 */
export type OAuthCacheValue = SWRState<OIDCClaims, Error>;

/**
 * OAuth cache entry tuple for localStorage serialization
 * Represents a single cache entry as stored in localStorage
 */
export type OAuthCacheEntry = [OAuthCacheKey, OAuthCacheValue];

/**
 * Collection of OAuth cache entries for bulk operations
 * Used for localStorage persistence and cache initialization
 */
export type OAuthCacheEntries = OAuthCacheEntry[];

// =============================================================================
// SWR Cache Interface (from SWR v2 types)
// =============================================================================

/**
 * SWR Cache interface from SWR v2
 * This is the actual interface that SWR expects
 */
export interface Cache<Data = unknown> {
  keys(): IterableIterator<string>;
  get(key: string): SWRState<Data> | undefined;
  set(key: string, value: SWRState<Data>): void;
  delete(key: string): void;
}

/**
 * OAuth-specific cache interface that implements SWR's Cache interface
 * Specialized for OAuth token resolution with OIDC claims
 */
export interface OAuthSWRCache extends Cache<OIDCClaims> {
  /** Additional Map-like interface for localStorage persistence */
  clear(): void;
  has(key: string): boolean;
  readonly size: number;
  entries(): IterableIterator<[string, SWRState<OIDCClaims>]>;
  values(): IterableIterator<SWRState<OIDCClaims>>;
  [Symbol.iterator](): IterableIterator<[string, SWRState<OIDCClaims>]>;
}

// =============================================================================
// localStorage Serialization Types
// =============================================================================

/**
 * Serialized cache data for localStorage persistence
 * What actually gets stored in localStorage (JSON serializable)
 */
export interface SerializedCacheData {
  /** Cache entries as array of tuples for JSON serialization */
  entries: OAuthCacheEntries;

  /** Timestamp when cache was serialized */
  timestamp: number;

  /** Cache format version for future compatibility */
  version: string;
}

/**
 * Partial serialized data (minimal format currently used)
 * For backward compatibility with current implementation
 */
export type SerializedCacheEntries = OAuthCacheEntries;

// =============================================================================
// Cache Provider Types
// =============================================================================

/**
 * Cache provider function signature
 * Function that creates and returns an SWR-compatible cache instance
 */
export type CacheProvider = (cache?: Cache) => Cache;

/**
 * OAuth-specific cache provider function signature
 * Creates a cache provider specifically for OAuth token resolution
 */
export type OAuthCacheProvider = (cache?: Cache) => OAuthSWRCache;

/**
 * Cache provider options for customization
 */
export interface CacheProviderOptions {
  /** localStorage key for cache persistence */
  storageKey?: string;

  /** Maximum number of entries to cache */
  maxEntries?: number;

  /** Cache TTL in milliseconds */
  ttl?: number;

  /** Whether to enable periodic sync to localStorage */
  enablePeriodicSync?: boolean;

  /** Sync interval in milliseconds */
  syncInterval?: number;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Type guard to check if a value is a valid SWR state
 */
export function isSWRState<T>(value: unknown): value is SWRState<T> {
  return (
typeof value === 'object' &&
value !== null &&
(typeof (value as SWRState).isValidating === 'boolean' ||
  (value as SWRState).isValidating === undefined) &&
(typeof (value as SWRState).isLoading === 'boolean' ||
  (value as SWRState).isLoading === undefined)
  );
}

/**
 * Type guard to check if a key is an OAuth cache key
 */
export function isOAuthCacheKey(key: string): key is OAuthCacheKey {
  return (
(key.startsWith('oauth-token-') && key.length === 20) || // 'oauth-token-' + 8 chars
key === 'stored-oauth-token' // Token storage key
  );
}

/**
 * Type predicate for OAuth cache entries
 * Includes both oauth-token- keys and stored-oauth-token key
 */
export function isOAuthCacheEntry(entry: unknown): entry is OAuthCacheEntry {
  return (
Array.isArray(entry) &&
entry.length === 2 &&
(isOAuthCacheKey(entry[0]) || entry[0] === 'stored-oauth-token') &&
isSWRState(entry[1])
  );
}

/**
 * Type predicate for serialized cache data
 */
export function isSerializedCacheData(
  data: unknown,
): data is SerializedCacheData {
  return (
typeof data === 'object' &&
data !== null &&
Array.isArray((data as SerializedCacheData).entries) &&
typeof (data as SerializedCacheData).timestamp === 'number' &&
typeof (data as SerializedCacheData).version === 'string'
  );
}

// =============================================================================
// Cache State Helpers
// =============================================================================

/**
 * Creates a loading SWR state
 */
export function createLoadingSWRState<T>(): SWRState<T> {
  return {
data: undefined,
error: undefined,
isValidating: true,
isLoading: true,
  };
}

/**
 * Creates a success SWR state
 */
export function createSuccessSWRState<T>(data: T): SWRState<T> {
  return {
data,
error: undefined,
isValidating: false,
isLoading: false,
  };
}

/**
 * Creates an error SWR state
 */
export function createErrorSWRState<T>(error: Error): SWRState<T> {
  return {
data: undefined,
error,
isValidating: false,
isLoading: false,
  };
}

// =============================================================================
// Re-exports
// =============================================================================

/** Re-export OIDCClaims for convenience */
export type { OIDCClaims } from '../types.js';
