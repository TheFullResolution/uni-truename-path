/**
 * SWR Hook for OAuth Token Resolution
 *
 * This hook prevents duplicate OAuth resolve requests by using SWR's built-in
 * deduplication feature. It handles React StrictMode gracefully and resolves
 * the "Failed to resolve session info for logging" errors by avoiding
 * duplicate API calls during double-rendering.
 */

import useSWR from 'swr';
import type { OIDCClaims } from '../types.js';
import {
  generateOAuthCacheKey,
  createOAuthTokenFetcher,
  type OAuthTokenFetcherConfig,
} from '../utils/oauth-token-fetcher.js';

/**
 * Configuration options for OAuth token resolution
 */
interface UseOAuthTokenOptions extends OAuthTokenFetcherConfig {
  token: string | null;
  enabled?: boolean;
  revalidateOnMount?: boolean; // Allow controlling mount behavior
}

/**
 * Return type for useOAuthToken hook
 */
interface UseOAuthTokenReturn {
  data: OIDCClaims | undefined;
  error: Error | undefined;
  isLoading: boolean;
  mutate: () => void;
}

/**
 * SWR hook for OAuth token resolution with request deduplication
 *
 * Uses SWR's built-in deduplication to prevent duplicate requests when
 * React StrictMode causes components to render twice. This is the primary
 * solution for avoiding OAuth session collision errors.
 *
 * @param options - Token, API configuration, and optional enabled flag
 * @returns SWR hook results with OAuth claims data
 */
export function useOAuthToken({
  token,
  apiBaseUrl,
  isDevelopment = false,
  enabled = true,
  revalidateOnMount = false,
}: UseOAuthTokenOptions): UseOAuthTokenReturn {
  // Generate cache key for proper SWR deduplication
  const cacheKey = token && enabled ? generateOAuthCacheKey(token) : null;

  // Create the configured fetcher function
  const fetchOAuthToken = createOAuthTokenFetcher({
apiBaseUrl,
isDevelopment,
  });

  const { data, error, isLoading, mutate } = useSWR(
cacheKey,
() => fetchOAuthToken(token!),
{
  // Prevent automatic revalidation for OAuth tokens
  revalidateOnFocus: false,
  revalidateOnMount, // Configurable based on use case
  revalidateOnReconnect: false,
  revalidateIfStale: false,

  // No retries for failed OAuth requests (academic simplicity)
  shouldRetryOnError: false,
  errorRetryCount: 0,

  // Key setting: Prevent React StrictMode double calls
  dedupingInterval: 5000,
},
  );

  return {
data,
error,
isLoading,
mutate,
  };
}
