// TrueNamePath: Route-Aware Security Classification System
// Classification system for implementing secure header isolation across API routes
// Date: August 23, 2025
// Academic project infrastructure for GDPR-compliant OAuth integration

/**
 * Security classification levels for API routes
 * Determines which authentication headers are safe to expose
 */
export enum RouteSecurityLevel {
  /**
   * OAuth Public Routes (/api/oauth/*)
   * - External API consumption by demo apps
   * - Minimal headers only (session ID, app ID)
   * - NO personal data (email, profile) - GDPR compliance
   */
  OAUTH_PUBLIC = 'OAUTH_PUBLIC',

  /**
   * Internal App Routes (dashboard, management APIs)
   * - Internal dashboard and app functionality
   * - Full headers including email/profile for optimization
   * - Safe for authenticated internal users
   */
  INTERNAL_APP = 'INTERNAL_APP',

  /**
   * Public/Unauthenticated Routes
   * - No authentication required
   * - No auth headers exposed
   * - Public access endpoints
   */
  PUBLIC = 'PUBLIC',
}

/**
 * Route patterns for OAuth public endpoints
 * These routes serve external applications and must minimize data exposure
 */
const OAUTH_ROUTE_PATTERNS = ['/api/oauth/'] as const;

/**
 * Route patterns for internal application endpoints
 * These routes serve the TrueNamePath dashboard and internal functionality
 */
const INTERNAL_APP_ROUTE_PATTERNS = [
  '/api/names/',
  '/api/contexts/',
  '/api/assignments/',
  '/api/consents/',
  '/api/dashboard/',
  '/api/audit/',
] as const;

/**
 * Route patterns for public/unauthenticated endpoints
 * These routes don't require authentication
 */
const PUBLIC_ROUTE_PATTERNS = ['/api/auth/'] as const;

/**
 * Headers that are safe for OAuth public routes
 * CRITICAL: These headers contain NO personal identifying information
 */
export const OAUTH_SAFE_HEADERS = [
  'x-authentication-verified',
  'x-authenticated-user-id',
  'x-oauth-authenticated',
  'x-oauth-session-id',
  'x-oauth-app-id',
] as const;

/**
 * Headers that contain sensitive personal information
 * These should NEVER be exposed to OAuth public routes
 */
export const SENSITIVE_HEADERS = [
  'x-authenticated-user-email',
  'x-authenticated-user-profile',
] as const;

/**
 * All internal app headers (includes sensitive data)
 * Used for internal dashboard routes where user profile optimization is beneficial
 */
export const INTERNAL_APP_HEADERS = [
  ...OAUTH_SAFE_HEADERS,
  ...SENSITIVE_HEADERS,
] as const;

/**
 * Classify a route path into its appropriate security level
 *
 * @param pathname - The API route pathname (e.g., "/api/oauth/resolve")
 * @returns The security classification for the route
 */
export function classifyRoute(pathname: string): RouteSecurityLevel {
  // Check OAuth routes (highest priority for security)
  if (OAUTH_ROUTE_PATTERNS.some((pattern) => pathname.startsWith(pattern))) {
return RouteSecurityLevel.OAUTH_PUBLIC;
  }

  // Check internal app routes
  if (
INTERNAL_APP_ROUTE_PATTERNS.some((pattern) => pathname.startsWith(pattern))
  ) {
return RouteSecurityLevel.INTERNAL_APP;
  }

  // Check public routes
  if (PUBLIC_ROUTE_PATTERNS.some((pattern) => pathname.startsWith(pattern))) {
return RouteSecurityLevel.PUBLIC;
  }

  // Default to internal app for unknown API routes (safe fallback)
  if (pathname.startsWith('/api/')) {
return RouteSecurityLevel.INTERNAL_APP;
  }

  // Non-API routes default to public
  return RouteSecurityLevel.PUBLIC;
}

/**
 * Check if a route is an OAuth public route
 * These routes require minimal header exposure for GDPR compliance
 *
 * @param pathname - The API route pathname
 * @returns True if this is an OAuth public route
 */
export function isOAuthPublicRoute(pathname: string): boolean {
  return classifyRoute(pathname) === RouteSecurityLevel.OAUTH_PUBLIC;
}

/**
 * Check if a route is an internal app route
 * These routes can include full headers for optimization
 *
 * @param pathname - The API route pathname
 * @returns True if this is an internal app route
 */
export function isInternalAppRoute(pathname: string): boolean {
  return classifyRoute(pathname) === RouteSecurityLevel.INTERNAL_APP;
}

/**
 * Check if a route is a public route
 * These routes should have no authentication headers
 *
 * @param pathname - The API route pathname
 * @returns True if this is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  return classifyRoute(pathname) === RouteSecurityLevel.PUBLIC;
}

/**
 * Get the appropriate headers for a route based on its security classification
 *
 * @param pathname - The API route pathname
 * @returns Array of header names that are safe to expose for this route
 */
export function getAllowedHeadersForRoute(pathname: string): readonly string[] {
  const securityLevel = classifyRoute(pathname);

  switch (securityLevel) {
case RouteSecurityLevel.OAUTH_PUBLIC:
  return OAUTH_SAFE_HEADERS;
case RouteSecurityLevel.INTERNAL_APP:
  return INTERNAL_APP_HEADERS;
case RouteSecurityLevel.PUBLIC:
  return []; // No headers for public routes
default:
  // Safe fallback - minimal headers
  return OAUTH_SAFE_HEADERS;
  }
}

/**
 * Check if a specific header is allowed for a route
 *
 * @param headerName - The header name to check
 * @param pathname - The API route pathname
 * @returns True if the header is safe to expose for this route
 */
export function isHeaderAllowedForRoute(
  headerName: string,
  pathname: string,
): boolean {
  const allowedHeaders = getAllowedHeadersForRoute(pathname);
  return allowedHeaders.includes(headerName);
}

/**
 * Get security documentation for a route classification
 * Used for debugging and audit purposes
 *
 * @param securityLevel - The security classification level
 * @returns Human-readable security documentation
 */
export function getSecurityDocumentation(securityLevel: RouteSecurityLevel): {
  purpose: string;
  allowedHeaders: readonly string[];
  restrictions: string[];
  rationale: string;
} {
  switch (securityLevel) {
case RouteSecurityLevel.OAUTH_PUBLIC:
  return {
purpose: 'External API consumption by demo applications',
allowedHeaders: OAUTH_SAFE_HEADERS,
restrictions: [
  'NO personal data (email, profile)',
  'Only session ID and app ID',
  'GDPR compliance required',
],
rationale:
  'OAuth Bearer tokens should only access context-appropriate data through proper resolution endpoints',
  };

case RouteSecurityLevel.INTERNAL_APP:
  return {
purpose: 'Internal dashboard and application functionality',
allowedHeaders: INTERNAL_APP_HEADERS,
restrictions: [
  'Full headers allowed including sensitive data',
  'User profile optimization enabled',
],
rationale:
  'Internal routes benefit from user profile data and email exposure is acceptable for authenticated dashboard users',
  };

case RouteSecurityLevel.PUBLIC:
  return {
purpose: 'Public access or authentication flows',
allowedHeaders: [],
restrictions: ['No authentication headers', 'No user data exposure'],
rationale: 'Public endpoints must not expose any user data',
  };

default:
  return {
purpose: 'Unknown route classification',
allowedHeaders: OAUTH_SAFE_HEADERS,
restrictions: ['Safe fallback with minimal headers'],
rationale: 'Default to secure minimal header exposure',
  };
  }
}

/**
 * Validate that the route classification system covers all existing API routes
 * Used for testing and validation
 *
 * @param knownRoutes - Array of known API routes in the system
 * @returns Validation results with any unclassified routes
 */
export function validateRouteClassification(knownRoutes: string[]): {
  classified: string[];
  unclassified: string[];
  warnings: string[];
} {
  const classified: string[] = [];
  const unclassified: string[] = [];
  const warnings: string[] = [];

  for (const route of knownRoutes) {
if (!route.startsWith('/api/')) {
  warnings.push(`Non-API route found: ${route}`);
  continue;
}

const classification = classifyRoute(route);
if (
  classification === RouteSecurityLevel.INTERNAL_APP &&
  !INTERNAL_APP_ROUTE_PATTERNS.some((pattern) => route.startsWith(pattern))
) {
  warnings.push(`Route classified as INTERNAL_APP by default: ${route}`);
}

classified.push(route);
  }

  return {
classified,
unclassified,
warnings,
  };
}

/**
 * Type definitions for route classification results
 */
export type RouteClassification = {
  route: string;
  securityLevel: RouteSecurityLevel;
  allowedHeaders: readonly string[];
  isAuthenticated: boolean;
};

/**
 * Classify multiple routes at once
 * Useful for batch processing and system validation
 *
 * @param routes - Array of route objects with pathname and authentication status
 * @returns Array of classification results
 */
export function classifyRoutes(
  routes: Array<{ pathname: string; isAuthenticated: boolean }>,
): RouteClassification[] {
  return routes.map(({ pathname, isAuthenticated }) => ({
route: pathname,
securityLevel: classifyRoute(pathname),
allowedHeaders: getAllowedHeadersForRoute(pathname),
isAuthenticated,
  }));
}
