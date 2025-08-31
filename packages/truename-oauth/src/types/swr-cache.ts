// SWR Cache Type Definitions for OAuth Integration

import type { OIDCClaims } from '../types.js';

export interface SWRState<TData = unknown, TError = Error> {
  data?: TData;
  error?: TError;
  isValidating?: boolean;
  isLoading?: boolean;
}

export type OAuthCacheKey = `oauth-token-${string}` | 'stored-oauth-token';

export type OAuthCacheValue = SWRState<OIDCClaims, Error>;

export type OAuthCacheEntry = [OAuthCacheKey, OAuthCacheValue];

export type OAuthCacheEntries = OAuthCacheEntry[];

export interface Cache<Data = unknown> {
  keys(): IterableIterator<string>;
  get(key: string): SWRState<Data> | undefined;
  set(key: string, value: SWRState<Data>): void;
  delete(key: string): void;
}

export interface OAuthSWRCache extends Cache<OIDCClaims> {
  clear(): void;
  has(key: string): boolean;
  readonly size: number;
  entries(): IterableIterator<[string, SWRState<OIDCClaims>]>;
  values(): IterableIterator<SWRState<OIDCClaims>>;
  [Symbol.iterator](): IterableIterator<[string, SWRState<OIDCClaims>]>;
}

export interface SerializedCacheData {
  entries: OAuthCacheEntries;
  timestamp: number;
  version: string;
}

export type SerializedCacheEntries = OAuthCacheEntries;

export type CacheProvider = (cache?: Cache) => Cache;

export type OAuthCacheProvider = (cache?: Cache) => OAuthSWRCache;

export interface CacheProviderOptions {
  storageKey?: string;
  maxEntries?: number;
  ttl?: number;
  enablePeriodicSync?: boolean;
  syncInterval?: number;
}

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

export function isOAuthCacheKey(key: string): key is OAuthCacheKey {
  return (
(key.startsWith('oauth-token-') && key.length === 20) ||
key === 'stored-oauth-token'
  );
}

export function isOAuthCacheEntry(entry: unknown): entry is OAuthCacheEntry {
  return (
Array.isArray(entry) &&
entry.length === 2 &&
(isOAuthCacheKey(entry[0]) || entry[0] === 'stored-oauth-token') &&
isSWRState(entry[1])
  );
}

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

export function createLoadingSWRState<T>(): SWRState<T> {
  return {
data: undefined,
error: undefined,
isValidating: true,
isLoading: true,
  };
}

export function createSuccessSWRState<T>(data: T): SWRState<T> {
  return {
data,
error: undefined,
isValidating: false,
isLoading: false,
  };
}

export function createErrorSWRState<T>(error: Error): SWRState<T> {
  return {
data: undefined,
error,
isValidating: false,
isLoading: false,
  };
}

export type { OIDCClaims } from '../types.js';
