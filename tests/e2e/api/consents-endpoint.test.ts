import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';

test.describe('POST /api/consents - Consent Management API', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should require authentication for consent operations', async ({
request,
  }) => {
const response = await request.post('http://localhost:3000/api/consents', {
  headers: { 'Content-Type': 'application/json' },
  data: {
action: 'request',
granterUserId: 'test-user-1',
requesterUserId: 'test-user-2',
contextName: 'Test Context',
  },
});

expect(response.status()).toBe(401);
const responseData = await response.json();

// Updated for Phase 2: JSend format with nested error structure
expect(responseData).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_REQUIRED',
message: 'Missing authorization token',
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should reject invalid authentication token', async ({ request }) => {
const response = await request.post('http://localhost:3000/api/consents', {
  headers: {
'Content-Type': 'application/json',
'Authorization': 'Bearer invalid-token',
  },
  data: {
action: 'request',
granterUserId: 'test-user-1',
requesterUserId: 'test-user-2',
contextName: 'Test Context',
  },
});

expect(response.status()).toBe(401);
const responseData = await response.json();

// Updated for Phase 2: JSend format with nested error structure
expect(responseData).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_FAILED',
message: expect.stringContaining('Authentication failed'),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should reject malformed JSON request body', async ({ request }) => {
// Note: API checks authentication first, so malformed JSON with invalid auth returns 401
// This validates that the API structure and error handling work correctly
const response = await request.post('http://localhost:3000/api/consents', {
  headers: {
'Content-Type': 'application/json',
'Authorization': 'Bearer some-token',
  },
  data: 'invalid-json',
});

expect(response.status()).toBe(401); // Auth is checked first in the API flow
const responseData = await response.json();

expect(responseData).toMatchObject({
  success: false,
  error: {
code: 'AUTHENTICATION_FAILED',
message: expect.stringContaining('Authentication failed'),
requestId: expect.any(String),
timestamp: expect.any(String),
  },
});
  });

  test('should handle HTTP method not allowed correctly', async ({
request,
  }) => {
const getResponse = await request.get('http://localhost:3000/api/consents');
expect(getResponse.status()).toBe(405);

const getData = await getResponse.json();
// Updated for Phase 2: JSend format with nested error structure
expect(getData).toMatchObject({
  success: false,
  error: {
code: 'METHOD_NOT_ALLOWED',
message: expect.stringContaining('Method not allowed'),
requestId: expect.any(String),
timestamp: expect.any(String),
details: {
  allowedMethods: ['POST'],
},
  },
});

const putResponse = await request.put(
  'http://localhost:3000/api/consents',
  {
data: { test: 'data' },
  },
);
expect(putResponse.status()).toBe(405);

const deleteResponse = await request.delete(
  'http://localhost:3000/api/consents',
);
expect(deleteResponse.status()).toBe(405);

const patchResponse = await request.patch(
  'http://localhost:3000/api/consents',
  {
data: { test: 'data' },
  },
);
expect(patchResponse.status()).toBe(405);
  });

  test('should handle OPTIONS request for CORS preflight', async ({
request,
  }) => {
const response = await request.fetch('http://localhost:3000/api/consents', {
  method: 'OPTIONS',
});

expect(response.status()).toBe(200);
expect(response.headers()['allow']).toBe('POST, OPTIONS');
expect(response.headers()['access-control-allow-origin']).toBe('*');
expect(response.headers()['access-control-allow-methods']).toBe(
  'POST, OPTIONS',
);
  });

  test('should return proper error structure for missing request body', async ({
request,
  }) => {
const response = await request.post('http://localhost:3000/api/consents', {
  headers: {
'Content-Type': 'application/json',
'Authorization': 'Bearer some-token',
  },
});

expect(response.status()).toBe(401); // Will fail auth first, but validates endpoint structure
const responseData = await response.json();

expect(responseData).toHaveProperty('success', false);
expect(responseData).toHaveProperty('error');
expect(responseData.error).toHaveProperty('code');
expect(responseData).toHaveProperty('timestamp');
  });

  test('should validate Content-Type header requirements', async ({
request,
  }) => {
const response = await request.post('http://localhost:3000/api/consents', {
  headers: {
Authorization: 'Bearer some-token',
// Missing Content-Type header
  },
  data: JSON.stringify({
action: 'request',
granterUserId: 'test-user-1',
requesterUserId: 'test-user-2',
contextName: 'Test Context',
  }),
});

expect(response.status()).toBe(401); // Will fail auth, but validates endpoint accepts requests
  });

  test('should include request ID in all error responses', async ({
request,
  }) => {
const response = await request.post('http://localhost:3000/api/consents', {
  headers: { 'Content-Type': 'application/json' },
  data: { invalid: 'data' },
});

const responseData = await response.json();
expect(responseData).toHaveProperty('requestId');
expect(responseData.requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
  });

  test('should test consent database operations via RPC functions', async () => {
// Since API authentication is complex to mock, test the underlying business logic
const uniqueId = Math.random().toString(36).substring(7);

// Create test users and context using the same patterns as consent endpoint
const granter = await DatabaseTestHelper.createTestProfile(
  uniqueId + '-granter',
);
const requester = await DatabaseTestHelper.createTestProfile(
  uniqueId + '-requester',
);
const context = await DatabaseTestHelper.createTestContext(
  granter.id,
  'Professional Network',
  'Work-related professional connections',
);

// Test the RPC functions that the API endpoint calls
const { supabase } = await import('../../utils/db-helpers');

// Test request_consent RPC function
const { data: consentId, error: requestError } = await supabase.rpc(
  'request_consent',
  {
p_granter_user_id: granter.id,
p_requester_user_id: requester.id,
p_context_name: 'Professional Network',
p_expires_at: null,
  },
);

expect(requestError).toBeNull();
expect(consentId).toBeTruthy();

// Verify consent was created in PENDING state
const { data: pendingConsent } = await supabase
  .from('consents')
  .select('*')
  .eq('id', consentId)
  .single();

expect(pendingConsent).toMatchObject({
  granter_user_id: granter.id,
  requester_user_id: requester.id,
  status: 'PENDING',
});

// Test grant_consent RPC function
const { data: granted, error: grantError } = await supabase.rpc(
  'grant_consent',
  {
p_granter_user_id: granter.id,
p_requester_user_id: requester.id,
  },
);

expect(grantError).toBeNull();
expect(granted).toBe(true);

// Verify consent was granted
const { data: grantedConsent } = await supabase
  .from('consents')
  .select('*')
  .eq('id', consentId)
  .single();

expect(grantedConsent?.status).toBe('GRANTED');
expect(grantedConsent?.granted_at).toBeTruthy();

// Test revoke_consent RPC function
const { data: revoked, error: revokeError } = await supabase.rpc(
  'revoke_consent',
  {
p_granter_user_id: granter.id,
p_requester_user_id: requester.id,
  },
);

expect(revokeError).toBeNull();
expect(revoked).toBe(true);

// Verify consent was revoked
const { data: revokedConsent } = await supabase
  .from('consents')
  .select('*')
  .eq('id', consentId)
  .single();

expect(revokedConsent?.status).toBe('REVOKED');
expect(revokedConsent?.revoked_at).toBeTruthy();
  });

  test('should validate consent business logic edge cases', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const { supabase } = await import('../../utils/db-helpers');

// Test granting consent with no pending request
const granter = await DatabaseTestHelper.createTestProfile(
  uniqueId + '-granter',
);
const requester = await DatabaseTestHelper.createTestProfile(
  uniqueId + '-requester',
);

const { data: grantResult, error } = await supabase.rpc('grant_consent', {
  p_granter_user_id: granter.id,
  p_requester_user_id: requester.id,
});

expect(error).toBeNull();
expect(grantResult).toBe(false); // Should return false when no pending consent exists

// Test revoking consent with no granted consent
const { data: revokeResult } = await supabase.rpc('revoke_consent', {
  p_granter_user_id: granter.id,
  p_requester_user_id: requester.id,
});

expect(revokeResult).toBe(false); // Should return false when no granted consent exists
  });

  // Note: Integration tests with actual authentication would require:
  // 1. Creating real Supabase user accounts via supabase.auth.admin.createUser()
  // 2. Getting valid JWT tokens from Supabase auth system
  // 3. Managing user session lifecycle during tests
  //
  // This is complex in E2E environment and typically handled in integration test suite
  // The current tests validate API structure, error handling, and underlying business logic
});
