import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { AuthTestHelper } from '../../utils/auth-helpers';

test.describe('GET /api/names', () => {
  test('should return name variants for authenticated user', async ({
page,
  }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-${uniqueId}@example.com`;

// Create test user session
const { userId, token } =
  await AuthTestHelper.createTestUserSession(testEmail);

// Update profile ID to match auth user ID
await DatabaseTestHelper.createTestName(
  userId,
  'Test Legal Name',
  'LEGAL',
  false,
);
await DatabaseTestHelper.createTestName(
  userId,
  'Test Preferred',
  'PREFERRED',
  true, // This should be the preferred name
);
await DatabaseTestHelper.createTestName(
  userId,
  'TestNick',
  'NICKNAME',
  false,
);

// Make API request with valid JWT token
const response = await page.request.get(`/api/names`, {
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
name_text: 'Test Legal Name',
name_type: 'LEGAL',
is_preferred: false,
  }),
  expect.objectContaining({
name_text: 'Test Preferred',
name_type: 'PREFERRED',
is_preferred: true,
  }),
  expect.objectContaining({
name_text: 'TestNick',
name_type: 'NICKNAME',
is_preferred: false,
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

const response = await page.request.get(`/api/names`);

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

const response = await page.request.get(`/api/names`, {
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

  test('should return only authenticated users names', async ({ page }) => {
const uniqueId = Math.random().toString(36).substring(7);

// Create two separate users
const { userId: user1Id, token: user1Token } =
  await AuthTestHelper.createTestUserSession(
`test1-${uniqueId}@example.com`,
  );
const { userId: user2Id } = await AuthTestHelper.createTestUserSession(
  `test2-${uniqueId}@example.com`,
);

// Create names for user1
await DatabaseTestHelper.createTestName(
  user1Id,
  'User1 Name',
  'LEGAL',
  false,
);

// Create names for user2 (should not be returned)
await DatabaseTestHelper.createTestName(
  user2Id,
  'User2 Name',
  'LEGAL',
  false,
);

// Access names with user1's token - should only get user1's names
const response = await page.request.get(`/api/names`, {
  headers: {
Authorization: `Bearer ${user1Token}`,
  },
});

expect(response.status()).toBe(200);
const data = await response.json();

// Should only contain user1's names
expect(data.success).toBe(true);
expect(data.data.names).toHaveLength(1);
expect(data.data.names[0].name_text).toBe('User1 Name');
expect(data.data.metadata.userId).toBe(user1Id);
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
expect(data.data.names[0].name_type).toBe('LEGAL');
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
});
