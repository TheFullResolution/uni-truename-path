/**
 * Basic Unit Tests for OAuth Token Revocation Endpoint
 *
 * Tests for DELETE /api/oauth/sessions/[id] - OAuth session token revocation
 * Simple test suite validating core functionality - Step 4 implementation
 * Academic project - Step 16 OAuth integration testing
 */

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from '../route';

// Mock Next.js server with basic Response implementation
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

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
json: vi.fn((data, init) => ({
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  status: init?.status || 200,
  headers: new Map(Object.entries(init?.headers || {})),
})),
  },
}));

// Mock Supabase client for controlled testing
const mockSupabaseClient = {
  auth: {
getUser: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
};

const mockSupabaseQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  delete: vi.fn(),
};

// Mock the createClient function
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Test constants
const VALID_SESSION_ID = '123e4567-e89b-12d3-a456-426614174000';
const INVALID_SESSION_ID = 'invalid-uuid-format';
const MOCK_USER_ID = 'user-123';
const MOCK_SESSION = {
  id: VALID_SESSION_ID,
  profile_id: MOCK_USER_ID,
  app_id: 'app-123',
};

// Helper to create mock NextRequest
const createMockRequest = (sessionId?: string, query?: string): NextRequest => {
  const baseUrl = 'http://localhost:3000/api/oauth/sessions';
  const fullUrl = sessionId
? `${baseUrl}/${sessionId}${query ? `?${query}` : ''}`
: `${baseUrl}/`; // Add trailing slash for empty path

  return {
url: fullUrl,
method: 'DELETE',
headers: new Map(),
cookies: {} as any,
nextUrl: {
  pathname: sessionId
? `/api/oauth/sessions/${sessionId}`
: '/api/oauth/sessions/',
  searchParams: new URLSearchParams(query || ''),
} as any,
  } as unknown as NextRequest;
};

// Helper to parse JSON response
const parseJsonResponse = async (response: any): Promise<any> => {
  if (response && typeof response === 'object' && 'json' in response) {
return await response.json();
  }
  return response;
};

describe('OAuth Token Revocation Endpoint - DELETE /api/oauth/sessions/[id]', () => {
  beforeEach(() => {
vi.clearAllMocks();

// Setup default mock chains
mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.delete.mockReturnValue(mockSupabaseQuery);
  });

  describe('Input Validation', () => {
it('should return 400 for invalid UUID format', async () => {
  const request = createMockRequest(INVALID_SESSION_ID);
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe('INVALID_UUID');
  expect(responseData.error.message).toBe(
'Session ID must be a valid UUID format',
  );
  expect(response.status).toBe(400);
});

it('should return 400 when session ID is missing', async () => {
  const request = createMockRequest(); // This creates a URL ending in '/'
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe('VALIDATION_ERROR'); // Empty string from path causes validation error
  expect(responseData.error.message).toBe('Session ID is required');
  expect(response.status).toBe(400);
});
  });

  describe('Authentication', () => {
it('should return 401 when user is not authenticated', async () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
data: { user: null },
error: null,
  });

  const request = createMockRequest(VALID_SESSION_ID);
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe('AUTHENTICATION_REQUIRED');
  expect(responseData.error.message).toBe(
'User authentication required for token revocation',
  );
  expect(response.status).toBe(401);
});

it('should return 401 when authentication error occurs', async () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
data: { user: null },
error: { message: 'Authentication failed' },
  });

  const request = createMockRequest(VALID_SESSION_ID);
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe('AUTHENTICATION_REQUIRED');
  expect(response.status).toBe(401);
});
  });

  describe('Session Validation', () => {
beforeEach(() => {
  // Setup authenticated user by default
  mockSupabaseClient.auth.getUser.mockResolvedValue({
data: { user: { id: MOCK_USER_ID } },
error: null,
  });
});

it('should return 404 when session does not exist', async () => {
  const sessionSelectQuery = {
select: vi.fn().mockReturnThis(),
eq: vi.fn().mockReturnThis(),
single: vi.fn().mockResolvedValue({
  data: null,
  error: { message: 'No rows returned' },
}),
  };

  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'oauth_sessions') {
  return sessionSelectQuery;
}
return mockSupabaseQuery;
  });

  const request = createMockRequest(VALID_SESSION_ID);
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe('NOT_FOUND');
  expect(responseData.error.message).toBe('OAuth session not found');
  expect(response.status).toBe(404);
});

it("should return 403 when user tries to revoke another user's session", async () => {
  const otherUserSession = {
...MOCK_SESSION,
profile_id: 'different-user-id',
  };

  const sessionSelectQuery = {
select: vi.fn().mockReturnThis(),
eq: vi.fn().mockReturnThis(),
single: vi.fn().mockResolvedValue({
  data: otherUserSession,
  error: null,
}),
  };

  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'oauth_sessions') {
  return sessionSelectQuery;
}
return mockSupabaseQuery;
  });

  const request = createMockRequest(VALID_SESSION_ID);
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe('FORBIDDEN');
  expect(responseData.error.message).toBe(
'Access denied: users can only revoke their own sessions',
  );
  expect(response.status).toBe(403);
});
  });

  describe('Successful Revocation', () => {
beforeEach(() => {
  // Setup successful authentication
  mockSupabaseClient.auth.getUser.mockResolvedValue({
data: { user: { id: MOCK_USER_ID } },
error: null,
  });

  // Setup proper sequential mock calls for oauth_sessions table
  let callCount = 0;
  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'oauth_sessions') {
  callCount++;
  if (callCount === 1) {
// First call is for session fetch (select)
return {
  select: vi.fn().mockReturnValue({
eq: vi.fn().mockReturnValue({
  single: vi.fn().mockResolvedValue({
data: MOCK_SESSION,
error: null,
  }),
}),
  }),
};
  } else {
// Second call is for session deletion - needs double .eq() chaining
return {
  delete: vi.fn().mockReturnValue({
eq: vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({
data: null,
error: null,
  }),
}),
  }),
};
  }
}
return mockSupabaseQuery;
  });

  // Setup successful logging
  mockSupabaseClient.rpc.mockResolvedValue({
data: null,
error: null,
  });
});

it('should successfully revoke session and return 200', async () => {
  const request = createMockRequest(VALID_SESSION_ID);
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.data.revoked).toBe(true);
  expect(responseData.data.session_id).toBe(VALID_SESSION_ID);
  expect(responseData.data.revoked_at).toBeDefined();
  expect(responseData.data.app_context_assignment_removed).toBe(false);
  expect(response.status).toBe(200);

  // Verify database operations were called
  expect(mockSupabaseClient.from).toHaveBeenCalledWith('oauth_sessions');
  expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('log_app_usage', {
p_profile_id: MOCK_SESSION.profile_id,
p_app_id: MOCK_SESSION.app_id,
p_action: 'revoke',
p_session_id: VALID_SESSION_ID,
p_response_time_ms: 0,
p_success: true,
  });
});

it('should handle remove_assignment parameter when provided', async () => {
  // Setup sequential mock calls for multiple tables
  let callCount = 0;
  mockSupabaseClient.from.mockImplementation((table) => {
callCount++;
if (table === 'oauth_sessions' && callCount === 1) {
  // First call is for session fetch
  return {
select: vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
single: vi.fn().mockResolvedValue({
  data: MOCK_SESSION,
  error: null,
}),
  }),
}),
  };
} else if (table === 'oauth_sessions' && callCount === 2) {
  // Second call is for session deletion - needs double .eq() chaining
  return {
delete: vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
eq: vi.fn().mockResolvedValue({
  data: null,
  error: null,
}),
  }),
}),
  };
} else if (table === 'app_context_assignments') {
  // Third call is for assignment removal - needs double .eq() chaining
  return {
delete: vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
eq: vi.fn().mockResolvedValue({
  data: null,
  error: null,
}),
  }),
}),
  };
}
return mockSupabaseQuery;
  });

  const request = createMockRequest(
VALID_SESSION_ID,
'remove_assignment=true',
  );
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(true);
  expect(responseData.data.app_context_assignment_removed).toBe(true);
});
  });

  describe('Error Handling', () => {
beforeEach(() => {
  // Setup successful authentication by default
  mockSupabaseClient.auth.getUser.mockResolvedValue({
data: { user: { id: MOCK_USER_ID } },
error: null,
  });

  mockSupabaseQuery.single.mockResolvedValue({
data: MOCK_SESSION,
error: null,
  });
});

it('should return 500 when session deletion fails', async () => {
  // Setup sequential calls - first for session fetch (success), second for deletion (fail)
  let callCount = 0;
  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'oauth_sessions') {
  callCount++;
  if (callCount === 1) {
// First call succeeds (session fetch)
return {
  select: vi.fn().mockReturnValue({
eq: vi.fn().mockReturnValue({
  single: vi.fn().mockResolvedValue({
data: MOCK_SESSION,
error: null,
  }),
}),
  }),
};
  } else {
// Second call fails (session deletion) - needs double .eq() chaining
return {
  delete: vi.fn().mockReturnValue({
eq: vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({
data: null,
error: { message: 'Database error' },
  }),
}),
  }),
};
  }
}
return mockSupabaseQuery;
  });

  const request = createMockRequest(VALID_SESSION_ID);
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe('INTERNAL_SERVER_ERROR');
  expect(responseData.error.message).toBe('Failed to delete OAuth session');
  expect(response.status).toBe(500);
});

it('should handle unexpected errors gracefully', async () => {
  // Mock the session fetch to throw an error
  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'oauth_sessions') {
  return {
select: vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
single: vi
  .fn()
  .mockRejectedValue(new Error('Unexpected error')),
  }),
}),
  };
}
return mockSupabaseQuery;
  });

  const request = createMockRequest(VALID_SESSION_ID);
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.success).toBe(false);
  expect(responseData.error.code).toBe('INTERNAL_SERVER_ERROR');
  expect(responseData.error.message).toBe('Failed to revoke OAuth session');
  expect(response.status).toBe(500);
});
  });

  describe('Request Context', () => {
it('should include request ID and timestamp in all responses', async () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
data: { user: { id: MOCK_USER_ID } },
error: null,
  });

  // Setup successful sequential calls
  let callCount = 0;
  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'oauth_sessions') {
  callCount++;
  if (callCount === 1) {
return {
  select: vi.fn().mockReturnValue({
eq: vi.fn().mockReturnValue({
  single: vi.fn().mockResolvedValue({
data: MOCK_SESSION,
error: null,
  }),
}),
  }),
};
  } else {
return {
  delete: vi.fn().mockReturnValue({
eq: vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({
data: null,
error: null,
  }),
}),
  }),
};
  }
}
return mockSupabaseQuery;
  });

  mockSupabaseClient.rpc.mockResolvedValue({
data: null,
error: null,
  });

  const request = createMockRequest(VALID_SESSION_ID);
  const response = await DELETE(request);
  const responseData = await parseJsonResponse(response);

  expect(responseData.requestId).toBeDefined();
  expect(responseData.timestamp).toBeDefined();
  expect(typeof responseData.requestId).toBe('string');
  expect(typeof responseData.timestamp).toBe('string');
});
  });
});
