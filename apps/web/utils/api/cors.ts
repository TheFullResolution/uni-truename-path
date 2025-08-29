/**
 * Centralized CORS configuration for OAuth routes
 * Supports both development and production deployments
 *
 * University Final Project - TrueNamePath
 * Date: August 27, 2025
 *
 * Features:
 * - OAuth-specific CORS headers with wildcard origin
 * - Standard preflight response creation
 * - Consistent header application across all OAuth endpoints
 * - Academic-compliant code organization
 */

// HeadersInit is a global type, no import needed

/**
 * OAuth-specific CORS configuration
 * Uses wildcard origin to support demo applications from any domain
 * Follows existing codebase patterns from /api/consents
 */
export const OAUTH_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
'Content-Type, Authorization, Origin, Referer',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false',
} as const;

/**
 * Creates standardized CORS OPTIONS response
 * Used for preflight requests across all OAuth endpoints
 *
 * @param allowedMethods - HTTP methods allowed for this specific endpoint
 * @returns Response object with proper CORS headers and status 200
 */
export function createCORSOptionsResponse(allowedMethods: string): Response {
  return new Response(null, {
status: 200,
headers: {
  'Allow': allowedMethods,
  ...OAUTH_CORS_HEADERS,
  'Access-Control-Allow-Methods': allowedMethods,
},
  });
}

/**
 * Applies CORS headers to existing headers object
 * Used to add CORS headers to actual API responses
 *
 * @param headers - Existing headers to merge with CORS headers
 * @returns Combined headers object with CORS support
 */
export function withCORSHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  return {
...headers,
'Access-Control-Allow-Origin': '*',
  };
}
