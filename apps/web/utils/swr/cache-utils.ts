/**
 * SWR Cache Management Utilities for TrueNamePath
 *
 * Provides utilities for managing SWR cache, particularly for clearing
 * all cached data on logout scenarios to prevent data leakage between users.
 *
 * Security Note: Clearing cache on logout is critical for:
 * - Preventing stale user data from appearing for next user
 * - GDPR compliance (user data should be cleared on logout)
 * - Security (preventing cached sensitive information persistence)
 */

import { mutate } from 'swr';

/**
 * Clears all SWR cache entries
 *
 * This function uses SWR's global mutate with a filter that matches all keys,
 * setting all cached data to undefined without revalidation. This is the
 * recommended approach for clearing all cache on logout scenarios.
 *
 * @returns Promise that resolves when all cache entries are cleared
 */
export async function clearAllSWRCache(): Promise<void> {
  try {
// Clear all SWR cache entries using global mutate
await mutate(
  () => true, // Filter: matches all cache keys
  undefined, // Update data: set all entries to undefined
  { revalidate: false }, // Options: don't revalidate since user is logged out
);
  } catch (error) {
// Log error but don't throw - cache clearing shouldn't block logout
console.error('Failed to clear SWR cache:', error);
  }
}

/**
 * Clears specific SWR cache entries by key pattern
 *
 * Useful for clearing cache for specific API routes or data types
 * without clearing the entire cache.
 *
 * @param keyPattern - Function that returns true for keys to clear
 * @param revalidate - Whether to revalidate after clearing (default: false)
 * @returns Promise that resolves when matching cache entries are cleared
 */
export async function clearSWRCacheByPattern(
  keyPattern: (key: string) => boolean,
  revalidate: boolean = false,
): Promise<void> {
  try {
await mutate(keyPattern, undefined, { revalidate });
  } catch (error) {
console.error('Failed to clear SWR cache by pattern:', error);
  }
}

/**
 * Clears all user-related cache entries
 *
 * Specifically targets cache keys that contain user-specific data
 * like profiles, names, contexts, etc. This is less aggressive than
 * clearing all cache but still comprehensive for user data.
 *
 * @returns Promise that resolves when user cache entries are cleared
 */
export async function clearUserSWRCache(): Promise<void> {
  try {
// Clear cache entries that likely contain user data
await Promise.all([
  // Clear all API routes that contain user-specific data
  clearSWRCacheByPattern(
(key) =>
  typeof key === 'string' &&
  (key.startsWith('/api/names') ||
key.startsWith('/api/contexts') ||
key.startsWith('/api/stats') ||
key.startsWith('/api/assignments') ||
key.startsWith('/api/audit-log') ||
key.startsWith('/api/settings') ||
key.includes('user') ||
key.includes('profile')),
  ),

  // Clear cache keys defined in our cache constants
  clearSWRCacheByPattern(
(key) =>
  typeof key === 'string' &&
  (key.includes('NAMES') ||
key.includes('CONTEXTS') ||
key.includes('ASSIGNMENTS') ||
key.includes('STATS') ||
key.includes('OIDC')),
  ),
]);
  } catch (error) {
console.error('Failed to clear user SWR cache:', error);
  }
}
