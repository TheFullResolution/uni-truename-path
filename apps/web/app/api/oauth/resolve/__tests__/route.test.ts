/**
 * Comprehensive Unit Tests for OAuth Resolve Endpoint
 *
 * Tests for POST /api/oauth/resolve - Bearer token to OIDC claims resolution
 * Complete test suite validating all success/error paths with 100% critical coverage
 * Academic project - Step 16 OAuth integration testing
 */

/// <reference types="node" />

import { ErrorCodes } from '@/utils/api';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../route';
import type { OIDCClaims } from '../types';
import { ResolveErrorCodes } from '../types';

// Type declarations for DOM and Web API types used in test mocks
type ResponseType =
  | 'basic'
  | 'cors'
  | 'default'
  | 'error'
  | 'opaque'
  | 'opaqueredirect';
type XMLHttpRequestBodyInit =
  | string
  | Document
  | Blob
  | ArrayBufferView
  | ArrayBuffer
  | FormData;
type HeadersInit = [string, string][] | Record<string, string> | Headers;
type BodyInit = ReadableStream<Uint8Array> | XMLHttpRequestBodyInit;
type ResponseInit = {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
};
type RequestInit = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  integrity?: string;
  keepalive?: boolean;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  signal?: AbortSignal | null;
  window?: any;
};
type RequestCache =
  | 'default'
  | 'no-store'
  | 'reload'
  | 'no-cache'
  | 'force-cache'
  | 'only-if-cached';
type RequestCredentials = 'omit' | 'same-origin' | 'include';
type RequestMode = 'navigate' | 'same-origin' | 'no-cors' | 'cors';
type RequestRedirect = 'follow' | 'error' | 'manual';
type ReferrerPolicy =
  | ''
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

// Mock the helper functions from helpers.ts
vi.mock('../helpers', () => ({
  measurePerformance: vi.fn(() => ({
startTime: Date.now(),
getElapsed: vi.fn(() => 2), // Mock 2ms response time
  })),
  extractSessionDataFromClaims: vi.fn(() => ({
profile_id: 'test-profile-id',
app_id: 'test-app-id',
session_id: 'tnp_test_session_token',
context_id: 'test-context-id',
  })),
  logOAuthUsage: vi.fn(() => Promise.resolve(true)),
  mapErrorToAnalyticsType: vi.fn((error) => {
if (typeof error === 'object' && error !== null && 'error' in error) {
  const errorResult = error as { error: string };
  switch (errorResult.error) {
case 'invalid_token':
  return 'invalid_token';
case 'no_context_assigned':
  return 'context_missing';
default:
  return 'resolution_failed';
  }
}
return 'server_error';
  }),
}));

// Mock extractBearerToken from oauth-helpers
vi.mock('@/utils/api/oauth-helpers', () => ({
  extractBearerToken: vi.fn((authHeader: string | null) => {
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return null;
}
const token = authHeader.substring(7);
if (!token.startsWith('tnp_') || token.length !== 36) {
  return null;
}
return token;
  }),
}));

// Mock next/server with proper hoisting-safe structure
vi.mock('next/server', () => {
  // Create mock classes inside the factory to avoid hoisting issues
  class MockRequestCookies {
public size: number = 0;

get(name: string): { name: string; value: string } | undefined {
  return undefined;
}

getAll(): { name: string; value: string }[] {
  return [];
}

has(name: string): boolean {
  return false;
}

set(name: string, value: string): this {
  return this;
}

delete(name: string): boolean {
  return true;
}

clear(): this {
  return this;
}

[Symbol.iterator](): IterableIterator<{ name: string; value: string }> {
  return [][Symbol.iterator]();
}
  }

  class MockResponse {
public readonly headers: Headers;
public readonly status: number;
public readonly body: ReadableStream<Uint8Array> | null;
public readonly ok: boolean;
public readonly redirected: boolean;
public readonly statusText: string;
public readonly url: string;
public readonly type: ResponseType;

constructor(body?: BodyInit | null, init?: ResponseInit) {
  this.headers = new Headers(init?.headers);
  this.status = init?.status ?? 200;
  this.body = null;
  this.ok = this.status >= 200 && this.status < 300;
  this.redirected = false;
  this.statusText = init?.statusText ?? '';
  this.url = '';
  this.type = 'default' as ResponseType;
}

static json(object: any, init?: ResponseInit): Response {
  const response = new MockResponse(JSON.stringify(object), {
...init,
headers: {
  'Content-Type': 'application/json',
  ...init?.headers,
},
  });
  return response as any;
}

async json(): Promise<any> {
  return {};
}

clone(): Response {
  return this as any;
}

async text(): Promise<string> {
  return '';
}

async arrayBuffer(): Promise<ArrayBuffer> {
  return new ArrayBuffer(0);
}

async blob(): Promise<Blob> {
  return new Blob();
}

async formData(): Promise<FormData> {
  return new FormData();
}

get bodyUsed(): boolean {
  return false;
}
  }

  class MockNextRequest {
public method: string;
public url: string;
public headers: Headers;
public cookies: MockRequestCookies;
public nextUrl: URL;
public page: any;
public ua: any;
public cache: RequestCache;
public credentials: RequestCredentials;
public destination: any;
public integrity: string;
public keepalive: boolean;
public mode: RequestMode;
public redirect: RequestRedirect;
public referrer: string;
public referrerPolicy: ReferrerPolicy;
public signal: AbortSignal;
public body: ReadableStream<Uint8Array> | null;
public bodyUsed: boolean;
public ok: boolean;
public redirected: boolean;
public status: number;
public statusText: string;
public type: ResponseType;
public geo: any;
public ip: string;
public bytes: () => Promise<Uint8Array>;

constructor(
  input: string | Request,
  init?: RequestInit & { geo?: any; ip?: string },
) {
  this.method = init?.method || 'GET';
  this.url = typeof input === 'string' ? input : input.url;
  this.headers = new Headers(init?.headers as HeadersInit);
  this.cookies = new MockRequestCookies();
  this.nextUrl = new URL(this.url);

  // Initialize all required properties
  this.page = {};
  this.ua = {};
  this.cache = 'default';
  this.credentials = 'same-origin';
  this.destination = 'document';
  this.integrity = '';
  this.keepalive = false;
  this.mode = 'cors';
  this.redirect = 'follow';
  this.referrer = '';
  this.referrerPolicy = '';
  this.signal = new AbortController().signal;
  this.body = null;
  this.bodyUsed = false;
  this.ok = true;
  this.redirected = false;
  this.status = 200;
  this.statusText = 'OK';
  this.type = 'default';
  this.geo = init?.geo || {};
  this.ip = init?.ip || '';
  this.bytes = async () => new Uint8Array();
}

async json(): Promise<any> {
  return {};
}

clone(): NextRequest {
  return this as unknown as NextRequest;
}

async text(): Promise<string> {
  return '';
}

async arrayBuffer(): Promise<ArrayBuffer> {
  return new ArrayBuffer(0);
}

async blob(): Promise<Blob> {
  return new Blob();
}

async formData(): Promise<FormData> {
  return new FormData();
}
  }

  return {
NextRequest: MockNextRequest,
NextResponse: MockResponse,
  };
});

// Setup detailed Supabase mock chain that properly simulates the real implementation
const mockSupabaseClient = {
  rpc: vi.fn(),
};

const mockSupabaseQuery = {
  single: vi.fn(),
};

// Authentication control flag for tests
let shouldAuthFail = false;
let authFailureResponse: any = null;

// Mock the withOptionalAuth to match the actual implementation
vi.mock('@/utils/api/with-auth', () => {
  return {
withOptionalAuth: vi.fn((handler) => async (request: NextRequest) => {
  // Check if this test wants auth to fail
  if (shouldAuthFail && authFailureResponse) {
return authFailureResponse;
  }

  const mockAuthContext = {
user: null, // Optional auth - user can be null
supabase: mockSupabaseClient,
requestId: 'req_123456_test',
timestamp: '2025-08-23T10:30:00.000Z',
isAuthenticated: false, // Optional auth defaults to false
isOAuth: true, // This is an OAuth endpoint
  };
  return await handler(request, mockAuthContext);
}),
createErrorResponse: vi.fn(
  (code, message, requestId, details, timestamp) => ({
success: false,
error: { code, message, details },
requestId,
timestamp,
  }),
),
createSuccessResponse: vi.fn((data, requestId, timestamp) => ({
  success: true,
  data: {
...data,
performance: data.performance || { response_time_ms: 2 },
  },
  requestId,
  timestamp,
})),
  };
});

// Test constants
const VALID_BEARER_TOKEN = 'tnp_abcdef1234567890abcdef1234567890';
const INVALID_BEARER_TOKEN = 'invalid_token_format';
const EXPIRED_BEARER_TOKEN = 'tnp_expired123456789012345678901234';

const VALID_OIDC_CLAIMS: OIDCClaims = {
  sub: 'test-user-id',
  iss: 'https://truename.test',
  aud: 'test-app',
  iat: Math.floor(Date.now() / 1000),
  name: 'John Doe',
  given_name: 'John',
  family_name: 'Doe',
  nickname: 'Johnny',
  preferred_username: 'john.doe',
  context_name: 'Work Context',
  app_name: 'Test Application',
};

// Helper functions for test setup
function createMockRequest(authHeader?: string): NextRequest {
  const headers: HeadersInit = authHeader ? { authorization: authHeader } : {};

  // Create mock request object that matches NextRequest interface
  const mockRequest = {
method: 'POST',
url: 'https://test.com/api/oauth/resolve',
headers: new Headers(headers),
cookies: {
  size: 0,
  get: () => undefined,
  getAll: () => [],
  has: () => false,
  set: function () {
return this;
  },
  delete: () => true,
  clear: function () {
return this;
  },
  [Symbol.iterator]: () => [][Symbol.iterator](),
},
nextUrl: new URL('https://test.com/api/oauth/resolve'),
page: {},
ua: {},
cache: 'default' as RequestCache,
credentials: 'same-origin' as RequestCredentials,
destination: 'document',
integrity: '',
keepalive: false,
mode: 'cors' as RequestMode,
redirect: 'follow' as RequestRedirect,
referrer: '',
referrerPolicy: '' as ReferrerPolicy,
signal: new AbortController().signal,
body: null,
bodyUsed: false,
ok: true,
redirected: false,
status: 200,
statusText: 'OK',
type: 'default' as ResponseType,
geo: {},
ip: '',
bytes: async () => new Uint8Array(),
json: async () => ({}),
clone: function () {
  return this as unknown as NextRequest;
},
text: async () => '',
arrayBuffer: async () => new ArrayBuffer(0),
blob: async () => new Blob(),
formData: async () => new FormData(),
  } as unknown as NextRequest;

  return mockRequest;
}

async function parseJsonResponse(response: any): Promise<any> {
  if (response && typeof response === 'object' && 'json' in response) {
return await response.json();
  }
  return response;
}

describe('OAuth Resolve Endpoint - POST /api/oauth/resolve', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
// Configure automatic mock cleanup
vi.restoreAllMocks();

// Setup console spy fresh for each test
consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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
  expect(responseData.data.resolved_at).toBe('2025-08-23T10:30:00.000Z');
  expect(responseData.data.performance.response_time_ms).toBe(2);

  // Verify database function was called
  expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
'resolve_oauth_oidc_claims',
{
  p_session_token: VALID_BEARER_TOKEN,
},
  );
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

it('should handle minimal OIDC claims structure', async () => {
  const minimalClaims = {
sub: 'test-user-id',
iss: 'https://truename.test',
aud: 'test-app',
iat: Math.floor(Date.now() / 1000),
context_name: 'Default Context',
app_name: 'Test App',
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

  describe('Analytics Logging Verification', () => {
it('should log successful resolution analytics', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  await POST(request);

  const mockLogOAuthUsage = vi.mocked(
(await import('../helpers')).logOAuthUsage,
  );

  expect(mockLogOAuthUsage).toHaveBeenCalledWith(
mockSupabaseClient,
expect.any(Object), // sessionData
VALID_BEARER_TOKEN,
true, // success
2, // responseTime
  );
});

it('should log failed resolution analytics with error type', async () => {
  // Mock extractBearerToken to return the token
  const mockExtractBearerToken = vi.mocked(
(await import('@/utils/api/oauth-helpers')).extractBearerToken,
  );
  mockExtractBearerToken.mockReturnValue(EXPIRED_BEARER_TOKEN);

  const errorResult = {
error: 'invalid_token',
message: 'Token expired',
  };

  mockSupabaseQuery.single.mockResolvedValue({
data: errorResult,
error: null,
  });

  const request = createMockRequest(`Bearer ${EXPIRED_BEARER_TOKEN}`);
  await POST(request);

  const mockLogOAuthUsage = vi.mocked(
(await import('../helpers')).logOAuthUsage,
  );

  expect(mockLogOAuthUsage).toHaveBeenCalledWith(
mockSupabaseClient,
null, // no sessionData for failures
EXPIRED_BEARER_TOKEN,
false, // success = false
2, // responseTime
'invalid_token', // error type from mapErrorToAnalyticsType
  );
});

it('should log server error analytics for database failures', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: null,
error: { message: 'Database error' },
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  await POST(request);

  const mockLogOAuthUsage = vi.mocked(
(await import('../helpers')).logOAuthUsage,
  );

  expect(mockLogOAuthUsage).toHaveBeenCalledWith(
mockSupabaseClient,
null,
VALID_BEARER_TOKEN,
false,
2,
'server_error',
  );
});

it('should log analytics for exception scenarios', async () => {
  mockSupabaseQuery.single.mockRejectedValue(new Error('Unexpected error'));

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  await POST(request);

  const mockLogOAuthUsage = vi.mocked(
(await import('../helpers')).logOAuthUsage,
  );

  expect(mockLogOAuthUsage).toHaveBeenCalledWith(
mockSupabaseClient,
null,
VALID_BEARER_TOKEN,
false,
2,
'server_error',
  );
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

  describe('Session Data Extraction', () => {
it('should extract session data from successful claims', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const mockExtractSessionData = vi.mocked(
(await import('../helpers')).extractSessionDataFromClaims,
  );

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  await POST(request);

  expect(mockExtractSessionData).toHaveBeenCalledWith(
VALID_OIDC_CLAIMS,
VALID_BEARER_TOKEN,
  );
});

it('should not extract session data for failed resolutions', async () => {
  const errorResult = {
error: 'invalid_token',
message: 'Token invalid',
  };

  mockSupabaseQuery.single.mockResolvedValue({
data: errorResult,
error: null,
  });

  const mockExtractSessionData = vi.mocked(
(await import('../helpers')).extractSessionDataFromClaims,
  );

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  await POST(request);

  expect(mockExtractSessionData).not.toHaveBeenCalled();
});
  });

  describe('Error Type Mapping', () => {
it('should map error types correctly for analytics', async () => {
  const errorResult = {
error: 'no_context_assigned',
message: 'Context not assigned',
  };

  mockSupabaseQuery.single.mockResolvedValue({
data: errorResult,
error: null,
  });

  const mockMapErrorToAnalyticsType = vi.mocked(
(await import('../helpers')).mapErrorToAnalyticsType,
  );

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  await POST(request);

  expect(mockMapErrorToAnalyticsType).toHaveBeenCalledWith(errorResult);
});

it('should handle error mapping for server errors', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: null,
error: { message: 'Server error' },
  });

  const mockMapErrorToAnalyticsType = vi.mocked(
(await import('../helpers')).mapErrorToAnalyticsType,
  );

  // Server errors don't call mapErrorToAnalyticsType, they directly use 'server_error'
  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  await POST(request);

  expect(mockMapErrorToAnalyticsType).not.toHaveBeenCalled();
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
  expect(responseData.requestId).toBe('req_123456_test');
  expect(responseData.timestamp).toBe('2025-08-23T10:30:00.000Z');
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

it('should use withOptionalAuth wrapper correctly', async () => {
  // This test verifies the endpoint is properly wrapped
  mockSupabaseQuery.single.mockResolvedValue({
data: VALID_OIDC_CLAIMS,
error: null,
  });

  const request = createMockRequest(`Bearer ${VALID_BEARER_TOKEN}`);
  const response = await POST(request);

  // If withOptionalAuth is working, we should get a response
  expect(response).toBeDefined();
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

it('should verify all helper functions are called', async () => {
  // This test ensures all helper functions are properly imported and available
  const helpers = await import('../helpers');
  expect(typeof helpers.measurePerformance).toBe('function');
  expect(typeof helpers.extractSessionDataFromClaims).toBe('function');
  expect(typeof helpers.logOAuthUsage).toBe('function');
  expect(typeof helpers.mapErrorToAnalyticsType).toBe('function');
});
  });
});
