// TrueNamePath: Middleware Security Test Suite
// GDPR-compliant header isolation system validation
// Date: August 23, 2025
// Academic project security infrastructure tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  classifyRoute,
  getAllowedHeadersForRoute,
  isHeaderAllowedForRoute,
  RouteSecurityLevel,
  OAUTH_SAFE_HEADERS,
  SENSITIVE_HEADERS,
  INTERNAL_APP_HEADERS,
} from '../route-security-classifier';
import { setAuthHeaders } from '../../supabase/middleware';

describe('Middleware Security: GDPR Header Isolation', () => {
  describe('OAuth Route Header Security', () => {
const oauthRoutes = [
  '/api/oauth/apps/demo-hr',
  '/api/oauth/apps/demo-chat',
  '/api/oauth/authorize',
  '/api/oauth/resolve',
  '/api/oauth/sessions/abc123',
];

it('should block all sensitive headers from OAuth routes', () => {
  oauthRoutes.forEach((route) => {
SENSITIVE_HEADERS.forEach((sensitiveHeader) => {
  expect(isHeaderAllowedForRoute(sensitiveHeader, route)).toBe(false);
});
  });
});

it('should allow only OAuth-safe headers for OAuth routes', () => {
  oauthRoutes.forEach((route) => {
const allowedHeaders = getAllowedHeadersForRoute(route);

// Should contain ONLY OAuth safe headers
expect(allowedHeaders).toEqual(OAUTH_SAFE_HEADERS);

// Verify each OAuth safe header is allowed
OAUTH_SAFE_HEADERS.forEach((safeHeader) => {
  expect(isHeaderAllowedForRoute(safeHeader, route)).toBe(true);
});
  });
});

it('should prevent GDPR violations - no email exposure', () => {
  oauthRoutes.forEach((route) => {
expect(
  isHeaderAllowedForRoute('x-authenticated-user-email', route),
).toBe(false);
  });
});

it('should prevent GDPR violations - no profile exposure', () => {
  oauthRoutes.forEach((route) => {
expect(
  isHeaderAllowedForRoute('x-authenticated-user-profile', route),
).toBe(false);
  });
});

it('should allow minimal user identification for OAuth functionality', () => {
  oauthRoutes.forEach((route) => {
// OAuth routes need user ID for context resolution
expect(isHeaderAllowedForRoute('x-authenticated-user-id', route)).toBe(
  true,
);

// OAuth session tracking
expect(isHeaderAllowedForRoute('x-oauth-session-id', route)).toBe(true);
expect(isHeaderAllowedForRoute('x-oauth-client-id', route)).toBe(true);
  });
});

it('should classify OAuth routes with highest security priority', () => {
  oauthRoutes.forEach((route) => {
expect(classifyRoute(route)).toBe(RouteSecurityLevel.OAUTH_PUBLIC);
  });
});
  });

  describe('Internal App Route Header Security', () => {
const internalRoutes = [
  '/api/names',
  '/api/names/123e4567-e89b-12d3-a456-426614174000',
  '/api/contexts',
  '/api/contexts/456',
  '/api/assignments',
  '/api/assignments/oidc',
  '/api/consents',
  '/api/dashboard/stats',
];

it('should allow all headers for authenticated internal routes', () => {
  internalRoutes.forEach((route) => {
const allowedHeaders = getAllowedHeadersForRoute(route, true);

// Should contain all internal app headers
expect(allowedHeaders).toEqual(INTERNAL_APP_HEADERS);

// All headers should be allowed
INTERNAL_APP_HEADERS.forEach((header) => {
  expect(isHeaderAllowedForRoute(header, route, true)).toBe(true);
});
  });
});

it('should allow sensitive data for internal functionality', () => {
  internalRoutes.forEach((route) => {
// Internal routes need full access for dashboard and management
expect(
  isHeaderAllowedForRoute('x-authenticated-user-email', route, true),
).toBe(true);
expect(
  isHeaderAllowedForRoute('x-authenticated-user-profile', route, true),
).toBe(true);
expect(
  isHeaderAllowedForRoute('x-authenticated-user-id', route, true),
).toBe(true);
  });
});

it('should classify authenticated internal routes correctly', () => {
  internalRoutes.forEach((route) => {
expect(classifyRoute(route, true)).toBe(
  RouteSecurityLevel.INTERNAL_APP,
);
  });
});
  });

  describe('Public Route Header Security', () => {
const publicRoutes = ['/api/auth/login', '/api/auth/signup'];

it('should block all authentication headers from public routes', () => {
  publicRoutes.forEach((route) => {
const allowedHeaders = getAllowedHeadersForRoute(route);

// Public routes should have no authentication headers
expect(allowedHeaders).toHaveLength(0);
  });
});

it('should prevent any user data exposure on public routes', () => {
  publicRoutes.forEach((route) => {
// Test all possible sensitive headers
[...OAUTH_SAFE_HEADERS, ...SENSITIVE_HEADERS].forEach((header) => {
  expect(isHeaderAllowedForRoute(header, route)).toBe(false);
});
  });
});

it('should classify public routes correctly', () => {
  publicRoutes.forEach((route) => {
expect(classifyRoute(route)).toBe(RouteSecurityLevel.PUBLIC);
  });
});
  });

  describe('Security Boundary Enforcement', () => {
it('should maintain strict boundaries between route types', () => {
  const testCases = [
{
  route: '/api/oauth/resolve',
  expected: RouteSecurityLevel.OAUTH_PUBLIC,
},
{ route: '/api/names', expected: RouteSecurityLevel.INTERNAL_APP },
{ route: '/api/auth/login', expected: RouteSecurityLevel.PUBLIC },
  ];

  testCases.forEach(({ route, expected }) => {
expect(classifyRoute(route)).toBe(expected);

const allowedHeaders = getAllowedHeadersForRoute(route);

switch (expected) {
  case RouteSecurityLevel.OAUTH_PUBLIC:
expect(allowedHeaders).toEqual(OAUTH_SAFE_HEADERS);
break;
  case RouteSecurityLevel.INTERNAL_APP:
expect(allowedHeaders).toEqual(INTERNAL_APP_HEADERS);
break;
  case RouteSecurityLevel.PUBLIC:
expect(allowedHeaders).toHaveLength(0);
break;
}
  });
});

it('should prevent cross-contamination between security levels', () => {
  // OAuth route should not get internal app headers
  const oauthRoute = '/api/oauth/resolve';
  const internalRoute = '/api/names';
  const publicRoute = '/api/auth/login';

  // OAuth headers != Internal headers
  expect(getAllowedHeadersForRoute(oauthRoute)).not.toEqual(
getAllowedHeadersForRoute(internalRoute, true),
  );

  // OAuth headers != Public headers (empty)
  expect(getAllowedHeadersForRoute(oauthRoute)).not.toEqual(
getAllowedHeadersForRoute(publicRoute),
  );

  // Internal headers != Public headers (empty)
  expect(getAllowedHeadersForRoute(internalRoute, true)).not.toEqual(
getAllowedHeadersForRoute(publicRoute),
  );
});
  });

  describe('Header Filtering Logic', () => {
it('should filter headers based on route classification', () => {
  const testHeaders = [
'x-authenticated-user-id',
'x-authenticated-user-email',
'x-authenticated-user-profile',
'x-oauth-session-id',
'x-oauth-client-id',
'x-authentication-verified',
  ];

  // OAuth route - should filter out email and profile
  const oauthRoute = '/api/oauth/resolve';
  testHeaders.forEach((header) => {
const shouldAllow = OAUTH_SAFE_HEADERS.includes(header);
expect(isHeaderAllowedForRoute(header, oauthRoute)).toBe(shouldAllow);
  });

  // Internal route - should allow all
  const internalRoute = '/api/names';
  testHeaders.forEach((header) => {
expect(isHeaderAllowedForRoute(header, internalRoute, true)).toBe(true);
  });

  // Public route - should allow none
  const publicRoute = '/api/auth/login';
  testHeaders.forEach((header) => {
expect(isHeaderAllowedForRoute(header, publicRoute)).toBe(false);
  });
});
  });

  describe('OAuth Route Cases', () => {
const oauthRoute = '/api/oauth/resolve';

it('should handle OAuth routes with minimal data exposure', () => {
  // OAuth routes are always OAUTH_PUBLIC for security
  expect(classifyRoute(oauthRoute)).toBe(RouteSecurityLevel.OAUTH_PUBLIC);

  // OAuth routes get minimal safe headers (privacy-by-design)
  expect(getAllowedHeadersForRoute(oauthRoute)).toEqual([
'x-authentication-verified',
'x-authenticated-user-id',
'x-oauth-authenticated',
'x-oauth-session-id',
'x-oauth-client-id',
  ]);
});

it('should maintain consistent OAuth security boundaries', () => {
  // OAuth routes maintain consistent minimal headers for security
  const headers = getAllowedHeadersForRoute(oauthRoute);

  // Should always be the same safe headers
  expect(headers).toEqual([
'x-authentication-verified',
'x-authenticated-user-id',
'x-oauth-authenticated',
'x-oauth-session-id',
'x-oauth-client-id',
  ]);

  // Should never contain sensitive data
  expect(headers).not.toContain('x-authenticated-user-email');
  expect(headers).not.toContain('x-authenticated-user-profile');
});
  });

  describe('Performance and Edge Cases', () => {
it('should handle malformed routes securely', () => {
  const malformedRoutes = [
'',
'/',
'/api',
'/api/',
'/api/oauth',
'/api/oauth/',
'not-a-route',
'/API/oauth/resolve', // Wrong case
  ];

  malformedRoutes.forEach((route) => {
// Should not throw errors
expect(() => classifyRoute(route)).not.toThrow();
expect(() => getAllowedHeadersForRoute(route)).not.toThrow();

// Should have safe defaults
const classification = classifyRoute(route);
expect(Object.values(RouteSecurityLevel)).toContain(classification);
  });
});

it('should be consistent across multiple invocations', () => {
  const testRoute = '/api/oauth/resolve';
  const iterations = 100;

  const firstResult = classifyRoute(testRoute);
  const firstHeaders = getAllowedHeadersForRoute(testRoute);

  for (let i = 0; i < iterations; i++) {
expect(classifyRoute(testRoute)).toBe(firstResult);
expect(getAllowedHeadersForRoute(testRoute)).toEqual(firstHeaders);
  }
});

it('should handle routes with query parameters and fragments', () => {
  const baseRoute = '/api/oauth/resolve';
  const routeWithQuery = '/api/oauth/resolve?token=test&app=hr';
  const routeWithFragment = '/api/oauth/resolve#section';
  const routeWithBoth = '/api/oauth/resolve?token=test#section';

  // All should be classified the same way
  const expectedClassification = RouteSecurityLevel.OAUTH_PUBLIC;
  const expectedHeaders = OAUTH_SAFE_HEADERS;

  [baseRoute, routeWithQuery, routeWithFragment, routeWithBoth].forEach(
(route) => {
  expect(classifyRoute(route)).toBe(expectedClassification);
  expect(getAllowedHeadersForRoute(route)).toEqual(expectedHeaders);
},
  );
});
  });

  describe('Audit and Compliance', () => {
it('should maintain audit trail of security decisions', () => {
  // This would typically integrate with audit logging
  // For now, ensure classification is deterministic for audit purposes

  const criticalRoutes = [
'/api/oauth/resolve',
'/api/names',
'/api/auth/login',
  ];

  criticalRoutes.forEach((route) => {
const classification = classifyRoute(route);
const headers = getAllowedHeadersForRoute(route);

// Each classification should be explainable and consistent
expect(classification).toBeDefined();
expect(headers).toBeDefined();
expect(Array.isArray(headers)).toBe(true);
  });
});

it('should enforce principle of least privilege', () => {
  // OAuth routes should have minimal headers
  const oauthHeaders = getAllowedHeadersForRoute('/api/oauth/resolve');
  expect(oauthHeaders.length).toBeLessThan(INTERNAL_APP_HEADERS.length);

  // Public routes should have no headers
  const publicHeaders = getAllowedHeadersForRoute('/api/auth/login');
  expect(publicHeaders).toHaveLength(0);

  // Internal routes can have all headers
  const internalHeaders = getAllowedHeadersForRoute('/api/names', true);
  expect(internalHeaders).toEqual(INTERNAL_APP_HEADERS);
});
  });
});
