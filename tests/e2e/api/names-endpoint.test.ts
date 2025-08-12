import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { AuthTestHelper } from '../../utils/auth-helpers';

test.describe('GET /api/names/[profileId]', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should return name variants for authenticated user', async ({
page,
  }) => {
const uniqueId = Math.random().toString(36).substring(7);

// Create test user session
const { userId, token } = await AuthTestHelper.createTestUserSession(
  `test-${uniqueId}@example.com`,
);

// Update profile ID to match auth user ID
await DatabaseTestHelper.createTestName(userId, 'Test Legal Name', 'LEGAL');
await DatabaseTestHelper.createTestName(
  userId,
  'Test Preferred',
  'PREFERRED',
);
await DatabaseTestHelper.createTestName(userId, 'TestNick', 'NICKNAME');

// Make API request with valid JWT token
const response = await page.request.get(`/api/names/${userId}`, {
  headers: {
Authorization: `Bearer ${token}`,
  },
});

expect(response.status()).toBe(200);
const data = await response.json();

expect(data).toMatchObject({
  success: true,
  data: {
names: expect.arrayContaining([
  expect.objectContaining({
nameText: 'Test Legal Name',
nameType: 'LEGAL',
isPreferred: false,
  }),
  expect.objectContaining({
nameText: 'Test Preferred',
nameType: 'PREFERRED',
isPreferred: true,
  }),
  expect.objectContaining({
nameText: 'TestNick',
nameType: 'NICKNAME',
isPreferred: false,
  }),
]),
total: 3,
profileId: userId,
metadata: expect.objectContaining({
  userId: userId,
  isOwner: true,
}),
  },
  requestId: expect.any(String),
  timestamp: expect.any(String),
});
  });

  test('should reject requests without authentication token', async ({
page,
  }) => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createTestProfile(uniqueId);

const response = await page.request.get(`/api/names/${profile.id}`);

expect(response.status()).toBe(401);
const data = await response.json();
// Updated for Phase 2: JSend format and standardized error codes
expect(data).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_REQUIRED',
message: 'Missing authorization token',
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should reject requests with invalid JWT token', async ({ page }) => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createTestProfile(uniqueId);

const response = await page.request.get(`/api/names/${profile.id}`, {
  headers: {
Authorization: 'Bearer invalid-token-here',
  },
});

expect(response.status()).toBe(401);
const data = await response.json();
// Updated for Phase 2: JSend format and standardized error codes
expect(data).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_FAILED',
message: expect.stringContaining('Authentication failed'),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should reject access to other users profiles', async ({ page }) => {
const uniqueId = Math.random().toString(36).substring(7);

// Create two separate users
const { token: user1Token } = await AuthTestHelper.createTestUserSession(
  `test1-${uniqueId}@example.com`,
);
const { userId: user2Id } = await AuthTestHelper.createTestUserSession(
  `test2-${uniqueId}@example.com`,
);

// Try to access user2's names with user1's token
const response = await page.request.get(`/api/names/${user2Id}`, {
  headers: {
Authorization: `Bearer ${user1Token}`,
  },
});

expect(response.status()).toBe(403);
const data = await response.json();
// Updated for Phase 2: JSend format and standardized error codes
expect(data).toMatchObject({
  success: false,
  error: {
code: 'AUTHORIZATION_FAILED',
message: expect.stringContaining('Access denied'),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle invalid UUID format for profileId', async ({ page }) => {
const uniqueId = Math.random().toString(36).substring(7);
const { token } = await AuthTestHelper.createTestUserSession(
  `test-invalid-uuid-${uniqueId}@example.com`,
);

const response = await page.request.get('/api/names/invalid-uuid-format', {
  headers: {
Authorization: `Bearer ${token}`,
  },
});

expect(response.status()).toBe(400);
const data = await response.json();
// Updated for Phase 2: JSend format with nested error structure
expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid profile ID parameter',
details: expect.arrayContaining([
  expect.objectContaining({
field: 'profileId',
message: 'Profile ID must be a valid UUID',
  }),
]),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should filter names by type using query parameters', async ({
page,
  }) => {
const uniqueId = Math.random().toString(36).substring(7);
const { userId, token } = await AuthTestHelper.createTestUserSession(
  `test-filter-${uniqueId}@example.com`,
);

// Create names with different types
await DatabaseTestHelper.createTestName(userId, 'Legal Name', 'LEGAL');
await DatabaseTestHelper.createTestName(
  userId,
  'Preferred Name',
  'PREFERRED',
);
await DatabaseTestHelper.createTestName(userId, 'Nickname', 'NICKNAME');

// Test filtering by LEGAL type
const response = await page.request.get(
  `/api/names/${userId}?nameType=LEGAL`,
  {
headers: {
  Authorization: `Bearer ${token}`,
},
  },
);

expect(response.status()).toBe(200);
const data = await response.json();
expect(data.data.names).toHaveLength(1);
expect(data.data.names[0].nameType).toBe('LEGAL');
expect(data.data.metadata.filterApplied.nameType).toBe('LEGAL');
  });

  test('should handle limit query parameter', async ({ page }) => {
const uniqueId = Math.random().toString(36).substring(7);
const { userId, token } = await AuthTestHelper.createTestUserSession(
  `test-limit-${uniqueId}@example.com`,
);

// Create multiple names
await DatabaseTestHelper.createTestName(userId, 'Name 1', 'LEGAL');
await DatabaseTestHelper.createTestName(userId, 'Name 2', 'PREFERRED');
await DatabaseTestHelper.createTestName(userId, 'Name 3', 'NICKNAME');

// Test limiting results to 2
const response = await page.request.get(`/api/names/${userId}?limit=2`, {
  headers: {
Authorization: `Bearer ${token}`,
  },
});

expect(response.status()).toBe(200);
const data = await response.json();
expect(data.data.names.length).toBeLessThanOrEqual(2);
expect(data.data.metadata.filterApplied.limit).toBe(2);
  });

  test('should handle invalid query parameters', async ({ page }) => {
const uniqueId = Math.random().toString(36).substring(7);
const { userId, token } = await AuthTestHelper.createTestUserSession(
  `test-invalid-query-${uniqueId}@example.com`,
);

// Test invalid limit parameter
const response = await page.request.get(`/api/names/${userId}?limit=999`, {
  headers: {
Authorization: `Bearer ${token}`,
  },
});

expect(response.status()).toBe(400);
const data = await response.json();
// Updated for Phase 2: JSend format with nested error structure
expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid query parameters',
details: expect.any(Array),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle unsupported HTTP methods', async ({ page }) => {
const uniqueId = Math.random().toString(36).substring(7);
const { userId, token } = await AuthTestHelper.createTestUserSession(
  `test-methods-${uniqueId}@example.com`,
);

// Test POST method
const postResponse = await page.request.post(`/api/names/${userId}`, {
  headers: {
Authorization: `Bearer ${token}`,
  },
});

expect(postResponse.status()).toBe(405);
const postData = await postResponse.json();
// Updated for Phase 2: JSend format with nested error structure
expect(postData).toMatchObject({
  success: false,
  error: {
code: 'METHOD_NOT_ALLOWED',
message: 'Method not allowed. Use GET to retrieve names.',
details: {
  allowedMethods: ['GET'],
},
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});

// Test PUT method
const putResponse = await page.request.put(`/api/names/${userId}`, {
  headers: {
Authorization: `Bearer ${token}`,
  },
});

expect(putResponse.status()).toBe(405);
  });
});
