/**
 * OAuth Token Fetcher Utility
 *
 * Centralized fetching logic for OAuth token resolution.
 * This utility provides a clean, focused function for SWR to use
 * without additional complexity.
 */

import type { OIDCClaims, ApiResponse } from '@uni-final/truename-oauth';
import { TRUENAME_API, isDevelopment } from '@/config';

/**
 * Generates a consistent cache key for OAuth token resolution
 * Uses last 8 characters of token for uniqueness while maintaining privacy
 */
export function generateOAuthCacheKey(token: string): string {
  return `oauth-token-${token.slice(-8)}`;
}

/**
 * Fetcher function for OAuth token resolution
 * Designed for use with SWR hooks
 *
 * @param token - OAuth Bearer token to resolve
 * @returns Promise<OIDCClaims> - Resolved OIDC claims from token
 * @throws Error - If token resolution fails
 */
export async function fetchOAuthToken(token: string): Promise<OIDCClaims> {
  const apiBaseUrl = isDevelopment
? TRUENAME_API.BASE_URL.DEV
: TRUENAME_API.BASE_URL.PROD;

  const response = await fetch(`${apiBaseUrl}/api/oauth/resolve`, {
method: 'POST',
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
},
  });

  if (!response.ok) {
const errorType =
  response.status === 401 ? 'invalid_token' : 'resolution_failed';
throw new Error(
  `OAuth token resolution failed: ${response.status} - ${errorType}`,
);
  }

  const result = (await response.json()) as ApiResponse<{ claims: OIDCClaims }>;

  if (!result.success || !result.data?.claims) {
throw new Error(`Invalid OAuth response format: ${JSON.stringify(result)}`);
  }

  return result.data.claims;
}
