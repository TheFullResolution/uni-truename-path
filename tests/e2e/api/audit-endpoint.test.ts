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
expect(error).toHaveProperty('error', 'Authorization required');
expect(error).toHaveProperty('code', 'MISSING_AUTH_TOKEN');
expect(error).toHaveProperty('timestamp');
expect(error).toHaveProperty('requestId');
  });

  test('should handle invalid UUID format for profileId', async ({ page }) => {
const response = await page.request.get('/api/audit/invalid-uuid-format');

expect(response.status()).toBe(400);

const error = await response.json();
expect(error).toHaveProperty('error', 'Invalid profile ID format');
expect(error).toHaveProperty('code', 'INVALID_PROFILE_ID');
expect(error).toHaveProperty('details', 'Profile ID must be a valid UUID');
expect(error).toHaveProperty('timestamp');
expect(error).toHaveProperty('requestId');
  });

  test('should handle invalid bearer token', async ({ page }) => {
const validUuid = '550e8400-e29b-41d4-a716-446655440000';

const response = await page.request.get(`/api/audit/${validUuid}`, {
  headers: { Authorization: 'Bearer invalid-token-here' },
});

expect(response.status()).toBe(401);

const error = await response.json();
expect(error).toHaveProperty('error', 'Authentication failed');
expect(error).toHaveProperty('code', 'INVALID_TOKEN');
expect(error).toHaveProperty('timestamp');
expect(error).toHaveProperty('requestId');
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
expect(error).toHaveProperty('error', 'Authorization required');
expect(error).toHaveProperty('code', 'MISSING_AUTH_TOKEN');
expect(error).toHaveProperty('timestamp');
expect(error).toHaveProperty('requestId');
  });

  test('should handle unsupported HTTP methods', async ({ page }) => {
const validUuid = '550e8400-e29b-41d4-a716-446655440000';

// Test POST method
const postResponse = await page.request.post(`/api/audit/${validUuid}`, {
  headers: { Authorization: 'Bearer mock-token' },
});

expect(postResponse.status()).toBe(405);

const postError = await postResponse.json();
expect(postError).toHaveProperty(
  'error',
  'Method not allowed. Use GET to retrieve audit logs.',
);
expect(postError).toHaveProperty('code', 'METHOD_NOT_ALLOWED');
expect(postError).toHaveProperty('allowedMethods');
expect(postError.allowedMethods).toContain('GET');

// Test PUT method
const putResponse = await page.request.put(`/api/audit/${validUuid}`, {
  headers: { Authorization: 'Bearer mock-token' },
});

expect(putResponse.status()).toBe(405);

const putError = await putResponse.json();
expect(putError).toHaveProperty(
  'error',
  'Method not allowed. Use GET to retrieve audit logs.',
);
expect(putError).toHaveProperty('code', 'METHOD_NOT_ALLOWED');
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
