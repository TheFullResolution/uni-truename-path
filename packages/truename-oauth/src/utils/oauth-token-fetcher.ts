// OAuth Token Fetcher Utility

import type { OIDCClaims, ApiResponse } from '../types.js';

export interface OAuthTokenFetcherConfig {
  apiBaseUrl: string;
  isDevelopment?: boolean;
}

const DEFAULT_CONFIG: Partial<OAuthTokenFetcherConfig> = {
  isDevelopment: false,
};

// Generates a consistent cache key for OAuth token resolution
export function generateOAuthCacheKey(token: string): string {
  return `oauth-token-${token.slice(-8)}`;
}

// Create a configured OAuth token fetcher
export function createOAuthTokenFetcher(config: OAuthTokenFetcherConfig) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Fetcher function for OAuth token resolution
  return async function fetchOAuthToken(token: string): Promise<OIDCClaims> {
const response = await fetch(
  `${finalConfig.apiBaseUrl}/api/oauth/resolve`,
  {
method: 'POST',
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
},
  },
);

if (!response.ok) {
  const errorType =
response.status === 401 ? 'invalid_token' : 'resolution_failed';
  throw new Error(
`OAuth token resolution failed: ${response.status} - ${errorType}`,
  );
}

const result = (await response.json()) as ApiResponse<{
  claims: OIDCClaims;
}>;

if (!result.success || !result.data?.claims) {
  throw new Error(
`Invalid OAuth response format: ${JSON.stringify(result)}`,
  );
}

return result.data.claims;
  };
}

// Direct fetcher function for OAuth token resolution
export async function fetchOAuthToken(
  token: string,
  apiBaseUrl: string,
): Promise<OIDCClaims> {
  const fetcher = createOAuthTokenFetcher({ apiBaseUrl });
  return fetcher(token);
}
