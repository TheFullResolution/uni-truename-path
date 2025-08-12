import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';

test.describe('POST /api/names/resolve - Name Resolution API', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should resolve names with valid request parameters', async ({
request,
  }) => {
const uniqueId = Math.random().toString(36).substring(7);

// Create test user and names
const targetUser = await DatabaseTestHelper.createTestProfile(
  `target-${uniqueId}`,
);
await DatabaseTestHelper.createTestName(
  targetUser.id,
  'Target Legal Name',
  'LEGAL',
);
await DatabaseTestHelper.createTestName(
  targetUser.id,
  'Target Preferred',
  'PREFERRED',
);

const requesterUser = await DatabaseTestHelper.createTestProfile(
  `requester-${uniqueId}`,
);

const response = await request.post(
  'http://localhost:3000/api/names/resolve',
  {
headers: { 'Content-Type': 'application/json' },
data: {
  targetUserId: targetUser.id,
  requesterUserId: requesterUser.id,
  contextName: 'Professional Network',
},
  },
);

expect(response.status()).toBe(200);
const data = await response.json();

expect(data).toMatchObject({
  success: true,
  data: {
name: expect.any(String),
resolvedAt: expect.any(String),
source: expect.stringMatching(
  /^(consent|context|preferred|preferred_fallback)$/,
),
metadata: {
  resolutionTimestamp: expect.any(String),
  hadRequester: true,
  requestedContext: 'Professional Network',
},
  },
  requestId: expect.any(String),
  timestamp: expect.any(String),
});
  });

  test('should reject when requesterUserId equals targetUserId', async ({
request,
  }) => {
const uniqueId = Math.random().toString(36).substring(7);
const user = await DatabaseTestHelper.createTestProfile(`user-${uniqueId}`);

const response = await request.post(
  'http://localhost:3000/api/names/resolve',
  {
headers: { 'Content-Type': 'application/json' },
data: {
  targetUserId: user.id,
  requesterUserId: user.id, // Same as target - should fail validation
  contextName: 'Professional Network',
},
  },
);

expect(response.status()).toBe(400);
const data = await response.json();

expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid request parameters',
details: expect.arrayContaining([
  expect.objectContaining({
field: 'requesterUserId',
message: 'Requester user ID cannot be the same as target user ID',
  }),
]),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle malformed JSON request body', async ({ request }) => {
const response = await request.post(
  'http://localhost:3000/api/names/resolve',
  {
headers: { 'Content-Type': 'application/json' },
data: 'invalid-json',
  },
);

expect(response.status()).toBe(400);
const data = await response.json();

// The string "invalid-json" gets parsed as a valid JSON string, then fails validation
expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid request parameters',
details: expect.arrayContaining([
  expect.objectContaining({
field: '',
message: 'Invalid input',
  }),
]),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should validate UUID format for targetUserId', async ({ request }) => {
const response = await request.post(
  'http://localhost:3000/api/names/resolve',
  {
headers: { 'Content-Type': 'application/json' },
data: {
  targetUserId: 'invalid-uuid-format',
  requesterUserId: '550e8400-e29b-41d4-a716-446655440001',
  contextName: 'Professional Network',
},
  },
);

expect(response.status()).toBe(400);
const data = await response.json();

expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid request parameters',
details: expect.arrayContaining([
  expect.objectContaining({
field: 'targetUserId',
message: 'Target user ID must be a valid UUID',
  }),
]),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should validate contextName format', async ({ request }) => {
const uniqueId = Math.random().toString(36).substring(7);
const user = await DatabaseTestHelper.createTestProfile(`user-${uniqueId}`);

const response = await request.post(
  'http://localhost:3000/api/names/resolve',
  {
headers: { 'Content-Type': 'application/json' },
data: {
  targetUserId: user.id,
  contextName: 'Invalid@Context#Name!', // Contains invalid characters
},
  },
);

expect(response.status()).toBe(400);
const data = await response.json();

expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid request parameters',
details: expect.arrayContaining([
  expect.objectContaining({
field: 'contextName',
message: 'Context name contains invalid characters',
  }),
]),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle missing required fields', async ({ request }) => {
const response = await request.post(
  'http://localhost:3000/api/names/resolve',
  {
headers: { 'Content-Type': 'application/json' },
data: {
  // Missing targetUserId
  requesterUserId: '550e8400-e29b-41d4-a716-446655440001',
  contextName: 'Professional Network',
},
  },
);

expect(response.status()).toBe(400);
const data = await response.json();

expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid request parameters',
details: expect.arrayContaining([
  expect.objectContaining({
field: 'targetUserId',
message: 'Invalid input',
  }),
]),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle unsupported HTTP methods', async ({ request }) => {
// Test GET method
const getResponse = await request.get(
  'http://localhost:3000/api/names/resolve',
);
expect(getResponse.status()).toBe(405);

const getData = await getResponse.json();
expect(getData).toMatchObject({
  success: false,
  error: {
code: 'METHOD_NOT_ALLOWED',
message: 'Method not allowed. Use POST to resolve names.',
details: {
  allowedMethods: ['POST'],
},
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});

// Test PUT method
const putResponse = await request.put(
  'http://localhost:3000/api/names/resolve',
  {
data: { test: 'data' },
  },
);
expect(putResponse.status()).toBe(405);

// Test DELETE method
const deleteResponse = await request.delete(
  'http://localhost:3000/api/names/resolve',
);
expect(deleteResponse.status()).toBe(405);
  });

  test('should handle OPTIONS request for CORS preflight', async ({
request,
  }) => {
const response = await request.fetch(
  'http://localhost:3000/api/names/resolve',
  {
method: 'OPTIONS',
  },
);

expect(response.status()).toBe(200);
expect(response.headers()['allow']).toBe('POST, OPTIONS');
expect(response.headers()['access-control-allow-origin']).toBe('*');
expect(response.headers()['access-control-allow-methods']).toBe(
  'POST, OPTIONS',
);
  });

  test('should work without authentication (optional auth)', async ({
request,
  }) => {
const uniqueId = Math.random().toString(36).substring(7);

// Create test user and names
const targetUser = await DatabaseTestHelper.createTestProfile(
  `target-${uniqueId}`,
);
await DatabaseTestHelper.createTestName(
  targetUser.id,
  'Target Preferred Name',
  'PREFERRED',
);

// Make request without authorization header
const response = await request.post(
  'http://localhost:3000/api/names/resolve',
  {
headers: { 'Content-Type': 'application/json' },
data: {
  targetUserId: targetUser.id,
  contextName: 'Public Context',
},
  },
);

expect(response.status()).toBe(200);
const data = await response.json();

expect(data).toMatchObject({
  success: true,
  data: {
name: expect.any(String),
resolvedAt: expect.any(String),
source: expect.stringMatching(
  /^(consent|context|preferred|preferred_fallback)$/,
),
metadata: {
  resolutionTimestamp: expect.any(String),
  hadRequester: false,
},
  },
  requestId: expect.any(String),
  timestamp: expect.any(String),
});
  });

  test('should include request ID in all responses', async ({ request }) => {
const response = await request.post(
  'http://localhost:3000/api/names/resolve',
  {
headers: { 'Content-Type': 'application/json' },
data: { invalid: 'data' },
  },
);

const data = await response.json();
expect(data).toHaveProperty('requestId');
expect(data.requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
  });

  test('should handle empty request body', async ({ request }) => {
const response = await request.post(
  'http://localhost:3000/api/names/resolve',
  {
headers: { 'Content-Type': 'application/json' },
data: {},
  },
);

expect(response.status()).toBe(400);
const data = await response.json();

expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid request parameters',
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });
});
