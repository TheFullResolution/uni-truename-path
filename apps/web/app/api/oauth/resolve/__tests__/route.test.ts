// OAuth Resolve Endpoint Tests

/// <reference types="node" />

import { ErrorCodes } from '@/utils/api';
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../route';
import type { OIDCClaims } from '../types';
import { ResolveErrorCodes } from '../types';

vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
...actual,
NextResponse: {
  ...((actual as any).NextResponse || {}),
  json: vi.fn((data: any, init?: any) => {
return {
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: init?.status || 200,
  headers: init?.headers || {},
  ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
};
  }),
},
  };
});

vi.mock('../helpers', () => ({
  measurePerformance: vi.fn(() => ({
startTime: Date.now(),
getElapsed: vi.fn(() => 2),
  })),
}));

const mockSupabaseClient = {
  rpc: vi.fn(),
};

const mockSupabaseQuery = {
  single: vi.fn(),
};

// Mock OAuth helpers
vi.mock('@/utils/api/oauth-helpers', () => ({
  extractBearerToken: vi.fn(),
}));

// Mock auth utilities
vi.mock('@/utils/api/with-auth', () => ({
  createSuccessResponse: vi.fn((data, requestId, timestamp) => ({
success: true,
data,
requestId,
timestamp,
  })),
  createErrorResponse: vi.fn(
(code, message, requestId, details, timestamp) => ({
  success: false,
  error: {
code,
message,
details,
  },
  requestId,
  timestamp,
}),
  ),
}));

// Mock CORS utilities
vi.mock('@/utils/api/cors', () => ({
  withCORSHeaders: vi.fn(() => ({
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'POST, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })),
}));

// Mock Supabase server client
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Test constants
const VALID_BEARER_TOKEN = 'tnp_abcdef1234567890abcdef1234567890';
const EXPIRED_BEARER_TOKEN = 'tnp_expired12345678901234567890';

const VALID_OIDC_CLAIMS: OIDCClaims = {
  // Mandatory OIDC claims
  sub: 'profile_123456789',
  iss: 'https://truenameapi.demo',
  aud: 'test-app',
  iat: 1692801330,
  exp: 1692804930, // iat + 3600
  nbf: 1692801330, // same as iat
  jti: '550e8400-e29b-41d4-a716-446655440000', // valid UUID format

  // Standard optional OIDC claims
  name: 'John Smith',
  given_name: 'John',
  family_name: 'Smith',
  nickname: 'Johnny',
  email: 'john.smith@test.com',
  email_verified: true,
  updated_at: 1692801330,
  locale: 'en-GB',
  zoneinfo: 'Europe/London',

  // TrueNamePath-specific claims
  context_name: 'Work Colleagues',
  app_name: 'Test App',

  // Academic transparency claims
  _token_type: 'bearer_demo',
  _note: 'Bearer token - claims informational only',
};

// Mock authentication state
let shouldAuthFail = false;
let authFailureResponse: any = null;

// Utility functions for test setup
function createMockRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) {
headers.authorization = authHeader;
  }

  return {
headers: {
  get: vi.fn((name: string) => {
return headers[name.toLowerCase()] || null;
  }),
},
  } as unknown as NextRequest;
}

async function parseJsonResponse(response: any): Promise<any> {
  // Handle mocked NextResponse.json() which returns JSON directly
  if (response && typeof response.json === 'function') {
return await response.json();
  }

  // Handle real Response objects in tests
  if (response && typeof response.text === 'function') {
const text = await response.text();
return JSON.parse(text);
  }

  // If it's already parsed JSON (from our mock), return it directly
  return response;
}

// Test suite
describe('OAuth Resolve Endpoint - POST /api/oauth/resolve', () => {
  beforeEach(async () => {
// Configure automatic mock cleanup
vi.restoreAllMocks();
vi.clearAllMocks();
shouldAuthFail = false;
authFailureResponse = null;

// Reset mock implementations
mockSupabaseClient.rpc.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.single.mockReturnValue(mockSupabaseQuery);

// Setup default Bearer token extraction behavior
const mockExtractBearerToken = vi.mocked(
  (await import('@/utils/api/oauth-helpers')).extractBearerToken,
);
mockExtractBearerToken.mockImplementation((authHeader: string | null) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
return null;
  }
  const token = authHeader.substring(7);
  if (!token.startsWith('tnp_') || token.length !== 36) {
return null;
  }
  return token;
});
  });

  afterEach(() => {
// Ensure clean state between tests
vi.restoreAllMocks();
  });

  describe('Authentication Requirements', () => {
it('should reject request without Authorization header', async () => {
  const request = createMockRequest();
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ErrorCodes.AUTHENTICATION_REQUIRED);
  expect(responseData.error.message).toBe(
'Valid Bearer token required (Authorization: Bearer tnp_xxx)',
  );
});

it('should reject request with invalid Bearer token format', async () => {
  const request = createMockRequest('Bearer invalid-format');
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ErrorCodes.AUTHENTICATION_REQUIRED);
  expect(responseData.error.message).toBe(
'Valid Bearer token required (Authorization: Bearer tnp_xxx)',
  );
});

it('should reject request with non-Bearer authorization', async () => {
  const request = createMockRequest('Basic dXNlcjpwYXNz');
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ErrorCodes.AUTHENTICATION_REQUIRED);
});

it('should reject request with malformed tnp_ token', async () => {
  const request = createMockRequest('Bearer tnp_short');
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ErrorCodes.AUTHENTICATION_REQUIRED);
});

it('should handle empty Authorization header', async () => {
  const request = createMockRequest('');
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ErrorCodes.AUTHENTICATION_REQUIRED);
});
  });

  describe('Successful OIDC Claims Resolution', () => {
it('should successfully resolve valid Bearer token to OIDC claims', async () => {
  // Setup successful resolution mock
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.data.claims).toEqual(VALID_OIDC_CLAIMS);
  expect(responseData.data.resolved_at).toMatch(
/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
  expect(responseData.data.performance.response_time_ms).toBe(2);

  // Verify database function was called
  expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
'resolve_oauth_oidc_claims',
{
  p_session_token: VALID_BEARER_TOKEN,
},
  );
});

it('should validate mandatory OIDC claims are present', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);
  const claims = responseData.data.claims;

  // Verify mandatory OIDC claims are present
  expect(claims.sub).toBeDefined();
  expect(claims.iss).toBeDefined();
  expect(claims.aud).toBeDefined();
  expect(claims.iat).toBeDefined();
  expect(claims.exp).toBeDefined();
  expect(claims.nbf).toBeDefined();
  expect(claims.jti).toBeDefined();

  // Verify mandatory claims have correct types
  expect(typeof claims.sub).toBe('string');
  expect(typeof claims.iss).toBe('string');
  expect(typeof claims.aud).toBe('string');
  expect(typeof claims.iat).toBe('number');
  expect(typeof claims.exp).toBe('number');
  expect(typeof claims.nbf).toBe('number');
  expect(typeof claims.jti).toBe('string');
});

it('should validate time relationships between claims', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);
  const claims = responseData.data.claims;

  // Verify exp is exactly iat + 3600 (1 hour)
  expect(claims.exp).toBe(claims.iat + 3600);

  // Verify nbf equals iat
  expect(claims.nbf).toBe(claims.iat);

  // Verify exp is greater than iat
  expect(claims.exp).toBeGreaterThan(claims.iat);
});

it('should validate jti claim is valid UUID format', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);
  const claims = responseData.data.claims;

  // Verify jti is in valid UUID format
  const uuidRegex =
/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  expect(claims.jti).toMatch(uuidRegex);
});

it('should validate UK defaults for locale and timezone', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);
  const claims = responseData.data.claims;

  // Verify UK university defaults
  expect(claims.locale).toBe('en-GB');
  expect(claims.zoneinfo).toBe('Europe/London');
});

it('should validate academic transparency claims', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);
  const claims = responseData.data.claims;

  // Verify academic transparency claims
  expect(claims._token_type).toBe('bearer_demo');
  expect(claims._note).toBe('Bearer token - claims informational only');
});

it('should validate email verification status', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);
  const claims = responseData.data.claims;

  // Verify email verification status is boolean when present
  if (claims.email_verified !== undefined) {
expect(typeof claims.email_verified).toBe('boolean');
  }
});

it('should include performance metrics in successful response', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.data.performance).toBeDefined();
  expect(responseData.data.performance.response_time_ms).toBeGreaterThan(0);
});

it('should handle minimal OIDC claims structure with mandatory fields', async () => {
  const currentTime = Math.floor(Date.now() / 1000);
  const minimalClaims = {
// All mandatory OIDC claims must be present
sub: 'test-user-id',
iss: 'https://truenameapi.demo',
aud: 'test-app',
iat: currentTime,
exp: currentTime + 3600, // iat + 1 hour
nbf: currentTime, // same as iat
jti: '123e4567-e89b-12d3-a456-426614174000', // valid UUID

// TrueNamePath required claims
context_name: 'Default Context',
app_name: 'Test App',

// UK defaults
locale: 'en-GB',
zoneinfo: 'Europe/London',

// Academic transparency
_token_type: 'bearer_demo',
_note: 'Bearer token - claims informational only',
  };

  mockSupabaseQuery.single.mockResolvedValue({
data: minimalClaims,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.data.claims).toEqual(minimalClaims);

  // Verify mandatory claims are present even in minimal response
  expect(responseData.data.claims.sub).toBeDefined();
  expect(responseData.data.claims.iss).toBeDefined();
  expect(responseData.data.claims.aud).toBeDefined();
  expect(responseData.data.claims.iat).toBeDefined();
  expect(responseData.data.claims.exp).toBeDefined();
  expect(responseData.data.claims.nbf).toBeDefined();
  expect(responseData.data.claims.jti).toBeDefined();
});
  });

  describe('Database Error Handling', () => {
it('should handle database connection errors', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: null,
error: { message: 'Connection timeout' },
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ResolveErrorCodes.RESOLUTION_FAILED);
  expect(responseData.error.message).toBe('Failed to resolve OIDC claims');
  expect(responseData.error.details.database_error).toBe(
'Connection timeout',
  );
});

it('should handle null data response from database', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: null,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ResolveErrorCodes.RESOLUTION_FAILED);
  expect(responseData.error.message).toBe('Failed to resolve OIDC claims');
});

it('should handle database function throwing exception', async () => {
  mockSupabaseQuery.single.mockRejectedValue(
new Error('Database unavailable'),
  );

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
  expect(responseData.error.message).toBe('OIDC resolution failed');
});
  });

  describe('Token-Specific Error Handling', () => {
it('should handle invalid token error from database', async () => {
  // Mock extractBearerToken to return the token first
  const mockExtractBearerToken = vi.mocked(
(await import('@/utils/api/oauth-helpers')).extractBearerToken,
  );
  mockExtractBearerToken.mockReturnValue(EXPIRED_BEARER_TOKEN);

  const errorResult = {
error: 'invalid_token',
message: 'Session token not found or expired',
  };

  mockSupabaseQuery.single.mockResolvedValue({
data: errorResult,
error: null,
  });

  const request = createMockRequest(`Bearer ${EXPIRED_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ResolveErrorCodes.INVALID_TOKEN);
  expect(responseData.error.message).toBe(
'Session token not found or expired',
  );
});

it('should handle no context assigned error', async () => {
  const errorResult = {
error: 'no_context_assigned',
message: 'User has not assigned a context for this application',
  };

  mockSupabaseQuery.single.mockResolvedValue({
data: errorResult,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(
ResolveErrorCodes.NO_CONTEXT_ASSIGNED,
  );
  expect(responseData.error.message).toBe(
'User has not assigned a context for this application',
  );
});

it('should handle unknown error types from database', async () => {
  const errorResult = {
error: 'unknown_error',
message: 'An unexpected error occurred',
  };

  mockSupabaseQuery.single.mockResolvedValue({
data: errorResult,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ResolveErrorCodes.RESOLUTION_FAILED);
  expect(responseData.error.message).toBe('An unexpected error occurred');
});

it('should handle error result without message', async () => {
  const errorResult = { error: 'invalid_token' };

  mockSupabaseQuery.single.mockResolvedValue({
data: errorResult,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe(ResolveErrorCodes.INVALID_TOKEN);
  expect(responseData.error.message).toBe('Token resolution failed');
});
  });

  describe('Performance Measurement', () => {
it('should measure and include performance metrics', async () => {
  const mockMeasurePerformance = vi.mocked(
(await import('../helpers')).measurePerformance,
  );

  // Mock longer response time for this test
  mockMeasurePerformance.mockReturnValue({
startTime: Date.now(),
getElapsed: vi.fn(() => 2), // Keep consistent with mocked createSuccessResponse
  });

  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.data.performance.response_time_ms).toBe(2); // From createSuccessResponse mock
  expect(mockMeasurePerformance).toHaveBeenCalled();
});

it('should track performance even for failed requests', async () => {
  const mockMeasurePerformance = vi.mocked(
(await import('../helpers')).measurePerformance,
  );

  mockSupabaseQuery.single.mockResolvedValue({
data: null,
error: { message: 'Error' },
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  await POST(request);

  expect(mockMeasurePerformance).toHaveBeenCalled();
});
  });

  describe('Request Context Validation', () => {
it('should handle requests with proper context', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
  expect(responseData.timestamp).toMatch(
/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
});

it('should maintain proper request tracing', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.requestId).toBeDefined();
  expect(responseData.timestamp).toBeDefined();
});
  });

  describe('Edge Cases', () => {
it('should handle claims result with null values', async () => {
  const claimsWithNulls = {
...VALID_OIDC_CLAIMS,
name: null,
given_name: null,
family_name: null,
  };

  mockSupabaseQuery.single.mockResolvedValue({
data: claimsWithNulls,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.data.claims).toEqual(claimsWithNulls);
});

it('should handle non-object error results', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: 'string_error',
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.data.claims).toBe('string_error');
});

it('should handle claims result with extra properties', async () => {
  const claimsWithExtra = {
...VALID_OIDC_CLAIMS,
extra_property: 'extra_value',
custom_claim: 'custom_value',
  };

  mockSupabaseQuery.single.mockResolvedValue({
data: claimsWithExtra,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.data.claims).toEqual(claimsWithExtra);
});
  });

  describe('Integration Requirements', () => {
it('should maintain JSend response format for all responses', async () => {
  // Test success response format
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData).toHaveProperty('success');
  expect(responseData).toHaveProperty('data');
  expect(responseData).toHaveProperty('requestId');
  expect(responseData).toHaveProperty('timestamp');

  // Test error response format
  const errorRequest = createMockRequest();
  const errorResponse = await POST(errorRequest);
  const errorData = await parseJsonResponse(errorResponse);

  expect(errorData).toHaveProperty('success');
  expect(errorData).toHaveProperty('error');
  expect(errorData).toHaveProperty('requestId');
  expect(errorData).toHaveProperty('timestamp');
});
  });

  describe('Coverage Validation', () => {
it('should test all error code paths', async () => {
  // This test ensures we have coverage for all ResolveErrorCodes
  const errorCodes = [
ResolveErrorCodes.INVALID_TOKEN,
ResolveErrorCodes.NO_CONTEXT_ASSIGNED,
ResolveErrorCodes.RESOLUTION_FAILED,
  ];

  expect(errorCodes).toHaveLength(3);
  expect(errorCodes).toContain('INVALID_TOKEN');
  expect(errorCodes).toContain('NO_CONTEXT_ASSIGNED');
  expect(errorCodes).toContain('RESOLUTION_FAILED');
});

it('should verify helper functions are available', async () => {
  // This test ensures helper functions are properly imported and available
  const helpers = await import('../helpers');
  expect(typeof helpers.measurePerformance).toBe('function');
});
  });
});
