/**
 * SWR Hook for OAuth Token Storage Management
 *
 * This hook manages the OAuth token itself using SWR's caching mechanism.
 * It provides a clean interface for storing, retrieving, and clearing the
 * OAuth token while leveraging SWR's built-in persistence through our
 * cache provider.
 *
 * Academic Implementation: Demonstrates proper separation of concerns where
 * one hook manages the token (this hook) and another manages the data fetched
 * with that token (useOAuthToken).
 */

import useSWR from 'swr';

/**
 * Return type for the useStoredOAuthToken hook
 */
interface UseStoredOAuthTokenReturn {
  /** The stored OAuth token, null if not present */
  token: string | null;
  /** Function to set/update the OAuth token in SWR cache */
  setToken: (token: string | null) => void;
  /** Function to clear the OAuth token from SWR cache */
  clearToken: () => void;
}

/**
 * SWR hook for managing OAuth token storage
 *
 * This hook uses SWR to manage the OAuth token itself, providing a clean
 * interface for token operations while leveraging SWR's caching and
 * persistence mechanisms through our localStorage-backed cache provider.
 *
 * Key benefits:
 * - Token is cached by SWR (persisted via our cache provider)
 * - No manual localStorage operations needed
 * - Integrates seamlessly with other SWR hooks
 * - Type-safe token management
 *
 * @returns Object containing token, setToken, and clearToken functions
 */
export function useStoredOAuthToken(): UseStoredOAuthTokenReturn {
  const { data: token, mutate } = useSWR<string | null>(
'stored-oauth-token', // Fixed cache key for the OAuth token
null, // No fetcher needed - we manage the data manually via mutate
{
  // OAuth token configuration - no automatic revalidation needed
  fallbackData: null,
  revalidateOnFocus: false,
  revalidateOnMount: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,

  // Token doesn't change frequently, no need for deduplication window
  dedupingInterval: 0,

  // No retries needed for token management
  shouldRetryOnError: false,
  errorRetryCount: 0,
},
  );

  /**
   * Set the OAuth token in SWR cache
   *
   * @param newToken - The OAuth token to store, or null to clear
   */
  const setToken = (newToken: string | null): void => {
mutate(newToken, { revalidate: false });
  };

  /**
   * Clear the OAuth token from SWR cache
   * Convenience method for setToken(null)
   */
  const clearToken = (): void => {
mutate(null, { revalidate: false });
  };

  return {
token: token ?? null,
setToken,
clearToken,
  };
}
