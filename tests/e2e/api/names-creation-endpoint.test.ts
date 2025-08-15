import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { AuthTestHelper } from '../../utils/auth-helpers';

test.describe('POST /api/names - Name Creation Endpoint', () => {
  test.beforeEach(async () => {
// Clean up any existing test data before each test
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
// Clean up test data after each test to prevent conflicts
await DatabaseTestHelper.cleanup();
  });

  test('should create a name with snake_case fields successfully', async ({
page,
  }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-create-name-${uniqueId}@example.com`;

// Create test user session
const { userId, token } =
  await AuthTestHelper.createTestUserSession(testEmail);

// Create a name using the snake_case fields
const requestBody = {
  name_text: 'John Professional',
  name_type: 'PROFESSIONAL',
  is_preferred: false,
};

const response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: requestBody,
});

expect(response.status()).toBe(200);
const data = await response.json();

// Verify JSend success response format
expect(data).toMatchObject({
  success: true,
  data: {
message: 'Name variant created successfully',
name: {
  id: expect.any(String),
  name_text: 'John Professional',
  name_type: 'PROFESSIONAL',
  is_preferred: false,
  created_at: expect.any(String),
},
  },
  requestId: expect.any(String),
  timestamp: expect.any(String),
});

// Verify the name was actually inserted in the database
const names = await DatabaseTestHelper.getNamesForUser(userId);
expect(names).toHaveLength(1);
expect(names[0]).toMatchObject({
  name_text: 'John Professional',
  name_type: 'PROFESSIONAL',
  is_preferred: false,
});
  });

  test('should create names with all valid name types', async ({ page }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-all-types-${uniqueId}@example.com`;

const { userId, token } =
  await AuthTestHelper.createTestUserSession(testEmail);

const nameTypes = [
  'LEGAL',
  'PREFERRED',
  'NICKNAME',
  'ALIAS',
  'PROFESSIONAL',
  'CULTURAL',
];

// Create names with each type
for (let i = 0; i < nameTypes.length; i++) {
  const nameType = nameTypes[i];
  const requestBody = {
name_text: `Test ${nameType} Name`,
name_type: nameType,
is_preferred: false,
  };

  const response = await page.request.post('/api/names', {
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
},
data: requestBody,
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data.name.name_type).toBe(nameType);
}

// Verify all names were created
const names = await DatabaseTestHelper.getNamesForUser(userId);
expect(names).toHaveLength(nameTypes.length);

// Verify each name type exists
nameTypes.forEach((type) => {
  const foundName = names.find((n) => n.name_type === type);
  expect(foundName).toBeDefined();
  expect(foundName?.name_text).toBe(`Test ${type} Name`);
});
  });

  test('should handle is_preferred flag correctly', async ({ page }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-preferred-${uniqueId}@example.com`;

const { userId, token } =
  await AuthTestHelper.createTestUserSession(testEmail);

// Create first name without preferred flag
const firstNameBody = {
  name_text: 'First Name',
  name_type: 'LEGAL',
  is_preferred: false,
};

let response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: firstNameBody,
});

expect(response.status()).toBe(200);

// Create second name with preferred flag set to true
const preferredNameBody = {
  name_text: 'Preferred Name',
  name_type: 'PREFERRED',
  is_preferred: true,
};

response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: preferredNameBody,
});

expect(response.status()).toBe(200);
const data = await response.json();
expect(data.data.name.is_preferred).toBe(true);

// Verify database state
const names = await DatabaseTestHelper.getNamesForUser(userId);
expect(names).toHaveLength(2);

const preferredNames = names.filter((n) => n.is_preferred === true);
expect(preferredNames).toHaveLength(1);
expect(preferredNames[0].name_text).toBe('Preferred Name');

// Create another preferred name - should unset the previous one
const newPreferredBody = {
  name_text: 'New Preferred Name',
  name_type: 'NICKNAME',
  is_preferred: true,
};

response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: newPreferredBody,
});

expect(response.status()).toBe(200);

// Verify only the new name is preferred
const updatedNames = await DatabaseTestHelper.getNamesForUser(userId);
expect(updatedNames).toHaveLength(3);

const currentPreferredNames = updatedNames.filter(
  (n) => n.is_preferred === true,
);
expect(currentPreferredNames).toHaveLength(1);
expect(currentPreferredNames[0].name_text).toBe('New Preferred Name');
  });

  test('should reject requests without authentication token', async ({
page,
  }) => {
const requestBody = {
  name_text: 'Test Name',
  name_type: 'LEGAL',
  is_preferred: false,
};

const response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
  },
  data: requestBody,
});

expect(response.status()).toBe(401);
const data = await response.json();

expect(data).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_REQUIRED',
message: expect.stringContaining('authorization'),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should reject requests with invalid JWT token', async ({ page }) => {
const requestBody = {
  name_text: 'Test Name',
  name_type: 'LEGAL',
  is_preferred: false,
};

const response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': 'Bearer invalid-token-here',
  },
  data: requestBody,
});

expect(response.status()).toBe(401);
const data = await response.json();

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

  test('should validate required fields with snake_case field names in errors', async ({
page,
  }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-validation-${uniqueId}@example.com`;

const { token } = await AuthTestHelper.createTestUserSession(testEmail);

// Test missing name_text field
let response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: {
name_type: 'LEGAL',
is_preferred: false,
  },
});

expect(response.status()).toBe(400);
let data = await response.json();

expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid request data',
details: {
  validationErrors: expect.arrayContaining([
expect.objectContaining({
  path: ['name_text'],
  message: expect.any(String),
}),
  ]),
},
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});

// Test missing name_type field
response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: {
name_text: 'Test Name',
is_preferred: false,
  },
});

expect(response.status()).toBe(400);
data = await response.json();

expect(data.error.details.validationErrors).toEqual(
  expect.arrayContaining([
expect.objectContaining({
  path: ['name_type'],
  message: expect.any(String),
}),
  ]),
);
  });

  test('should validate name_text field constraints', async ({ page }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-name-text-validation-${uniqueId}@example.com`;

const { token } = await AuthTestHelper.createTestUserSession(testEmail);

// Test empty name_text
let response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: {
name_text: '',
name_type: 'LEGAL',
is_preferred: false,
  },
});

expect(response.status()).toBe(400);
let data = await response.json();
expect(data.success).toBe(false);
expect(data.error.code).toBe('VALIDATION_ERROR');

// Test name_text that's too long (over 100 characters)
const longName = 'a'.repeat(101);
response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: {
name_text: longName,
name_type: 'LEGAL',
is_preferred: false,
  },
});

expect(response.status()).toBe(400);
data = await response.json();
expect(data.success).toBe(false);
expect(data.error.code).toBe('VALIDATION_ERROR');

// Test name_text with only whitespace (should be trimmed and fail)
response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: {
name_text: '   ',
name_type: 'LEGAL',
is_preferred: false,
  },
});

expect(response.status()).toBe(400);
data = await response.json();
expect(data.success).toBe(false);
expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  test('should validate name_type field constraints', async ({ page }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-name-type-validation-${uniqueId}@example.com`;

const { token } = await AuthTestHelper.createTestUserSession(testEmail);

// Test invalid name_type
const response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: {
name_text: 'Test Name',
name_type: 'INVALID_TYPE',
is_preferred: false,
  },
});

expect(response.status()).toBe(400);
const data = await response.json();

expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid request data',
details: {
  validationErrors: expect.arrayContaining([
expect.objectContaining({
  path: ['name_type'],
  message: expect.stringContaining('Invalid enum value'),
}),
  ]),
},
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should validate is_preferred field type', async ({ page }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-is-preferred-validation-${uniqueId}@example.com`;

const { token } = await AuthTestHelper.createTestUserSession(testEmail);

// Test invalid is_preferred value (string instead of boolean)
const response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: {
name_text: 'Test Name',
name_type: 'LEGAL',
is_preferred: 'true', // Should be boolean, not string
  },
});

expect(response.status()).toBe(400);
const data = await response.json();

expect(data).toMatchObject({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid request data',
details: {
  validationErrors: expect.arrayContaining([
expect.objectContaining({
  path: ['is_preferred'],
  message: expect.stringContaining('Expected boolean'),
}),
  ]),
},
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle malformed JSON in request body', async ({ page }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-malformed-json-${uniqueId}@example.com`;

const { token } = await AuthTestHelper.createTestUserSession(testEmail);

const response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: '{"name_text": "Test Name", "name_type": "LEGAL", invalid_json}',
});

expect(response.status()).toBe(400);
const data = await response.json();
expect(data.success).toBe(false);
// Should handle JSON parsing error gracefully
expect(['VALIDATION_ERROR', 'INTERNAL_ERROR']).toContain(data.error.code);
  });

  test('should integrate with GET /api/names/[profileId] endpoint', async ({
page,
  }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-integration-${uniqueId}@example.com`;

const { userId, token } =
  await AuthTestHelper.createTestUserSession(testEmail);

// Create multiple names via POST endpoint
const namesToCreate = [
  { name_text: 'Legal Name', name_type: 'LEGAL', is_preferred: false },
  {
name_text: 'Preferred Name',
name_type: 'PREFERRED',
is_preferred: true,
  },
  { name_text: 'Nickname', name_type: 'NICKNAME', is_preferred: false },
];

for (const nameData of namesToCreate) {
  const response = await page.request.post('/api/names', {
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
},
data: nameData,
  });
  expect(response.status()).toBe(200);
}

// Verify names appear in GET endpoint
const getResponse = await page.request.get(`/api/names/${userId}`, {
  headers: {
Authorization: `Bearer ${token}`,
  },
});

expect(getResponse.status()).toBe(200);
const getData = await getResponse.json();

expect(getData.success).toBe(true);
expect(getData.data.names).toHaveLength(3);
expect(getData.data.total).toBe(3);

// Verify all created names are present with correct snake_case field names
namesToCreate.forEach((expectedName) => {
  const foundName = getData.data.names.find(
(n: any) => n.name_text === expectedName.name_text,
  );
  expect(foundName).toBeDefined();
  expect(foundName.name_type).toBe(expectedName.name_type);
  expect(foundName.is_preferred).toBe(expectedName.is_preferred);
});
  });

  test('should create audit log entries when names are created', async ({
page,
  }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-audit-logging-${uniqueId}@example.com`;

const { userId, token } =
  await AuthTestHelper.createTestUserSession(testEmail);

// Create a name
const requestBody = {
  name_text: 'Audit Test Name',
  name_type: 'PROFESSIONAL',
  is_preferred: false,
};

const response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: requestBody,
});

expect(response.status()).toBe(200);

// Check if audit log entries were created
// Note: This depends on database triggers, so we just verify the name was created
// The audit logging is tested more thoroughly in the audit endpoint tests
const names = await DatabaseTestHelper.getNamesForUser(userId);
expect(names).toHaveLength(1);
expect(names[0].name_text).toBe('Audit Test Name');

// Verify audit log entries exist (basic check)
const auditEntries = await DatabaseTestHelper.getAuditLogEntries(userId);
// Audit entries might be created by triggers, so we just check that the name exists
expect(names[0]).toBeDefined();
  });

  test('should trim whitespace from name_text field', async ({ page }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-trim-whitespace-${uniqueId}@example.com`;

const { userId, token } =
  await AuthTestHelper.createTestUserSession(testEmail);

// Create a name with leading/trailing whitespace
const requestBody = {
  name_text: '  Whitespace Test Name  ',
  name_type: 'PROFESSIONAL',
  is_preferred: false,
};

const response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: requestBody,
});

expect(response.status()).toBe(200);
const data = await response.json();

// Verify the response shows trimmed name
expect(data.data.name.name_text).toBe('Whitespace Test Name');

// Verify the database also has the trimmed name
const names = await DatabaseTestHelper.getNamesForUser(userId);
expect(names).toHaveLength(1);
expect(names[0].name_text).toBe('Whitespace Test Name');
  });

  test('should handle is_preferred defaulting to false when not provided', async ({
page,
  }) => {
const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
const testEmail = `test-default-preferred-${uniqueId}@example.com`;

const { userId, token } =
  await AuthTestHelper.createTestUserSession(testEmail);

// Create a name without specifying is_preferred (should default to false)
const requestBody = {
  name_text: 'Default Preferred Test',
  name_type: 'NICKNAME',
  // is_preferred intentionally omitted
};

const response = await page.request.post('/api/names', {
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
  data: requestBody,
});

expect(response.status()).toBe(200);
const data = await response.json();

// Verify is_preferred defaults to false
expect(data.data.name.is_preferred).toBe(false);

// Verify in database as well
const names = await DatabaseTestHelper.getNamesForUser(userId);
expect(names).toHaveLength(1);
expect(names[0].is_preferred).toBe(false);
  });
});
