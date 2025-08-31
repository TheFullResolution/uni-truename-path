// SWR Hook for OAuth Token Storage Management

import useSWR from 'swr';

interface UseStoredOAuthTokenReturn {
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
}

// SWR hook for managing OAuth token storage
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

  // Set the OAuth token in SWR cache
  const setToken = (newToken: string | null): void => {
mutate(newToken, { revalidate: false });
  };

  // Clear the OAuth token from SWR cache
  const clearToken = (): void => {
mutate(null, { revalidate: false });
  };

  return {
token: token ?? null,
setToken,
clearToken,
  };
}
