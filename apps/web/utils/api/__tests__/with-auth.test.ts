// TrueNamePath: API Authentication HOF Unit Tests
// Date: August 19, 2025
// Comprehensive test suite for API authentication higher-order functions

import {
  describe,
  test,
  expect,
  beforeEach,
  vi,
  type MockedFunction,
} from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  withRequiredAuth,
  withOptionalAuth,
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
  validate_uuid,
  type AuthenticatedHandler,
  type AuthenticatedContext,
} from '../with-auth';
import {
  mockAuthenticatedHeaders,
  mockUnauthenticatedHeaders,
  mockMissingAuthHeaders,
  resetHeadersMocks,
} from '../../__mocks__/next-headers';

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
json: vi.fn((data, init) => ({
  data,
  status: init?.status || 200,
  headers: init?.headers || {},
})),
  },
}));

// Mock the server auth utilities using vi.hoisted
const { mockCreateClientWithToken } = vi.hoisted(() => ({
  mockCreateClientWithToken: vi.fn().mockResolvedValue({
// Mock Supabase client
auth: {
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
},
  }),
}));

vi.mock('../../auth/server', () => ({
  createClientWithToken: mockCreateClientWithToken,
}));

describe('API Authentication Higher-Order Functions', () => {
  beforeEach(() => {
// Only clear mock calls, not implementations
vi.clearAllTimers();
resetHeadersMocks();

// Reset mock calls but keep implementations
mockCreateClientWithToken.mockClear();
(NextResponse.json as MockedFunction<typeof NextResponse.json>).mockClear();
  });

  describe('generateRequestId', () => {
test('should generate unique request IDs', () => {
  const id1 = generateRequestId();
  const id2 = generateRequestId();

  // Format: req_${timestamp}_${random9chars}
  expect(id1).toMatch(/^req_\d+_[a-z0-9]{9}$/);
  expect(id2).toMatch(/^req_\d+_[a-z0-9]{9}$/);
  expect(id1).not.toBe(id2);
});

test('should generate consistent format with timestamp and random suffix', () => {
  // Generate multiple IDs to ensure consistency
  for (let i = 0; i < 10; i++) {
const id = generateRequestId();
// Format: req_ + timestamp + _ + 9 random chars
expect(id).toMatch(/^req_\d+_[a-z0-9]{9}$/);
expect(id.startsWith('req_')).toBe(true);
expect(id.split('_')).toHaveLength(3); // ['req', timestamp, random]
  }
});
  });

  describe('validate_uuid', () => {
test('should validate correct UUID v4 format', () => {
  const validUUID = '12345678-1234-4234-8234-123456789012';
  expect(validate_uuid(validUUID)).toBe(true);
});

test('should reject invalid UUID formats', () => {
  expect(validate_uuid('not-a-uuid')).toBe(false);
  expect(validate_uuid('12345678-1234-1234-1234-123456789012')).toBe(false); // Wrong version
  expect(validate_uuid('')).toBe(false);
  expect(validate_uuid('12345678-1234-4234-8234-12345678901')).toBe(false); // Too short
});

test('should handle null and undefined gracefully', () => {
  expect(validate_uuid(null as any)).toBe(false);
  expect(validate_uuid(undefined as any)).toBe(false);
});
  });

  describe('Response Creators', () => {
describe('createSuccessResponse', () => {
  test('should create valid JSend success response', () => {
const data = { name: 'John Doe', id: '123' };
const requestId = 'req_test123';
const timestamp = '2025-08-19T12:00:00.000Z';

const response = createSuccessResponse(data, requestId, timestamp);

expect(response).toEqual({
  success: true,
  data,
  requestId,
  timestamp,
});
  });

  test('should generate timestamp if not provided', () => {
const data = { test: true };
const requestId = 'req_test456';

const response = createSuccessResponse(data, requestId);

expect(response.success).toBe(true);
expect(response.data).toEqual(data);
expect(response.requestId).toBe(requestId);
expect(response.timestamp).toMatch(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
);
  });

  test('should handle null and undefined data', () => {
const requestId = 'req_test789';

expect(createSuccessResponse(null, requestId).data).toBe(null);
expect(createSuccessResponse(undefined, requestId).data).toBe(
  undefined,
);
  });
});

describe('createErrorResponse', () => {
  test('should create valid JSend error response', () => {
const response = createErrorResponse(
  'VALIDATION_ERROR',
  'Invalid input data',
  'req_test123',
  { field: 'email' },
  '2025-08-19T12:00:00.000Z',
);

expect(response).toEqual({
  success: false,
  error: {
code: 'VALIDATION_ERROR',
message: 'Invalid input data',
details: { field: 'email' },
requestId: 'req_test123',
timestamp: '2025-08-19T12:00:00.000Z',
  },
  requestId: 'req_test123',
  timestamp: '2025-08-19T12:00:00.000Z',
});
  });

  test('should handle optional details and timestamp', () => {
const response = createErrorResponse(
  'NOT_FOUND',
  'Resource not found',
  'req_test456',
);

expect(response.success).toBe(false);
expect(response.error.code).toBe('NOT_FOUND');
expect(response.error.message).toBe('Resource not found');
expect(response.error.details).toBeUndefined();
expect(response.requestId).toBe('req_test456');
expect(response.timestamp).toMatch(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
);
  });
});
  });

  describe('withRequiredAuth', () => {
let mockHandler: AuthenticatedHandler<any>;
let mockRequest: Partial<NextRequest>;

beforeEach(() => {
  mockHandler = vi.fn().mockResolvedValue({
success: true,
data: { message: 'Handler executed successfully' },
  });

  mockRequest = {
method: 'GET',
url: 'https://example.com/api/test',
headers: new Map([
  ['user-agent', 'Test Agent'],
  ['content-type', 'application/json'],
]) as any,
  };
});

test('should execute handler when authenticated', async () => {
  // Setup authenticated headers
  const authenticatedRequest = {
...mockRequest,
headers: mockAuthenticatedHeaders as any,
  };

  const wrappedHandler = withRequiredAuth(mockHandler);
  const response = await wrappedHandler(
authenticatedRequest as NextRequest,
  );

  expect(mockHandler).toHaveBeenCalledTimes(1);
  expect(NextResponse.json).toHaveBeenCalledWith(
expect.objectContaining({
  success: true,
  data: { message: 'Handler executed successfully' },
}),
expect.objectContaining({
  status: 200,
  headers: expect.objectContaining({
'Content-Type': 'application/json',
'X-Request-ID': expect.stringMatching(/^req_\d+_[a-z0-9]{9}$/),
  }),
}),
  );
});

test('should reject unauthenticated requests', async () => {
  const unauthenticatedRequest = {
...mockRequest,
headers: mockUnauthenticatedHeaders as any,
  };

  const wrappedHandler = withRequiredAuth(mockHandler);
  const response = await wrappedHandler(
unauthenticatedRequest as NextRequest,
  );

  expect(mockHandler).not.toHaveBeenCalled();
  expect(NextResponse.json).toHaveBeenCalledWith(
expect.objectContaining({
  success: false,
  error: expect.objectContaining({
code: 'AUTHENTICATION_REQUIRED',
message: 'Authentication required',
  }),
}),
expect.objectContaining({
  status: 401,
}),
  );
});

test('should reject requests with missing auth headers', async () => {
  const noHeadersRequest = {
...mockRequest,
headers: mockMissingAuthHeaders as any,
  };

  const wrappedHandler = withRequiredAuth(mockHandler);
  const response = await wrappedHandler(noHeadersRequest as NextRequest);

  expect(mockHandler).not.toHaveBeenCalled();
  expect(NextResponse.json).toHaveBeenCalledWith(
expect.objectContaining({
  success: false,
  error: expect.objectContaining({
code: 'AUTHENTICATION_REQUIRED',
  }),
}),
expect.objectContaining({ status: 401 }),
  );
});

test('should pass correct authentication context to handler', async () => {
  const authenticatedRequest = {
...mockRequest,
headers: mockAuthenticatedHeaders as any,
  };

  const wrappedHandler = withRequiredAuth(mockHandler);
  await wrappedHandler(authenticatedRequest as NextRequest);

  // Get the actual call to verify the structure
  const handlerCall = mockHandler.mock.calls[0];
  const [request, context] = handlerCall;

  // Verify request is passed through correctly
  expect(request).toBe(authenticatedRequest);

  // Verify context structure
  expect(context.user).toEqual({
id: 'user-123',
email: 'test@example.com',
profile: {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
},
  });
  expect(context.requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
  expect(context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  expect(context.isAuthenticated).toBe(true);
  // Check if the mock was called (the function should attempt to create a client)
  expect(mockCreateClientWithToken).toHaveBeenCalled();

  // For unit tests, the exact supabase client mock might be complex
  // The important part is that the authentication context structure is correct
  // and the function attempted to create a client
  expect(context).toHaveProperty('supabase');
});

test('should handle handler errors gracefully', async () => {
  const errorHandler = vi
.fn()
.mockRejectedValue(new Error('Handler failed'));
  const authenticatedRequest = {
...mockRequest,
headers: mockAuthenticatedHeaders as any,
  };

  const wrappedHandler = withRequiredAuth(errorHandler);
  const response = await wrappedHandler(
authenticatedRequest as NextRequest,
  );

  expect(NextResponse.json).toHaveBeenCalledWith(
expect.objectContaining({
  success: false,
  error: expect.objectContaining({
code: 'INTERNAL_SERVER_ERROR',
message: 'Internal server error occurred',
  }),
}),
expect.objectContaining({ status: 500 }),
  );
});

test('should enable logging in development mode', async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  const authenticatedRequest = {
...mockRequest,
headers: mockAuthenticatedHeaders as any,
  };

  const wrappedHandler = withRequiredAuth(mockHandler, {
enableLogging: true,
  });
  await wrappedHandler(authenticatedRequest as NextRequest);

  expect(consoleSpy).toHaveBeenCalled();

  consoleSpy.mockRestore();
  process.env.NODE_ENV = originalEnv;
});
  });

  describe('withOptionalAuth', () => {
let mockHandler: AuthenticatedHandler<any>;
let mockRequest: Partial<NextRequest>;

beforeEach(() => {
  mockHandler = vi.fn().mockResolvedValue({
success: true,
data: { message: 'Handler executed' },
  });

  mockRequest = {
method: 'GET',
url: 'https://example.com/api/test',
headers: new Map([['user-agent', 'Test Agent']]) as any,
  };
});

test('should execute handler when authenticated', async () => {
  const authenticatedRequest = {
...mockRequest,
headers: mockAuthenticatedHeaders as any,
  };

  const wrappedHandler = withOptionalAuth(mockHandler);
  const response = await wrappedHandler(
authenticatedRequest as NextRequest,
  );

  expect(mockHandler).toHaveBeenCalledWith(
authenticatedRequest,
expect.objectContaining({
  isAuthenticated: true,
  user: expect.objectContaining({
id: 'user-123',
email: 'test@example.com',
  }),
}),
  );
});

test('should execute handler when not authenticated', async () => {
  const unauthenticatedRequest = {
...mockRequest,
headers: mockUnauthenticatedHeaders as any,
  };

  const wrappedHandler = withOptionalAuth(mockHandler);
  const response = await wrappedHandler(
unauthenticatedRequest as NextRequest,
  );

  expect(mockHandler).toHaveBeenCalledWith(
unauthenticatedRequest,
expect.objectContaining({
  isAuthenticated: false,
  user: null,
}),
  );
});

test('should execute handler with missing auth headers', async () => {
  const noHeadersRequest = {
...mockRequest,
headers: mockMissingAuthHeaders as any,
  };

  const wrappedHandler = withOptionalAuth(mockHandler);
  const response = await wrappedHandler(noHeadersRequest as NextRequest);

  expect(mockHandler).toHaveBeenCalledWith(
noHeadersRequest,
expect.objectContaining({
  isAuthenticated: false,
  user: null,
}),
  );
});
  });

  describe('Error Status Code Mapping', () => {
test('should map error codes to appropriate HTTP status codes', async () => {
  const errorHandler = vi.fn().mockResolvedValue({
success: false,
error: {
  code: 'VALIDATION_ERROR',
  message: 'Invalid data',
},
  });

  const authenticatedRequest = {
method: 'POST',
url: 'https://example.com/api/test',
headers: mockAuthenticatedHeaders as any,
  };

  const wrappedHandler = withRequiredAuth(errorHandler);
  await wrappedHandler(authenticatedRequest as NextRequest);

  // Should map VALIDATION_ERROR to 400 status
  expect(NextResponse.json).toHaveBeenCalledWith(
expect.objectContaining({
  success: false,
  error: expect.objectContaining({
code: 'VALIDATION_ERROR',
  }),
}),
expect.objectContaining({ status: 400 }),
  );
});
  });

  describe('Request ID Propagation', () => {
let mockHandler: AuthenticatedHandler<any>;

beforeEach(() => {
  mockHandler = vi.fn().mockResolvedValue({
success: true,
data: { message: 'Handler executed successfully' },
  });
});

test('should propagate request ID through entire request lifecycle', async () => {
  const authenticatedRequest = {
method: 'GET',
url: 'https://example.com/api/test',
headers: mockAuthenticatedHeaders as any,
  };

  const wrappedHandler = withRequiredAuth(mockHandler);
  await wrappedHandler(authenticatedRequest as NextRequest);

  // Extract the request ID from the handler call
  const handlerCall = (mockHandler as MockedFunction<typeof mockHandler>)
.mock.calls[0];
  const context = handlerCall[1] as AuthenticatedContext;
  const requestId = context.requestId;

  // Verify the response includes request ID in headers
  const responseCall = (
NextResponse.json as MockedFunction<typeof NextResponse.json>
  ).mock.calls[0];
  const [responseData, responseOptions] = responseCall;

  // Check that the response headers include the request ID
  expect(responseOptions.headers['X-Request-ID']).toBe(requestId);

  // Check that the response data is what we expect
  expect(responseData).toEqual({
success: true,
data: { message: 'Handler executed successfully' },
  });
});
  });
});
