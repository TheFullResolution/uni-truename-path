// TrueNamePath: Route Security Classification System Tests
// Comprehensive test suite validating GDPR-compliant header isolation
// Date: August 23, 2025
// Academic project test infrastructure

import { describe, it, expect } from 'vitest';
import {
  classifyRoute,
  isOAuthPublicRoute,
  isInternalAppRoute,
  isPublicRoute,
  getAllowedHeadersForRoute,
  isHeaderAllowedForRoute,
  validateRouteClassification,
  RouteSecurityLevel,
  OAUTH_SAFE_HEADERS,
  SENSITIVE_HEADERS,
  INTERNAL_APP_HEADERS,
} from '../route-security-classifier';

describe('Route Security Classification System', () => {
  describe('OAuth Public Route Classification', () => {
const oauthRoutes = [
  '/api/oauth/apps/demo-hr',
  '/api/oauth/authorize',
  '/api/oauth/resolve',
  '/api/oauth/sessions/123',
];

it('should classify OAuth routes as OAUTH_PUBLIC', () => {
  oauthRoutes.forEach((route) => {
expect(classifyRoute(route)).toBe(RouteSecurityLevel.OAUTH_PUBLIC);
expect(isOAuthPublicRoute(route)).toBe(true);
expect(isInternalAppRoute(route)).toBe(false);
expect(isPublicRoute(route)).toBe(false);
  });
});

it('should only allow safe headers for OAuth routes', () => {
  oauthRoutes.forEach((route) => {
const allowedHeaders = getAllowedHeadersForRoute(route);

// Should contain all OAuth safe headers
OAUTH_SAFE_HEADERS.forEach((header) => {
  expect(allowedHeaders).toContain(header);
  expect(isHeaderAllowedForRoute(header, route)).toBe(true);
});

// Should NOT contain sensitive headers
SENSITIVE_HEADERS.forEach((header) => {
  expect(allowedHeaders).not.toContain(header);
  expect(isHeaderAllowedForRoute(header, route)).toBe(false);
});
  });
});

it('should prevent GDPR violations on OAuth routes', () => {
  const route = '/api/oauth/resolve';

  // Critical GDPR compliance tests
  expect(isHeaderAllowedForRoute('x-authenticated-user-email', route)).toBe(
false,
  );
  expect(
isHeaderAllowedForRoute('x-authenticated-user-profile', route),
  ).toBe(false);

  // Should still allow essential OAuth headers
  expect(isHeaderAllowedForRoute('x-oauth-session-id', route)).toBe(true);
  expect(isHeaderAllowedForRoute('x-oauth-client-id', route)).toBe(true);
});
  });

  describe('Internal App Route Classification', () => {
const internalRoutes = [
  '/api/names',
  '/api/names/123',
  '/api/contexts',
  '/api/contexts/456',
  '/api/assignments',
  '/api/assignments/oidc',
  '/api/consents',
  '/api/dashboard/stats',
  '/api/audit',
];

it('should classify internal routes as INTERNAL_APP', () => {
  internalRoutes.forEach((route) => {
expect(classifyRoute(route)).toBe(RouteSecurityLevel.INTERNAL_APP);
expect(isInternalAppRoute(route)).toBe(true);
expect(isOAuthPublicRoute(route)).toBe(false);
expect(isPublicRoute(route)).toBe(false);
  });
});

it('should allow all headers for internal app routes', () => {
  internalRoutes.forEach((route) => {
const allowedHeaders = getAllowedHeadersForRoute(route);

// Should contain all headers including sensitive ones
INTERNAL_APP_HEADERS.forEach((header) => {
  expect(allowedHeaders).toContain(header);
  expect(isHeaderAllowedForRoute(header, route)).toBe(true);
});
  });
});

it('should allow sensitive data for dashboard optimization', () => {
  const route = '/api/dashboard/stats';

  // Internal routes should have access to all user data
  expect(isHeaderAllowedForRoute('x-authenticated-user-email', route)).toBe(
true,
  );
  expect(
isHeaderAllowedForRoute('x-authenticated-user-profile', route),
  ).toBe(true);
});
  });

  describe('Public Route Classification', () => {
const publicRoutes = ['/api/auth/login', '/api/auth/signup'];

it('should classify auth routes as PUBLIC', () => {
  publicRoutes.forEach((route) => {
expect(classifyRoute(route)).toBe(RouteSecurityLevel.PUBLIC);
expect(isPublicRoute(route)).toBe(true);
expect(isOAuthPublicRoute(route)).toBe(false);
expect(isInternalAppRoute(route)).toBe(false);
  });
});

it('should allow no headers for public routes', () => {
  publicRoutes.forEach((route) => {
const allowedHeaders = getAllowedHeadersForRoute(route);

// Public routes should have no authentication headers
expect(allowedHeaders).toHaveLength(0);

// Test some specific headers
expect(isHeaderAllowedForRoute('x-authenticated-user-id', route)).toBe(
  false,
);
expect(
  isHeaderAllowedForRoute('x-authenticated-user-email', route),
).toBe(false);
expect(isHeaderAllowedForRoute('x-oauth-session-id', route)).toBe(
  false,
);
  });
});
  });

  describe('OAuth Route Handling', () => {
const oauthRoute = '/api/oauth/resolve';

it('should classify /api/oauth/resolve as OAUTH_PUBLIC for security', () => {
  // OAuth routes are always OAUTH_PUBLIC for security (minimal data exposure)
  expect(classifyRoute(oauthRoute)).toBe(RouteSecurityLevel.OAUTH_PUBLIC);
  expect(classifyRoute(oauthRoute)).toBe(RouteSecurityLevel.OAUTH_PUBLIC);
  expect(isOAuthPublicRoute(oauthRoute)).toBe(true);
});

it('should provide minimal safe headers for OAuth routes', () => {
  // OAuth routes get safe headers regardless of auth status (for security)
  const headers = getAllowedHeadersForRoute(oauthRoute);
  expect(headers).toEqual([
'x-authentication-verified',
'x-authenticated-user-id',
'x-oauth-authenticated',
'x-oauth-session-id',
'x-oauth-client-id',
  ]);
});
  });

  describe('Route Classification Validation', () => {
const allKnownRoutes = [
  // OAuth routes
  '/api/oauth/apps/demo-hr',
  '/api/oauth/authorize',
  '/api/oauth/resolve',
  '/api/oauth/sessions/123',

  // Internal routes
  '/api/names',
  '/api/names/123',
  '/api/contexts',
  '/api/contexts/456',
  '/api/assignments',
  '/api/assignments/oidc',
  '/api/consents',
  '/api/dashboard/stats',
  '/api/audit',

  // Public routes
  '/api/auth/login',
];

it('should validate all known routes are classified', () => {
  const validation = validateRouteClassification(allKnownRoutes);

  expect(validation.classified).toHaveLength(allKnownRoutes.length);
  expect(validation.unclassified).toHaveLength(0);
  expect(validation.classified).toEqual(
expect.arrayContaining(allKnownRoutes),
  );
});

it('should handle unknown API routes with safe defaults', () => {
  const unknownRoute = '/api/unknown/endpoint';

  // Unknown routes should default to internal app (safe fallback)
  expect(classifyRoute(unknownRoute)).toBe(RouteSecurityLevel.INTERNAL_APP);

  // Validation should warn about default classification
  const validation = validateRouteClassification([unknownRoute]);
  expect(validation.warnings.length).toBeGreaterThan(0);
  expect(validation.warnings[0]).toContain(
'Route classified as INTERNAL_APP by default',
  );
});

it('should handle non-API routes', () => {
  const nonApiRoutes = ['/dashboard', '/login', '/'];

  nonApiRoutes.forEach((route) => {
expect(classifyRoute(route)).toBe(RouteSecurityLevel.PUBLIC);
  });

  const validation = validateRouteClassification(nonApiRoutes);
  expect(validation.warnings).toEqual(
expect.arrayContaining([
  expect.stringContaining('Non-API route found'),
]),
  );
});
  });

  describe('Security Compliance Tests', () => {
it('should prevent email header exposure to OAuth routes', () => {
  const oauthRoutes = [
'/api/oauth/authorize',
'/api/oauth/resolve',
'/api/oauth/apps/demo-hr',
  ];

  oauthRoutes.forEach((route) => {
expect(
  isHeaderAllowedForRoute('x-authenticated-user-email', route),
).toBe(false);
  });
});

it('should prevent profile header exposure to OAuth routes', () => {
  const oauthRoutes = [
'/api/oauth/authorize',
'/api/oauth/resolve',
'/api/oauth/apps/demo-hr',
  ];

  oauthRoutes.forEach((route) => {
expect(
  isHeaderAllowedForRoute('x-authenticated-user-profile', route),
).toBe(false);
  });
});

it('should allow user ID for OAuth routes (required for functionality)', () => {
  const oauthRoutes = ['/api/oauth/authorize', '/api/oauth/resolve'];

  oauthRoutes.forEach((route) => {
expect(isHeaderAllowedForRoute('x-authenticated-user-id', route)).toBe(
  true,
);
  });
});

it('should maintain full access for internal routes', () => {
  const internalRoutes = [
'/api/names',
'/api/contexts',
'/api/dashboard/stats',
  ];

  internalRoutes.forEach((route) => {
// Internal routes should have access to all data
expect(
  isHeaderAllowedForRoute('x-authenticated-user-email', route),
).toBe(true);
expect(
  isHeaderAllowedForRoute('x-authenticated-user-profile', route),
).toBe(true);
expect(isHeaderAllowedForRoute('x-authenticated-user-id', route)).toBe(
  true,
);
  });
});

it('should have zero header exposure for public routes', () => {
  const publicRoutes = ['/api/auth/login'];

  publicRoutes.forEach((route) => {
const allowedHeaders = getAllowedHeadersForRoute(route);
expect(allowedHeaders).toHaveLength(0);

// Test all possible headers should be blocked
[...OAUTH_SAFE_HEADERS, ...SENSITIVE_HEADERS].forEach((header) => {
  expect(isHeaderAllowedForRoute(header, route)).toBe(false);
});
  });
});
  });

  describe('Performance and Edge Cases', () => {
it('should handle empty and invalid routes gracefully', () => {
  expect(classifyRoute('')).toBe(RouteSecurityLevel.PUBLIC);
  expect(classifyRoute('/')).toBe(RouteSecurityLevel.PUBLIC);
  expect(classifyRoute('/not-api')).toBe(RouteSecurityLevel.PUBLIC);
});

it('should be case sensitive for route patterns', () => {
  // API routes are lowercase by convention
  expect(classifyRoute('/API/oauth/resolve')).toBe(
RouteSecurityLevel.PUBLIC,
  );
  expect(classifyRoute('/api/OAUTH/resolve')).toBe(
RouteSecurityLevel.INTERNAL_APP,
  );
});

it('should handle routes with query parameters and fragments', () => {
  const baseRoute = '/api/oauth/resolve';
  const routeWithQuery = '/api/oauth/resolve?token=abc123';
  const routeWithFragment = '/api/oauth/resolve#section';

  // Classification should be based on pathname only
  expect(classifyRoute(baseRoute)).toBe(RouteSecurityLevel.OAUTH_PUBLIC);
  expect(classifyRoute(routeWithQuery)).toBe(
RouteSecurityLevel.OAUTH_PUBLIC,
  );
  expect(classifyRoute(routeWithFragment)).toBe(
RouteSecurityLevel.OAUTH_PUBLIC,
  );
});

it('should classify routes consistently', () => {
  const route = '/api/oauth/resolve';
  const iterations = 1000;

  // Multiple classifications should be consistent
  for (let i = 0; i < iterations; i++) {
expect(classifyRoute(route)).toBe(RouteSecurityLevel.OAUTH_PUBLIC);
  }
});
  });
});
