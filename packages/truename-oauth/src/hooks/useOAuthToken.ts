// SWR Hook for OAuth Token Resolution

import useSWR from 'swr';
import type { OIDCClaims } from '../types.js';
import {
  generateOAuthCacheKey,
  createOAuthTokenFetcher,
  type OAuthTokenFetcherConfig,
} from '../utils/oauth-token-fetcher.js';
import { swrFocusConfig } from '../utils/swr-focus-config.js';

// Configuration options for OAuth token resolution
interface UseOAuthTokenOptions extends OAuthTokenFetcherConfig {
  token: string | null;
  enabled?: boolean;
  revalidateOnMount?: boolean; // Allow controlling mount behavior
  revalidateOnFocus?: boolean; // Allow controlling focus behavior
  revalidateOnReconnect?: boolean; // Allow controlling reconnect behavior
}

// Return type for useOAuthToken hook
interface UseOAuthTokenReturn {
  data: OIDCClaims | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
}

// SWR hook for OAuth token resolution with focus-based revalidation
export function useOAuthToken({
  token,
  apiBaseUrl,
  isDevelopment = false,
  enabled = true,
  revalidateOnMount = false,
  revalidateOnFocus = true, // Enable focus updates by default
  revalidateOnReconnect = true, // Enable reconnect updates by default
}: UseOAuthTokenOptions): UseOAuthTokenReturn {
  // Generate cache key for proper SWR deduplication
  const cacheKey = token && enabled ? generateOAuthCacheKey(token) : null;

  // Create the configured fetcher function
  const fetchOAuthToken = createOAuthTokenFetcher({
apiBaseUrl,
isDevelopment,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR(
cacheKey,
() => fetchOAuthToken(token!),
{
  // Use focus-based configuration with parameter overrides
  ...swrFocusConfig,
  revalidateOnMount, // Allow mount behavior override
  revalidateOnFocus, // Allow focus behavior override
  revalidateOnReconnect, // Allow reconnect behavior override

  // Always disable stale revalidation for OAuth tokens
  revalidateIfStale: false,

  // Keep OAuth-specific deduplication interval (longer than default)
  dedupingInterval: 5000,
},
  );

  return {
data,
error,
isLoading,
isValidating,
mutate,
  };
}
