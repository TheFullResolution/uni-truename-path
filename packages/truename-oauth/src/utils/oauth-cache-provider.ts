// OAuth Cache Provider for SWR

import type {
  OAuthCacheKey,
  OAuthCacheEntries,
  SerializedCacheEntries,
  Cache,
  SWRState,
  OIDCClaims,
} from '../types/swr-cache.js';
import { isOAuthCacheEntry } from '../types/swr-cache.js';

function createOAuthCache(): Cache<OIDCClaims> {
  const internalMap = new Map<string, SWRState<OIDCClaims>>();

  if (typeof window !== 'undefined') {
try {
  const stored = localStorage.getItem('swr-oauth-cache');
  if (stored) {
const parsedData: SerializedCacheEntries = JSON.parse(stored);
const validEntries = parsedData.filter(isOAuthCacheEntry);

validEntries.forEach(([key, value]) => {
  internalMap.set(key, value);
});
  }
} catch {
  localStorage.removeItem('swr-oauth-cache');
}
  }

  // Helper to save to localStorage
  const saveToStorage = (): void => {
if (typeof window !== 'undefined') {
  try {
const cacheEntries = Array.from(internalMap.entries());
const oauthEntries: OAuthCacheEntries = cacheEntries
  .filter(
([key]) =>
  key.startsWith('oauth-token-') || key === 'stored-oauth-token',
  )
  .map(([key, value]) => [key as OAuthCacheKey, value]);
localStorage.setItem('swr-oauth-cache', JSON.stringify(oauthEntries));
  } catch {
// Ignore localStorage failures
  }
}
  };

  // Return SWR Cache interface
  return {
keys(): IterableIterator<string> {
  return internalMap.keys();
},

get(key: string): SWRState<OIDCClaims> | undefined {
  return internalMap.get(key);
},

set(key: string, value: SWRState<OIDCClaims>): void {
  internalMap.set(key, value);
  saveToStorage(); // Save immediately on each set
},

delete(key: string): void {
  internalMap.delete(key);
  saveToStorage(); // Save immediately on each delete
},
  };
}

// Creates a cache provider function that persists OAuth data to localStorage
export function createOAuthCacheProvider(
  _cache: Readonly<Cache>,
): Cache<OIDCClaims> {
  // Return the OAuth cache that implements the Cache interface
  return createOAuthCache();
}

// Clears OAuth cache from localStorage
export function clearOAuthCache(): void {
  if (typeof window !== 'undefined') {
// Clear SWR OAuth cache - this is the single source of OAuth data
localStorage.removeItem('swr-oauth-cache');
  }
}
