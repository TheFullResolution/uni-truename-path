// Route Security Classification System

export enum RouteSecurityLevel {
  OAUTH_PUBLIC = 'OAUTH_PUBLIC',
  INTERNAL_APP = 'INTERNAL_APP',
  PUBLIC = 'PUBLIC',
}

const OAUTH_ROUTE_PATTERNS = ['/api/oauth/'] as const;
const OAUTH_INTERNAL_ROUTES = [] as const;

const INTERNAL_APP_ROUTE_PATTERNS = [
  '/api/names/',
  '/api/contexts/',
  '/api/assignments/',
  '/api/consents/',
  '/api/dashboard/',
] as const;

const PUBLIC_ROUTE_PATTERNS = ['/api/auth/'] as const;

export const OAUTH_SAFE_HEADERS = [
  'x-authentication-verified',
  'x-authenticated-user-id',
  'x-oauth-authenticated',
  'x-oauth-session-id',
  'x-oauth-client-id',
] as const;

export const SENSITIVE_HEADERS = [
  'x-authenticated-user-email',
  'x-authenticated-user-profile',
] as const;

export const INTERNAL_APP_HEADERS = [
  ...OAUTH_SAFE_HEADERS,
  ...SENSITIVE_HEADERS,
] as const;

export function classifyRoute(pathname: string): RouteSecurityLevel {
  if (OAUTH_INTERNAL_ROUTES.some((route) => pathname === route)) {
return RouteSecurityLevel.INTERNAL_APP;
  }

  if (OAUTH_ROUTE_PATTERNS.some((pattern) => pathname.startsWith(pattern))) {
return RouteSecurityLevel.OAUTH_PUBLIC;
  }

  if (
INTERNAL_APP_ROUTE_PATTERNS.some((pattern) => pathname.startsWith(pattern))
  ) {
return RouteSecurityLevel.INTERNAL_APP;
  }

  if (PUBLIC_ROUTE_PATTERNS.some((pattern) => pathname.startsWith(pattern))) {
return RouteSecurityLevel.PUBLIC;
  }

  if (pathname.startsWith('/api/')) {
return RouteSecurityLevel.INTERNAL_APP;
  }

  return RouteSecurityLevel.PUBLIC;
}

export function isOAuthPublicRoute(pathname: string): boolean {
  return classifyRoute(pathname) === RouteSecurityLevel.OAUTH_PUBLIC;
}

export function isInternalAppRoute(pathname: string): boolean {
  return classifyRoute(pathname) === RouteSecurityLevel.INTERNAL_APP;
}

export function isPublicRoute(pathname: string): boolean {
  return classifyRoute(pathname) === RouteSecurityLevel.PUBLIC;
}
export function getAllowedHeadersForRoute(pathname: string): readonly string[] {
  const securityLevel = classifyRoute(pathname);

  switch (securityLevel) {
case RouteSecurityLevel.OAUTH_PUBLIC:
  return OAUTH_SAFE_HEADERS;
case RouteSecurityLevel.INTERNAL_APP:
  return INTERNAL_APP_HEADERS;
case RouteSecurityLevel.PUBLIC:
  return [];
default:
  return OAUTH_SAFE_HEADERS;
  }
}

export function isHeaderAllowedForRoute(
  headerName: string,
  pathname: string,
): boolean {
  const allowedHeaders = getAllowedHeadersForRoute(pathname);
  return allowedHeaders.includes(headerName);
}

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
