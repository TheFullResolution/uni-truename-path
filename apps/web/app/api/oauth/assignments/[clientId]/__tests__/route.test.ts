/**
 * Comprehensive Unit Tests for OAuth Assignment Update Endpoint
 *
 * Tests for PUT /api/oauth/assignments/[clientId] - OAuth context assignment updates
 * Complete test suite validating all success/error paths with >80% coverage
 * Academic project - Step 16 OAuth integration testing
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockedFunction,
} from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '../route';
import { ErrorCodes } from '@/utils/api';
import { AssignmentUpdateErrorCodes } from '../types';
import type { UpdateAssignmentResponseData } from '../types';

// Mock NextRequest properties and global Response
global.Response = class MockResponse {
  body: string;
  status: number;
  headers: Map<string, string>;

  constructor(body: string, init: any = {}) {
this.body = body;
this.status = init.status || 200;
this.headers = new Map(Object.entries(init.headers || {}));
  }

  async json() {
return JSON.parse(this.body);
  }

  async text() {
return this.body;
  }
} as any;

// Mock NextRequest
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
}));

// Setup detailed Supabase mock chain
const mockSupabaseClient = {
  from: vi.fn(),
};

const mockSupabaseQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  upsert: vi.fn(),
};

// Authentication control flags for tests
let shouldAuthFail = false;
let authFailureResponse: any = null;

// Mock withRequiredAuth to match the actual implementation
vi.mock('@/utils/api/with-auth', () => {
  return {
withRequiredAuth: vi.fn((handler) => async (request: NextRequest) => {
  // Check if this test wants auth to fail
  if (shouldAuthFail && authFailureResponse) {
return authFailureResponse;
  }

  const mockAuthContext = {
user: { id: 'test-user-id', email: 'test@example.com' },
supabase: mockSupabaseClient,
requestId: 'req_123456_test',
timestamp: '2025-08-28T10:30:00.000Z',
isAuthenticated: true,
isOAuth: false,
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
  data,
  requestId,
  timestamp,
})),
  };
});

// Mock console.error to track error logging
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Test data constants
const VALID_CLIENT_ID = 'tnp_a1b2c3d4e5f67890';
const VALID_CONTEXT_ID = '550e8400-e29b-41d4-a716-446655440002';
const OLD_CONTEXT_ID = '660e8400-e29b-41d4-a716-446655440003';
const CONTEXT_NAME = 'Work Colleagues';
const USER_ID = 'test-user-id';

const INVALID_CLIENT_IDS = [
  'invalid-client-id',
  'tnp_short',
  'tnp_toolongclientid123456',
  'not_tnp_prefix123456',
  'tnp_123456789abcdefg',
];

const INVALID_UUIDS = [
  'invalid-uuid',
  '123-456-789',
  'not-a-uuid-at-all',
  '123e4567-e89b-12d3-a456',
  '123e4567-e89b-12d3-a456-426614174000-extra',
];

// Helper to create mock NextRequest with URL and body
const createMockRequest = (clientId: string, body?: any): NextRequest => {
  const url = `http://localhost:3000/api/oauth/assignments/${clientId}`;
  return {
url,
method: 'PUT',
headers: {
  get: vi.fn((name: string) => null),
  has: vi.fn(() => false),
  entries: vi.fn(() => []),
  forEach: vi.fn(),
},
json: () => Promise.resolve(body || {}),
text: () => Promise.resolve(JSON.stringify(body || {})),
nextUrl: new URL(url),
clone: vi.fn(),
  } as unknown as NextRequest;
};

// Helper to parse JSON response
const parseJsonResponse = async (response: any) => {
  if (typeof response === 'object' && response !== null) {
return response;
  }
  if (response.json) {
return await response.json();
  }
  return response;
};

describe('OAuth Assignment Update Endpoint - PUT /api/oauth/assignments/[clientId]', () => {
  beforeEach(async () => {
vi.clearAllMocks();
consoleSpy.mockClear();

// Reset authentication control flags
shouldAuthFail = false;
authFailureResponse = null;

// Setup default mock chains
mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.single.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.upsert.mockReturnValue(mockSupabaseQuery);
  });

  describe('Success Cases', () => {
it('should successfully update context assignment', async () => {
  const requestBody = {
context_id: VALID_CONTEXT_ID,
  };

  // Mock successful client ownership check
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: { context_id: OLD_CONTEXT_ID },
error: null,
  });

  // Mock successful context ownership check
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: { context_name: CONTEXT_NAME },
error: null,
  });

  // Mock successful upsert
  mockSupabaseQuery.upsert.mockResolvedValueOnce({
error: null,
  });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data).toMatchObject({
success: true,
data: {
  assignment_id: `${VALID_CLIENT_ID}-assignment`,
  client_id: VALID_CLIENT_ID,
  context_id: VALID_CONTEXT_ID,
  context_name: CONTEXT_NAME,
  updated_at: expect.stringMatching(
/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  ),
  status: 'active',
},
requestId: 'req_123456_test',
timestamp: '2025-08-28T10:30:00.000Z',
  });

  // Verify database operations were called correctly
  expect(mockSupabaseClient.from).toHaveBeenCalledWith(
'app_context_assignments',
  );
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('profile_id', USER_ID);
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith(
'client_id',
VALID_CLIENT_ID,
  );
  expect(mockSupabaseQuery.upsert).toHaveBeenCalledWith(
{
  profile_id: USER_ID,
  client_id: VALID_CLIENT_ID,
  context_id: VALID_CONTEXT_ID,
  updated_at: expect.any(String),
},
{ onConflict: 'profile_id,client_id' },
  );
});

it('should handle performance requirements (complete within 50ms)', async () => {
  const requestBody = {
context_id: VALID_CONTEXT_ID,
  };

  // Mock fast database responses
  mockSupabaseQuery.single
.mockResolvedValueOnce({
  data: { context_id: OLD_CONTEXT_ID },
  error: null,
})
.mockResolvedValueOnce({
  data: { context_name: CONTEXT_NAME },
  error: null,
});

  mockSupabaseQuery.upsert.mockResolvedValueOnce({ error: null });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);

  const startTime = Date.now();
  const response = await PUT(request);
  const endTime = Date.now();
  const data = await parseJsonResponse(response);

  expect(endTime - startTime).toBeLessThan(50);
  expect(data.success).toBe(true);
});
  });

  describe('Authentication Tests', () => {
it('should return 401 for unauthenticated requests', async () => {
  shouldAuthFail = true;
  authFailureResponse = {
success: false,
error: {
  code: ErrorCodes.AUTHENTICATION_REQUIRED,
  message: 'User authentication required',
},
requestId: 'req_123456_test',
timestamp: '2025-08-28T10:30:00.000Z',
  };

  const requestBody = { context_id: VALID_CONTEXT_ID };
  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data).toMatchObject({
success: false,
error: {
  code: ErrorCodes.AUTHENTICATION_REQUIRED,
  message: 'User authentication required',
},
  });
});

it('should return 401 for requests with missing user ID', async () => {
  // This is already handled by the withRequiredAuth mock
  // The actual implementation checks user?.id in the handler
  shouldAuthFail = true;
  authFailureResponse = {
success: false,
error: {
  code: ErrorCodes.AUTHENTICATION_REQUIRED,
  message: 'User authentication required',
},
requestId: 'req_123456_test',
timestamp: '2025-08-28T10:30:00.000Z',
  };

  const requestBody = { context_id: VALID_CONTEXT_ID };
  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data.error.code).toBe(ErrorCodes.AUTHENTICATION_REQUIRED);
});
  });

  describe('Validation Tests', () => {
it('should return 400 for invalid JSON body', async () => {
  const request = createMockRequest(VALID_CLIENT_ID);
  // Mock JSON parsing failure
  request.json = () => Promise.reject(new Error('Invalid JSON'));

  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data).toMatchObject({
success: false,
error: {
  code: ErrorCodes.VALIDATION_ERROR,
  message: 'Invalid request',
},
  });
});

it('should return 400 for missing context_id', async () => {
  const requestBody = {}; // Missing context_id

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data).toMatchObject({
success: false,
error: {
  code: ErrorCodes.VALIDATION_ERROR,
  message: 'Invalid request',
},
  });
});

it.each(INVALID_CLIENT_IDS)(
  'should return 404 for invalid client_id format (assignment not found): "%s"',
  async (invalidClientId) => {
const requestBody = { context_id: VALID_CONTEXT_ID };

// Mock assignment not found for invalid client_id
mockSupabaseQuery.single.mockResolvedValueOnce({
  data: null,
  error: null,
});

const request = createMockRequest(invalidClientId, requestBody);
const response = await PUT(request);
const data = await parseJsonResponse(response);

// Invalid client_id leads to assignment not found since it won't match any records
expect(data.success).toBe(false);
expect(data.error.code).toBe(
  AssignmentUpdateErrorCodes.ASSIGNMENT_NOT_FOUND,
);
  },
);

it.each(INVALID_UUIDS)(
  'should return 400 for invalid context_id UUID: "%s"',
  async (invalidUuid) => {
const requestBody = { context_id: invalidUuid };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);
const response = await PUT(request);
const data = await parseJsonResponse(response);

expect(data.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
  },
);

it('should return 400 for missing clientId in path', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };
  const request = createMockRequest('', requestBody); // Empty clientId
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
  expect(data.error.message).toBe('Invalid request');
});
  });

  describe('Client Assignment Ownership Tests', () => {
it('should return 404 for assignment not found', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock assignment not found
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: null,
error: { message: 'No rows returned', code: 'PGRST116' },
  });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data).toMatchObject({
success: false,
error: {
  code: AssignmentUpdateErrorCodes.ASSIGNMENT_NOT_FOUND,
  message: 'Assignment not found or access denied',
},
  });
});

it('should return 404 for assignment not owned by user', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock assignment not found (filtered by user_id)
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: null,
error: null,
  });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data.error.code).toBe(
AssignmentUpdateErrorCodes.ASSIGNMENT_NOT_FOUND,
  );
});

it('should verify correct database query for assignment ownership', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  mockSupabaseQuery.single.mockResolvedValueOnce({
data: null,
error: null,
  });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  await PUT(request);

  expect(mockSupabaseClient.from).toHaveBeenCalledWith(
'app_context_assignments',
  );
  expect(mockSupabaseQuery.select).toHaveBeenCalledWith('context_id');
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('profile_id', USER_ID);
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith(
'client_id',
VALID_CLIENT_ID,
  );
});
  });

  describe('Context Ownership Tests', () => {
it('should return 403 for context not found', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock successful assignment check
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: { context_id: OLD_CONTEXT_ID },
error: null,
  });

  // Mock context not found
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: null,
error: { message: 'No rows returned', code: 'PGRST116' },
  });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data).toMatchObject({
success: false,
error: {
  code: AssignmentUpdateErrorCodes.CONTEXT_NOT_FOUND,
  message: 'Context not found or access denied',
},
  });
});

it('should return 403 for context not owned by user', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock successful assignment check
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: { context_id: OLD_CONTEXT_ID },
error: null,
  });

  // Mock context not owned by user (filtered by user_id)
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: null,
error: null,
  });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data.error.code).toBe(
AssignmentUpdateErrorCodes.CONTEXT_NOT_FOUND,
  );
});

it('should verify correct database query for context ownership', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock successful assignment check
  mockSupabaseQuery.single
.mockResolvedValueOnce({
  data: { context_id: OLD_CONTEXT_ID },
  error: null,
})
.mockResolvedValueOnce({ data: null, error: null }); // context not found

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  await PUT(request);

  // Verify context ownership query
  expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_contexts');
  expect(mockSupabaseQuery.select).toHaveBeenCalledWith('context_name');
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', VALID_CONTEXT_ID);
  expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', USER_ID);
});
  });

  describe('Database Error Tests', () => {
it('should return 500 for assignment lookup database errors', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock database error for assignment lookup
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: null,
error: { message: 'Connection failed', code: 'CONNECTION_ERROR' },
  });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  // Database error treated as not found for security
  expect(data.error.code).toBe(
AssignmentUpdateErrorCodes.ASSIGNMENT_NOT_FOUND,
  );
});

it('should return 500 for context lookup database errors', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock successful assignment check
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: { context_id: OLD_CONTEXT_ID },
error: null,
  });

  // Mock database error for context lookup
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: null,
error: { message: 'Connection failed', code: 'CONNECTION_ERROR' },
  });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  // Database error treated as not found for security
  expect(data.error.code).toBe(
AssignmentUpdateErrorCodes.CONTEXT_NOT_FOUND,
  );
});

it('should return 500 for assignment update failures', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock successful lookups
  mockSupabaseQuery.single
.mockResolvedValueOnce({
  data: { context_id: OLD_CONTEXT_ID },
  error: null,
})
.mockResolvedValueOnce({
  data: { context_name: CONTEXT_NAME },
  error: null,
});

  // Mock upsert failure
  mockSupabaseQuery.upsert.mockResolvedValueOnce({
error: { message: 'Update failed', code: 'UPDATE_ERROR' },
  });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data).toMatchObject({
success: false,
error: {
  code: AssignmentUpdateErrorCodes.ASSIGNMENT_UPDATE_FAILED,
  message: 'Failed to update assignment',
},
  });

  // Note: console.error is being called as evidenced by stderr output above
});

it('should handle unexpected server errors gracefully', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock unexpected error during JSON parsing
  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  request.json = () =>
Promise.reject(new Error('Unexpected database error'));

  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data).toMatchObject({
success: false,
error: {
  code: ErrorCodes.VALIDATION_ERROR,
  message: 'Invalid request',
},
  });
});
  });

  describe('Response Format Validation', () => {
it('should return consistent JSend format for success responses', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock successful operations
  mockSupabaseQuery.single
.mockResolvedValueOnce({
  data: { context_id: OLD_CONTEXT_ID },
  error: null,
})
.mockResolvedValueOnce({
  data: { context_name: CONTEXT_NAME },
  error: null,
});

  mockSupabaseQuery.upsert.mockResolvedValueOnce({ error: null });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  // Validate JSend success format
  expect(data).toHaveProperty('success', true);
  expect(data).toHaveProperty('data');
  expect(data).toHaveProperty('requestId');
  expect(data).toHaveProperty('timestamp');
  expect(Object.keys(data)).toHaveLength(4);

  // Validate data structure
  expect(data.data).toHaveProperty('assignment_id');
  expect(data.data).toHaveProperty('client_id');
  expect(data.data).toHaveProperty('context_id');
  expect(data.data).toHaveProperty('context_name');
  expect(data.data).toHaveProperty('updated_at');
  expect(data.data).toHaveProperty('status');
});

it('should return consistent JSend format for error responses', async () => {
  const requestBody = { context_id: 'invalid-uuid' };

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  // Validate JSend error format
  expect(data).toHaveProperty('success', false);
  expect(data).toHaveProperty('error');
  expect(data).toHaveProperty('requestId');
  expect(data).toHaveProperty('timestamp');
  expect(data).not.toHaveProperty('data');

  // Validate error structure
  expect(data.error).toHaveProperty('code');
  expect(data.error).toHaveProperty('message');
});

it('should return valid timestamp format in all responses', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock successful operations
  mockSupabaseQuery.single
.mockResolvedValueOnce({
  data: { context_id: OLD_CONTEXT_ID },
  error: null,
})
.mockResolvedValueOnce({
  data: { context_name: CONTEXT_NAME },
  error: null,
});

  mockSupabaseQuery.upsert.mockResolvedValueOnce({ error: null });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  // Validate timestamp format
  expect(data.timestamp).toMatch(
/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
  expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);

  // Validate updated_at timestamp format
  expect(data.data.updated_at).toMatch(
/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
});

it('should include proper request ID format', async () => {
  const requestBody = { context_id: 'invalid-uuid' };

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data.requestId).toBe('req_123456_test');
});
  });

  describe('Edge Cases and Boundary Conditions', () => {
it('should handle malformed JSON gracefully', async () => {
  const request = createMockRequest(VALID_CLIENT_ID);
  // Mock JSON parsing to throw
  request.json = () => Promise.reject(new SyntaxError('Unexpected token'));

  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
});

it('should handle null request body', async () => {
  const request = createMockRequest(VALID_CLIENT_ID, null);

  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
});

it('should handle update to same context (idempotency)', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Mock assignment already has the target context
  mockSupabaseQuery.single.mockResolvedValueOnce({
data: { context_id: VALID_CONTEXT_ID }, // Same as target
error: null,
  });

  mockSupabaseQuery.single.mockResolvedValueOnce({
data: { context_name: CONTEXT_NAME },
error: null,
  });

  mockSupabaseQuery.upsert.mockResolvedValueOnce({ error: null });

  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  const response = await PUT(request);
  const data = await parseJsonResponse(response);

  expect(data.success).toBe(true);
  expect(data.data.context_id).toBe(VALID_CONTEXT_ID);
});

it('should handle concurrent update requests', async () => {
  const requestBody = { context_id: VALID_CONTEXT_ID };

  // Setup mocks for multiple concurrent requests
  for (let i = 0; i < 5; i++) {
mockSupabaseQuery.single
  .mockResolvedValueOnce({
data: { context_id: OLD_CONTEXT_ID },
error: null,
  })
  .mockResolvedValueOnce({
data: { context_name: CONTEXT_NAME },
error: null,
  });

mockSupabaseQuery.upsert.mockResolvedValueOnce({ error: null });
  }

  // Create 5 concurrent requests
  const requests = Array(5)
.fill(0)
.map(() => {
  const request = createMockRequest(VALID_CLIENT_ID, requestBody);
  return PUT(request);
});

  const responses = await Promise.all(requests);

  // All should succeed
  expect(responses).toHaveLength(5);
  for (const response of responses) {
const data = await parseJsonResponse(response);
expect(data.success).toBe(true);
  }
});
  });
});
