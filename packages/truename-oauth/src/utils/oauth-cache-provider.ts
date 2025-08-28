/**
 * OAuth Cache Provider for SWR
 *
 * Simple cache provider that persists OAuth data to localStorage.
 * OAuth data changes once per session, so no complex syncing is needed.
 */

import type {
  OAuthCacheKey,
  OAuthCacheEntries,
  SerializedCacheEntries,
  Cache,
  SWRState,
  OIDCClaims,
} from '../types/swr-cache.js';
import { isOAuthCacheEntry } from '../types/swr-cache.js';

/**
 * Creates a simple cache that restores once and saves on each set()
 */
function createOAuthCache(): Cache<OIDCClaims> {
  // Restore from localStorage once on initialization
  const internalMap = new Map<string, SWRState<OIDCClaims>>();

  if (typeof window !== 'undefined') {
try {
  const stored = localStorage.getItem('swr-oauth-cache');
  if (stored) {
const parsedData: SerializedCacheEntries = JSON.parse(stored);
const validEntries = parsedData.filter(isOAuthCacheEntry);

// Restore valid entries to the map
validEntries.forEach(([key, value]) => {
  internalMap.set(key, value);
});
  }
} catch {
  // Clear corrupted cache
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

/**
 * Creates a cache provider function that persists OAuth data to localStorage
 *
 * @param _cache - SWR's readonly cache (unused in this implementation)
 * @returns SWR-compatible cache that implements the standard Cache interface
 */
export function createOAuthCacheProvider(
  _cache: Readonly<Cache>,
): Cache<OIDCClaims> {
  // Return the OAuth cache that implements the Cache interface
  return createOAuthCache();
}

/**
 * Clears OAuth cache from localStorage
 * Used during logout to ensure clean state
 */
export function clearOAuthCache(): void {
  if (typeof window !== 'undefined') {
// Clear SWR OAuth cache - this is the single source of OAuth data
localStorage.removeItem('swr-oauth-cache');
  }
}
