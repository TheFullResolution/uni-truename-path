/**
 * OAuth Token Fetcher Utility
 *
 * Centralized fetching logic for OAuth token resolution.
 * This utility provides a clean, focused function for SWR to use
 * without additional complexity.
 */

import type { OIDCClaims, ApiResponse } from '../types.js';

/**
 * Configuration for OAuth token fetching
 */
export interface OAuthTokenFetcherConfig {
  /** Base URL for the TrueNamePath API */
  apiBaseUrl: string;
  /** Development mode flag (optional, defaults to false) */
  isDevelopment?: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<OAuthTokenFetcherConfig> = {
  isDevelopment: false,
};

/**
 * Generates a consistent cache key for OAuth token resolution
 * Uses last 8 characters of token for uniqueness while maintaining privacy
 */
export function generateOAuthCacheKey(token: string): string {
  return `oauth-token-${token.slice(-8)}`;
}

/**
 * Create a configured OAuth token fetcher
 *
 * @param config - Configuration for API base URL and environment
 * @returns Configured fetcher function for use with SWR
 */
export function createOAuthTokenFetcher(config: OAuthTokenFetcherConfig) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  /**
   * Fetcher function for OAuth token resolution
   * Designed for use with SWR hooks
   *
   * @param token - OAuth Bearer token to resolve
   * @returns Promise<OIDCClaims> - Resolved OIDC claims from token
   * @throws Error - If token resolution fails
   */
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

/**
 * Direct fetcher function for OAuth token resolution
 * Requires explicit API base URL configuration
 *
 * @param token - OAuth Bearer token to resolve
 * @param apiBaseUrl - Base URL for the TrueNamePath API
 * @returns Promise<OIDCClaims> - Resolved OIDC claims from token
 * @throws Error - If token resolution fails
 */
export async function fetchOAuthToken(
  token: string,
  apiBaseUrl: string,
): Promise<OIDCClaims> {
  const fetcher = createOAuthTokenFetcher({ apiBaseUrl });
  return fetcher(token);
}
