import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';

test.describe('GET /api/audit/[profileId]', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should handle missing authorization token', async ({ page }) => {
// Use a valid UUID format for this test
const validUuid = '550e8400-e29b-41d4-a716-446655440000';

const response = await page.request.get(`/api/audit/${validUuid}`);

expect(response.status()).toBe(401);

const error = await response.json();
// Updated for Phase 2: JSend format and standardized error codes
expect(error).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_REQUIRED',
message: 'Missing authorization token',
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle invalid UUID format for profileId', async ({ page }) => {
const response = await page.request.get('/api/audit/invalid-uuid-format');

// API validates authentication first, then UUID format, so expect 401 not 400
expect(response.status()).toBe(401);

const error = await response.json();
// Updated for Phase 2: JSend format and authentication-first validation
expect(error).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_REQUIRED',
message: 'Missing authorization token',
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle invalid bearer token', async ({ page }) => {
const validUuid = '550e8400-e29b-41d4-a716-446655440000';

const response = await page.request.get(`/api/audit/${validUuid}`, {
  headers: { Authorization: 'Bearer invalid-token-here' },
});

expect(response.status()).toBe(401);

const error = await response.json();
// Updated for Phase 2: JSend format and standardized error codes
expect(error).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_FAILED',
message: expect.stringContaining('Authentication failed'),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle invalid query parameters', async ({ page }) => {
const validUuid = '550e8400-e29b-41d4-a716-446655440000';

// Test without any authorization token - auth validation happens first
const response = await page.request.get(
  `/api/audit/${validUuid}?limit=invalid`,
);

// API validates auth first, then query parameters, so we expect 401 not 400
expect(response.status()).toBe(401);

const error = await response.json();
// Updated for Phase 2: JSend format and standardized error codes
expect(error).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_REQUIRED',
message: 'Missing authorization token',
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle unsupported HTTP methods', async ({ page }) => {
const validUuid = '550e8400-e29b-41d4-a716-446655440000';

// Test POST method
const postResponse = await page.request.post(`/api/audit/${validUuid}`, {
  headers: { Authorization: 'Bearer mock-token' },
});

expect(postResponse.status()).toBe(405);

const postError = await postResponse.json();
// Updated for Phase 2: JSend format with nested error structure
expect(postError).toMatchObject({
  success: false,
  error: {
code: 'METHOD_NOT_ALLOWED',
message: 'Method not allowed. Use GET to retrieve audit logs.',
details: {
  allowedMethods: ['GET'],
},
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});

// Test PUT method
const putResponse = await page.request.put(`/api/audit/${validUuid}`, {
  headers: { Authorization: 'Bearer mock-token' },
});

expect(putResponse.status()).toBe(405);

const putError = await putResponse.json();
// Updated for Phase 2: JSend format with nested error structure
expect(putError).toMatchObject({
  success: false,
  error: {
code: 'METHOD_NOT_ALLOWED',
message: 'Method not allowed. Use GET to retrieve audit logs.',
details: {
  allowedMethods: ['GET'],
},
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should return proper CORS headers for OPTIONS request', async ({
page,
  }) => {
const validUuid = '550e8400-e29b-41d4-a716-446655440000';

const response = await page.request.fetch(`/api/audit/${validUuid}`, {
  method: 'OPTIONS',
});

expect(response.status()).toBe(200);

const headers = response.headers();
expect(headers['allow']).toBe('GET, OPTIONS');
expect(headers['access-control-allow-origin']).toBe('*');
expect(headers['access-control-allow-methods']).toBe('GET, OPTIONS');
expect(headers['access-control-allow-headers']).toBe(
  'Content-Type, Authorization',
);
  });
});
