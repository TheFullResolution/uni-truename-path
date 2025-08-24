/**
 * Unit Tests for OAuth Authorization Helper Functions
 *
 * Tests for helper functions in helpers.ts - OAuth authorization utilities
 * Complete test suite validating all helper functions with 100% coverage
 * Academic project - Step 16 OAuth integration testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateAppAccess,
  validateContextOwnership,
  createOAuthSession,
  buildRedirectUrl,
  assignDefaultContextToApp,
  validateTokenFormat,
  validateReturnUrl,
} from '../helpers';
import type { AuthorizeAppInfo, AuthorizeContextInfo } from '../types';

// Mock Supabase client for controlled testing
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
};

const mockSupabaseQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
};

// Console spies - will be initialized in beforeEach
let consoleSpy: ReturnType<typeof vi.spyOn>;
let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

// Test data constants
const VALID_APP_ID = '550e8400-e29b-41d4-a716-446655440001';
const VALID_CONTEXT_ID = '550e8400-e29b-41d4-a716-446655440002';
const VALID_USER_ID = 'test-user-id';
const VALID_TOKEN = 'tnp_a1b2c3d4e5f6789012345678901234567890abcdef';
const VALID_SHORT_TOKEN = 'tnp_' + 'a'.repeat(32);

const mockApp: AuthorizeAppInfo = {
  id: VALID_APP_ID,
  display_name: 'Demo HR System',
  app_name: 'demo-hr',
  is_active: true,
};

const mockContext: AuthorizeContextInfo = {
  id: VALID_CONTEXT_ID,
  context_name: 'Work Colleagues',
  user_id: VALID_USER_ID,
};

describe('OAuth Authorization Helper Functions', () => {
  beforeEach(() => {
vi.clearAllMocks();

// Setup console spies fresh for each test
consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Setup default mock chains
mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);
mockSupabaseClient.rpc.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.single.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.insert.mockReturnValue(mockSupabaseQuery);
  });

  afterEach(() => {
// Restore console methods
consoleSpy?.mockRestore();
consoleWarnSpy?.mockRestore();
  });

  describe('validateAppAccess', () => {
it('should return app info for valid active app', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: {
  id: VALID_APP_ID,
  app_name: 'demo-hr',
  display_name: 'Demo HR System',
  is_active: true,
},
error: null,
  });

  const result = await validateAppAccess(
VALID_APP_ID,
mockSupabaseClient as any,
  );

  expect(result).toEqual(mockApp);
  expect(mockSupabaseClient.from).toHaveBeenCalledWith(
'oauth_applications',
  );
  expect(mockSupabaseQuery.select).toHaveBeenCalledWith(
'id, app_name, display_name, is_active',
  );
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', VALID_APP_ID);
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('is_active', true);
});

it('should return null for non-existent app', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: null,
error: { message: 'No rows returned', code: 'PGRST116' },
  });

  const result = await validateAppAccess(
VALID_APP_ID,
mockSupabaseClient as any,
  );

  expect(result).toBeNull();
});

it('should return null for inactive app', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: null, // Filtered out by is_active=true constraint
error: null,
  });

  const result = await validateAppAccess(
VALID_APP_ID,
mockSupabaseClient as any,
  );

  expect(result).toBeNull();
});

it('should return null and log error for database errors', async () => {
  const dbError = new Error('Database connection failed');
  mockSupabaseQuery.single.mockRejectedValue(dbError);

  const result = await validateAppAccess(
VALID_APP_ID,
mockSupabaseClient as any,
  );

  expect(result).toBeNull();
  expect(consoleSpy).toHaveBeenCalledWith(
'App validation failed:',
dbError,
  );
});

it('should handle null is_active field gracefully', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: {
  id: VALID_APP_ID,
  app_name: 'demo-hr',
  display_name: 'Demo HR System',
  is_active: null, // Edge case: null instead of boolean
},
error: null,
  });

  const result = await validateAppAccess(
VALID_APP_ID,
mockSupabaseClient as any,
  );

  expect(result).toEqual({
id: VALID_APP_ID,
app_name: 'demo-hr',
display_name: 'Demo HR System',
is_active: false, // Should default to false
  });
});

it('should verify database query structure', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: mockApp,
error: null,
  });

  await validateAppAccess(VALID_APP_ID, mockSupabaseClient as any);

  // Verify the complete query chain
  expect(mockSupabaseClient.from).toHaveBeenCalledWith(
'oauth_applications',
  );
  expect(mockSupabaseQuery.select).toHaveBeenCalledWith(
'id, app_name, display_name, is_active',
  );
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', VALID_APP_ID);
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('is_active', true);
  expect(mockSupabaseQuery.single).toHaveBeenCalled();
});
  });

  describe('validateContextOwnership', () => {
it('should return context info for valid user-owned context', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: {
  id: VALID_CONTEXT_ID,
  context_name: 'Work Colleagues',
  user_id: VALID_USER_ID,
},
error: null,
  });

  const result = await validateContextOwnership(
VALID_CONTEXT_ID,
VALID_USER_ID,
mockSupabaseClient as any,
  );

  expect(result).toEqual(mockContext);
  expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_contexts');
  expect(mockSupabaseQuery.select).toHaveBeenCalledWith(
'id, context_name, user_id',
  );
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', VALID_CONTEXT_ID);
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith(
'user_id',
VALID_USER_ID,
  );
});

it('should return null for non-existent context', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: null,
error: { message: 'No rows returned', code: 'PGRST116' },
  });

  const result = await validateContextOwnership(
VALID_CONTEXT_ID,
VALID_USER_ID,
mockSupabaseClient as any,
  );

  expect(result).toBeNull();
});

it('should return null for context owned by different user', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: null, // Filtered out by user_id constraint
error: null,
  });

  const result = await validateContextOwnership(
VALID_CONTEXT_ID,
'different-user-id',
mockSupabaseClient as any,
  );

  expect(result).toBeNull();
});

it('should return null and log error for database errors', async () => {
  const dbError = new Error('Database connection failed');
  mockSupabaseQuery.single.mockRejectedValue(dbError);

  const result = await validateContextOwnership(
VALID_CONTEXT_ID,
VALID_USER_ID,
mockSupabaseClient as any,
  );

  expect(result).toBeNull();
  expect(consoleSpy).toHaveBeenCalledWith(
'Context ownership validation failed:',
dbError,
  );
});

it('should verify database query structure', async () => {
  mockSupabaseQuery.single.mockResolvedValue({
data: mockContext,
error: null,
  });

  await validateContextOwnership(
VALID_CONTEXT_ID,
VALID_USER_ID,
mockSupabaseClient as any,
  );

  // Verify the complete query chain
  expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_contexts');
  expect(mockSupabaseQuery.select).toHaveBeenCalledWith(
'id, context_name, user_id',
  );
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', VALID_CONTEXT_ID);
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith(
'user_id',
VALID_USER_ID,
  );
  expect(mockSupabaseQuery.single).toHaveBeenCalled();
});
  });

  describe('createOAuthSession', () => {
it('should create session successfully with valid data', async () => {
  const returnUrl = 'https://demo-hr-truename.vercel.app/callback';

  // Mock successful token generation - need to return query object first
  const mockTokenQuery = {
single: vi.fn().mockResolvedValue({
  data: VALID_TOKEN,
  error: null,
}),
  };
  mockSupabaseClient.rpc.mockReturnValue(mockTokenQuery);

  // Mock successful session insertion
  mockSupabaseQuery.insert.mockResolvedValue({
error: null,
  });

  const beforeCall = Date.now();
  const result = await createOAuthSession(
VALID_USER_ID,
VALID_APP_ID,
returnUrl,
mockSupabaseClient as any,
  );
  const afterCall = Date.now();

  expect(result.success).toBe(true);
  expect(result.session_token).toBe(VALID_TOKEN);

  // Verify expiration is approximately 2 hours from now
  const expiresAt = new Date(result.expires_at).getTime();
  const expectedExpiry = beforeCall + 2 * 60 * 60 * 1000;
  const maxExpectedExpiry = afterCall + 2 * 60 * 60 * 1000;

  expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry);
  expect(expiresAt).toBeLessThanOrEqual(maxExpectedExpiry);

  // Verify database calls
  expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
'generate_oauth_token',
  );
  expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
profile_id: VALID_USER_ID,
app_id: VALID_APP_ID,
session_token: VALID_TOKEN,
expires_at: expect.stringMatching(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
),
return_url: returnUrl,
  });
});

it('should return failure result for token generation errors', async () => {
  const returnUrl = 'https://demo-hr-truename.vercel.app/callback';

  // Mock token generation failure
  const mockTokenQuery = {
single: vi.fn().mockResolvedValue({
  data: null,
  error: { message: 'Token generation failed', code: 'FUNCTION_ERROR' },
}),
  };
  mockSupabaseClient.rpc.mockReturnValue(mockTokenQuery);

  const result = await createOAuthSession(
VALID_USER_ID,
VALID_APP_ID,
returnUrl,
mockSupabaseClient as any,
  );

  expect(result.success).toBe(false);
  expect(result.session_token).toBe('');
  expect(result.expires_at).toBe('');
  expect(consoleSpy).toHaveBeenCalledWith(
'OAuth session creation failed:',
expect.any(Error),
  );
});

it('should return failure result for session insertion errors', async () => {
  const returnUrl = 'https://demo-hr-truename.vercel.app/callback';

  // Mock successful token generation
  const mockTokenQuery = {
single: vi.fn().mockResolvedValue({
  data: VALID_TOKEN,
  error: null,
}),
  };
  mockSupabaseClient.rpc.mockReturnValue(mockTokenQuery);

  // Mock session insertion failure
  mockSupabaseQuery.insert.mockResolvedValue({
error: { message: 'Insert failed', code: 'INSERT_ERROR' },
  });

  const result = await createOAuthSession(
VALID_USER_ID,
VALID_APP_ID,
returnUrl,
mockSupabaseClient as any,
  );

  expect(result.success).toBe(false);
  expect(result.session_token).toBe('');
  expect(result.expires_at).toBe('');
});

it('should return failure result for unexpected errors', async () => {
  const returnUrl = 'https://demo-hr-truename.vercel.app/callback';

  // Mock unexpected error
  mockSupabaseClient.rpc.mockRejectedValue(new Error('Unexpected error'));

  const result = await createOAuthSession(
VALID_USER_ID,
VALID_APP_ID,
returnUrl,
mockSupabaseClient as any,
  );

  expect(result.success).toBe(false);
  expect(consoleSpy).toHaveBeenCalledWith(
'OAuth session creation failed:',
expect.any(Error),
  );
});

it('should handle null token data gracefully', async () => {
  const returnUrl = 'https://demo-hr-truename.vercel.app/callback';

  // Mock token generation returning null data
  const mockTokenQuery = {
single: vi.fn().mockResolvedValue({
  data: null,
  error: null,
}),
  };
  mockSupabaseClient.rpc.mockReturnValue(mockTokenQuery);

  const result = await createOAuthSession(
VALID_USER_ID,
VALID_APP_ID,
returnUrl,
mockSupabaseClient as any,
  );

  expect(result.success).toBe(false);
});
  });

  describe('buildRedirectUrl', () => {
it('should build redirect URL with token for URLs without existing params', async () => {
  const returnUrl = 'https://demo-hr-truename.vercel.app/callback';
  const token = VALID_TOKEN;

  const result = buildRedirectUrl(returnUrl, token);

  expect(result).toBe(`${returnUrl}?token=${token}`);
});

it('should build redirect URL with token for URLs with existing params', async () => {
  const returnUrl =
'https://demo-hr-truename.vercel.app/callback?existing=param';
  const token = VALID_TOKEN;

  const result = buildRedirectUrl(returnUrl, token);

  expect(result).toBe(`${returnUrl}&token=${token}`);
});

it('should handle complex URLs with multiple existing parameters', async () => {
  const returnUrl =
'https://demo-hr-truename.vercel.app/callback?param1=value1&param2=value2';
  const token = VALID_TOKEN;

  const result = buildRedirectUrl(returnUrl, token);

  expect(result).toBe(`${returnUrl}&token=${token}`);
  expect(result).toContain('param1=value1');
  expect(result).toContain('param2=value2');
  expect(result).toContain(`token=${token}`);
});

it('should use URL API for proper parameter encoding', async () => {
  const returnUrl = 'https://demo-hr-truename.vercel.app/callback';
  const tokenWithSpecialChars = 'tnp_token+with/special=chars&more';

  const result = buildRedirectUrl(returnUrl, tokenWithSpecialChars);

  expect(result).toContain(
'token=tnp_token%2Bwith%2Fspecial%3Dchars%26more',
  );
});

it('should handle invalid URLs with fallback method', async () => {
  const invalidUrl = 'not-a-valid-url';
  const token = VALID_TOKEN;

  const result = buildRedirectUrl(invalidUrl, token);

  expect(result).toBe(`${invalidUrl}?token=${encodeURIComponent(token)}`);
  expect(consoleWarnSpy).toHaveBeenCalledWith(
'URL parsing failed, using fallback method:',
expect.any(Error),
  );
});

it('should handle URLs with hash fragments correctly', async () => {
  const returnUrl = 'https://demo-hr-truename.vercel.app/callback#section';
  const token = VALID_TOKEN;

  const result = buildRedirectUrl(returnUrl, token);

  expect(result).toContain(`token=${token}`);
  expect(result).toContain('#section');
});

it('should handle fallback for malformed URL objects', async () => {
  const returnUrl =
'https://demo-hr-truename.vercel.app/callback?existing=param';
  const token = VALID_TOKEN;

  // Mock URL constructor to throw
  const originalURL = global.URL;
  global.URL = class extends originalURL {
constructor(url: string) {
  if (url.includes('callback')) {
throw new Error('Mocked URL parsing error');
  }
  super(url);
}
  } as any;

  const result = buildRedirectUrl(returnUrl, token);

  // Should use fallback method
  expect(result).toBe(`${returnUrl}&token=${encodeURIComponent(token)}`);
  expect(consoleWarnSpy).toHaveBeenCalled();

  // Restore original URL
  global.URL = originalURL;
});
  });

  describe('assignDefaultContextToApp', () => {
it('should assign default context successfully', async () => {
  // Mock successful assignment
  mockSupabaseClient.rpc.mockResolvedValue({
error: null,
  });

  const result = await assignDefaultContextToApp(
VALID_USER_ID,
VALID_APP_ID,
mockSupabaseClient as any,
  );

  expect(result).toBe(true);
  expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
'assign_default_context_to_app',
{
  p_profile_id: VALID_USER_ID,
  p_app_id: VALID_APP_ID,
},
  );
});

it('should return false for assignment errors', async () => {
  // Mock assignment error
  mockSupabaseClient.rpc.mockResolvedValue({
error: { message: 'Assignment failed', code: 'FUNCTION_ERROR' },
  });

  const result = await assignDefaultContextToApp(
VALID_USER_ID,
VALID_APP_ID,
mockSupabaseClient as any,
  );

  expect(result).toBe(false);
  expect(consoleSpy).toHaveBeenCalledWith(
'Default context assignment failed:',
expect.objectContaining({ message: 'Assignment failed' }),
  );
});

it('should return false for unexpected errors', async () => {
  // Mock unexpected error
  mockSupabaseClient.rpc.mockRejectedValue(
new Error('Database connection failed'),
  );

  const result = await assignDefaultContextToApp(
VALID_USER_ID,
VALID_APP_ID,
mockSupabaseClient as any,
  );

  expect(result).toBe(false);
  expect(consoleSpy).toHaveBeenCalledWith(
'Context assignment helper failed:',
expect.any(Error),
  );
});

it('should verify correct function call parameters', async () => {
  mockSupabaseClient.rpc.mockResolvedValue({ error: null });

  await assignDefaultContextToApp(
VALID_USER_ID,
VALID_APP_ID,
mockSupabaseClient as any,
  );

  expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
'assign_default_context_to_app',
{
  p_profile_id: VALID_USER_ID,
  p_app_id: VALID_APP_ID,
},
  );
  expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);
});
  });

  describe('validateTokenFormat', () => {
it('should return true for valid token format', () => {
  const validTokens = [
'tnp_' + 'a'.repeat(32),
'tnp_' + 'f'.repeat(32),
'tnp_0123456789abcdef0123456789abcdef',
'tnp_fedcba9876543210fedcba9876543210',
  ];

  validTokens.forEach((token) => {
expect(validateTokenFormat(token)).toBe(true);
  });
});

it('should return false for invalid token formats', () => {
  const invalidTokens = [
'invalid-token',
'tnp_short',
'tnp_' + 'g'.repeat(32), // 'g' not valid hex
'tnp_' + 'a'.repeat(31), // too short
'tnp_' + 'a'.repeat(33), // too long
'TNP_' + 'a'.repeat(32), // wrong prefix case
'otp_' + 'a'.repeat(32), // wrong prefix
'tnp-' + 'a'.repeat(32), // wrong separator
'', // empty string
'tnp_', // prefix only
  ];

  invalidTokens.forEach((token) => {
expect(validateTokenFormat(token)).toBe(false);
  });
});

it('should handle edge cases', () => {
  expect(validateTokenFormat('tnp_0000000000000000000000000000000')).toBe(
false,
  ); // 31 chars
  expect(validateTokenFormat('tnp_00000000000000000000000000000000')).toBe(
true,
  ); // 32 chars
  expect(validateTokenFormat('tnp_000000000000000000000000000000000')).toBe(
false,
  ); // 33 chars
});

it('should validate exact hex character requirements', () => {
  // All valid hex characters
  expect(validateTokenFormat('tnp_0123456789abcdef0123456789abcdef')).toBe(
true,
  );

  // Invalid characters
  expect(validateTokenFormat('tnp_0123456789abcdef0123456789abcdeg')).toBe(
false,
  ); // 'g'
  expect(validateTokenFormat('tnp_0123456789abcdef0123456789abcdeG')).toBe(
false,
  ); // uppercase
  expect(validateTokenFormat('tnp_0123456789abcdef0123456789abcde!')).toBe(
false,
  ); // special char
});
  });

  describe('validateReturnUrl', () => {
it('should return true for valid HTTPS URLs', () => {
  const validUrls = [
'https://demo-hr-truename.vercel.app/callback',
'https://demo-chat-truename.vercel.app/auth',
'https://example.com/path/to/callback',
  ];

  validUrls.forEach((url) => {
expect(validateReturnUrl(url)).toBe(true);
  });
});

it('should return true for localhost URLs', () => {
  const localhostUrls = [
'http://localhost:3000/callback',
'http://localhost:8080/auth',
'https://localhost:3000/callback',
'http://127.0.0.1:3000/callback',
'https://127.0.0.1:8080/auth',
  ];

  localhostUrls.forEach((url) => {
expect(validateReturnUrl(url)).toBe(true);
  });
});

it('should return false for non-HTTPS URLs (except localhost)', () => {
  const insecureUrls = [
'http://example.com/callback',
'http://demo-hr-truename.vercel.app/callback',
'ftp://example.com/callback',
  ];

  insecureUrls.forEach((url) => {
expect(validateReturnUrl(url)).toBe(false);
  });
});

it('should return false for invalid URL formats', () => {
  const invalidUrls = [
'not-a-url',
'just-text',
'http://',
'https://',
'',
'file:///etc/passwd',
  ];

  invalidUrls.forEach((url) => {
expect(validateReturnUrl(url)).toBe(false);
  });
});

it('should handle URLs with various protocols', () => {
  expect(validateReturnUrl('https://example.com')).toBe(true);
  expect(validateReturnUrl('http://localhost:3000')).toBe(true);
  expect(validateReturnUrl('http://127.0.0.1:8080')).toBe(true);
  expect(validateReturnUrl('ftp://example.com')).toBe(false);
  expect(validateReturnUrl('file://example.com')).toBe(false);
  expect(validateReturnUrl('data:text/plain,hello')).toBe(false);
});

it('should handle edge cases in hostname detection', () => {
  expect(validateReturnUrl('http://localhost/callback')).toBe(true);
  expect(validateReturnUrl('http://127.0.0.1/callback')).toBe(true);
  expect(validateReturnUrl('http://127.0.0.2/callback')).toBe(false); // Not 127.0.0.1
  expect(validateReturnUrl('http://localhosts/callback')).toBe(false); // Not exactly localhost
});

it('should handle malformed URL exceptions', () => {
  // These should not throw, just return false
  expect(validateReturnUrl('http://[invalid-ipv6]/callback')).toBe(false);
  expect(validateReturnUrl('https://domain with spaces.com/callback')).toBe(
false,
  );
});
  });

  describe('Performance Requirements', () => {
it('should complete all helper functions within performance requirements', () => {
  // Test synchronous helpers
  const startTime = Date.now();

  validateTokenFormat(VALID_TOKEN);
  validateReturnUrl('https://example.com/callback');
  buildRedirectUrl('https://example.com/callback', VALID_TOKEN);

  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(10); // Should be very fast for sync operations
});

it('should handle multiple concurrent validation calls efficiently', () => {
  const tokens = Array(100)
.fill(0)
.map((_, i) => `tnp_${'a'.repeat(31)}${i % 10}`);
  const urls = Array(100)
.fill(0)
.map(() => 'https://example.com/callback');

  const startTime = Date.now();

  tokens.forEach((token) => validateTokenFormat(token));
  urls.forEach((url) => validateReturnUrl(url));

  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(50); // Should handle many calls quickly
});
  });

  describe('Edge Cases and Error Handling', () => {
it('should handle null and undefined inputs gracefully', () => {
  expect(validateTokenFormat(null as any)).toBe(false);
  expect(validateTokenFormat(undefined as any)).toBe(false);
  expect(validateReturnUrl(null as any)).toBe(false);
  expect(validateReturnUrl(undefined as any)).toBe(false);
});

it('should handle empty strings appropriately', () => {
  expect(validateTokenFormat('')).toBe(false);
  expect(validateReturnUrl('')).toBe(false);
  expect(buildRedirectUrl('', 'token')).toBe('?token=token');
  expect(buildRedirectUrl('https://example.com', '')).toBe(
'https://example.com/?token=',
  );
});

it('should handle very long inputs without crashing', () => {
  const longString = 'a'.repeat(10000);
  expect(validateTokenFormat(longString)).toBe(false);
  expect(validateReturnUrl(longString)).toBe(false);
});

it('should handle special characters in tokens and URLs', () => {
  expect(validateTokenFormat('tnp_' + 'a'.repeat(31) + '!')).toBe(false);
  expect(
buildRedirectUrl(
  'https://example.com/callback',
  'token+with&special=chars',
),
  ).toContain('token%2Bwith%26special%3Dchars');
});
  });
});
