// TrueNamePath: Context Management API Tests
// Tests for POST/GET /api/contexts and PUT/DELETE /api/contexts/[id]
// Date: August 14, 2025
// Academic project - comprehensive endpoint testing

import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { AuthTestHelper } from '../../utils/auth-helpers';

test.describe('Context Management API - Step 11', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.describe('POST /api/contexts - Create Context', () => {
test('should create a new context successfully', async ({ request }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testEmail = `test-contexts-${uniqueId}@example.com`;

  const { userId, token } =
await AuthTestHelper.createTestUserSession(testEmail);

  const response = await request.post(
'http://localhost:3000/api/contexts',
{
  headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json',
  },
  data: {
context_name: 'Work Colleagues',
description: 'Professional contacts at the office',
  },
},
  );

  expect(response.status()).toBe(200);
  const body = await response.json();

  expect(body).toMatchObject({
success: true,
data: {
  context: {
id: expect.any(String),
context_name: 'Work Colleagues',
description: 'Professional contacts at the office',
created_at: expect.any(String),
updated_at: expect.any(String),
  },
},
requestId: expect.any(String),
timestamp: expect.any(String),
  });
});

test('should create context with minimal data (no description)', async ({
  request,
}) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testEmail = `test-contexts-${uniqueId}@example.com`;

  const { userId, token } =
await AuthTestHelper.createTestUserSession(testEmail);

  const response = await request.post(
'http://localhost:3000/api/contexts',
{
  headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json',
  },
  data: {
context_name: 'Gaming Friends',
  },
},
  );

  expect(response.status()).toBe(200);
  const body = await response.json();

  expect(body.success).toBe(true);
  expect(body.data.context.context_name).toBe('Gaming Friends');
  expect(body.data.context.description).toBeNull();
});

test('should reject duplicate context names', async ({ request }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testEmail = `test-contexts-${uniqueId}@example.com`;

  const { userId, token } =
await AuthTestHelper.createTestUserSession(testEmail);

  // Create first context
  await request.post('http://localhost:3000/api/contexts', {
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
},
data: {
  context_name: 'Unique Context',
  description: 'First context',
},
  });

  // Try to create duplicate
  const response = await request.post(
'http://localhost:3000/api/contexts',
{
  headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json',
  },
  data: {
context_name: 'Unique Context',
description: 'Duplicate attempt',
  },
},
  );

  expect(response.status()).toBe(400);
  const body = await response.json();

  expect(body).toMatchObject({
success: false,
error: {
  code: expect.any(String),
  message: 'Context name already exists',
},
requestId: expect.any(String),
timestamp: expect.any(String),
  });
});

test('should require authentication', async ({ request }) => {
  const response = await request.post(
'http://localhost:3000/api/contexts',
{
  headers: {
'Content-Type': 'application/json',
  },
  data: {
context_name: 'Test Context',
  },
},
  );

  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.error?.message).toContain('authorization');
});
  });

  test.describe('GET /api/contexts - List Contexts', () => {
test('should return default contexts for new user', async ({ request }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testEmail = `test-contexts-${uniqueId}@example.com`;

  const { userId, token } =
await AuthTestHelper.createTestUserSession(testEmail);

  const response = await request.get('http://localhost:3000/api/contexts', {
headers: {
  Authorization: `Bearer ${token}`,
},
  });

  expect(response.status()).toBe(200);
  const body = await response.json();

  expect(body).toMatchObject({
success: true,
data: {
  contexts: expect.arrayContaining([
expect.objectContaining({ context_name: 'Professional' }),
expect.objectContaining({ context_name: 'Social' }),
expect.objectContaining({ context_name: 'Public' }),
  ]),
},
requestId: expect.any(String),
timestamp: expect.any(String),
  });
});

test('should return contexts with statistics', async ({ request }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testEmail = `test-contexts-${uniqueId}@example.com`;

  const { userId, token } =
await AuthTestHelper.createTestUserSession(testEmail);

  // Create multiple contexts
  await request.post('http://localhost:3000/api/contexts', {
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
},
data: {
  context_name: 'Context One',
  description: 'First context',
},
  });

  await request.post('http://localhost:3000/api/contexts', {
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
},
data: {
  context_name: 'Context Two',
},
  });

  const response = await request.get('http://localhost:3000/api/contexts', {
headers: {
  Authorization: `Bearer ${token}`,
},
  });

  expect(response.status()).toBe(200);
  const body = await response.json();

  expect(body.success).toBe(true);
  expect(body.data.contexts).toHaveLength(5); // 3 default + 2 created

  // Check that contexts include statistics
  for (const context of body.data.contexts) {
expect(context).toMatchObject({
  id: expect.any(String),
  context_name: expect.any(String),
  created_at: expect.any(String),
  updated_at: expect.any(String),
  name_assignments_count: expect.any(Number),
  has_active_consents: expect.any(Boolean),
});
  }
});

test('should require authentication', async ({ request }) => {
  const response = await request.get('http://localhost:3000/api/contexts');

  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.success).toBe(false);
});
  });

  test.describe('Individual Context Operations', () => {
test('should update context name and description', async ({ request }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testEmail = `test-contexts-${uniqueId}@example.com`;

  const { userId, token } =
await AuthTestHelper.createTestUserSession(testEmail);

  // Create a context first
  const createResponse = await request.post(
'http://localhost:3000/api/contexts',
{
  headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json',
  },
  data: {
context_name: 'Original Name',
description: 'Original description',
  },
},
  );

  const createBody = await createResponse.json();
  const contextId = createBody.data.context.id;

  // Update the context
  const response = await request.put(
`http://localhost:3000/api/contexts/${contextId}`,
{
  headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json',
  },
  data: {
context_name: 'Updated Name',
description: 'Updated description',
  },
},
  );

  expect(response.status()).toBe(200);
  const body = await response.json();

  expect(body).toMatchObject({
success: true,
data: {
  context: {
id: contextId,
context_name: 'Updated Name',
description: 'Updated description',
updated_at: expect.any(String),
  },
},
requestId: expect.any(String),
timestamp: expect.any(String),
  });
});

test('should delete context successfully', async ({ request }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const testEmail = `test-contexts-${uniqueId}@example.com`;

  const { userId, token } =
await AuthTestHelper.createTestUserSession(testEmail);

  // Create a context first
  const createResponse = await request.post(
'http://localhost:3000/api/contexts',
{
  headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json',
  },
  data: {
context_name: 'To Be Deleted',
description: 'This context will be deleted',
  },
},
  );

  const createBody = await createResponse.json();
  const contextId = createBody.data.context.id;

  // Delete the context
  const response = await request.delete(
`http://localhost:3000/api/contexts/${contextId}?force=true`,
{
  headers: {
Authorization: `Bearer ${token}`,
  },
},
  );

  expect(response.status()).toBe(200);
  const body = await response.json();

  expect(body.success).toBe(true);
  expect(body.data.context.id).toBe(contextId);
  expect(body.data.safeguards).toMatchObject({
name_assignments_count: 0,
active_consents_count: 0,
can_delete: true,
deletion_impacts: [],
  });
});
  });
});
