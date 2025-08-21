// TrueNamePath: Dashboard Stats API Unit Tests
// Date: August 19, 2025
// Comprehensive test suite for dashboard statistics API endpoint

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
}));

// Mock the API utilities
vi.mock('../../../../utils/api', () => ({
  withRequiredAuth: vi.fn(
(handler) => (request: any, context: any) => handler(request, context),
  ),
  createSuccessResponse: vi.fn((data) => ({ status: 'success', data })),
  createErrorResponse: vi.fn((code, message) => ({
status: 'error',
code,
message,
  })),
  get_user_profile_data: vi.fn((user, requestId, timestamp) => {
if (!user) {
  return {
error: {
  status: 'error',
  code: 'AUTHENTICATION_REQUIRED',
  message: 'User authentication required',
},
  };
}
if (!user.profile?.id) {
  return {
error: {
  status: 'error',
  code: 'AUTHENTICATION_REQUIRED',
  message: 'User profile not found',
},
  };
}
return {
  authenticated_user_id: user.id,
  profile_id: user.profile.id,
  user_profile: {
email: user.email || '',
profile_id: user.profile.id,
member_since: user.created_at || new Date().toISOString(),
  },
};
  }),
  ErrorCodes: {
AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
DATABASE_ERROR: 'DATABASE_ERROR',
INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  },
}));

describe('Dashboard Stats API', () => {
  let GET: any;

  beforeEach(async () => {
vi.clearAllMocks();
// Import after mocks are set up
const routeModule = await import('../stats/route');
GET = routeModule.GET;
  });

  const mockUser = {
id: '550e8400-e29b-41d4-a716-446655440000',
email: 'test@example.com',
created_at: '2025-01-01T00:00:00.000Z',
profile: {
  id: 'profile-123',
  email: 'test@example.com',
  display_name: 'Test User',
},
  };

  const mockDashboardRpcData = {
name_statistics: {
  total_names: 5,
  names_by_type: {
LEGAL: 1,
PREFERRED: 1,
NICKNAME: 2,
ALIAS: 1,
PROFESSIONAL: 0,
CULTURAL: 0,
  },
  has_preferred_name: true,
},
context_statistics: {
  custom_contexts: 3,
  active_consents: 2,
  pending_consent_requests: 1,
},
activity_metrics: {
  recent_activity_count: 15,
  api_calls_today: 42,
  total_api_calls: 1337,
},
privacy_metrics: {
  privacy_score: 85,
  gdpr_compliance_status: 'compliant' as const,
  audit_retention_days: 90,
},
  };

  const mockAuthenticatedContext = {
user: mockUser,
supabase: {
  rpc: vi.fn(),
},
requestId: 'test-request-123',
timestamp: '2025-08-19T12:00:00.000Z',
  };

  describe('GET /api/dashboard/stats', () => {
test('successfully retrieves dashboard statistics', async () => {
  mockAuthenticatedContext.supabase.rpc.mockResolvedValue({
data: mockDashboardRpcData,
error: null,
  });

  const mockRequest = new NextRequest(
'http://localhost:3000/api/dashboard/stats',
  );
  const response = await GET(mockRequest, mockAuthenticatedContext);

  expect(mockAuthenticatedContext.supabase.rpc).toHaveBeenCalledWith(
'get_dashboard_stats',
{ p_profile_id: 'profile-123' },
  );

  expect(response.status).toBe('success');
  expect(response.data.user_profile.email).toBe('test@example.com');
  expect(response.data.user_profile.profile_id).toBe('profile-123');
  expect(response.data.name_statistics.total_names).toBe(5);
});

test('handles missing user profile', async () => {
  const contextWithoutProfile = {
...mockAuthenticatedContext,
user: {
  ...mockUser,
  profile: null,
},
  };

  const mockRequest = new NextRequest(
'http://localhost:3000/api/dashboard/stats',
  );
  const response = await GET(mockRequest, contextWithoutProfile);

  expect(response.status).toBe('error');
  expect(response.code).toBe('AUTHENTICATION_REQUIRED');
  expect(response.message).toBe('User profile not found');
  expect(mockAuthenticatedContext.supabase.rpc).not.toHaveBeenCalled();
});

test('handles RPC database error', async () => {
  mockAuthenticatedContext.supabase.rpc.mockResolvedValue({
data: null,
error: {
  message: 'Connection timeout',
  code: 'PGRST301',
},
  });

  const mockRequest = new NextRequest(
'http://localhost:3000/api/dashboard/stats',
  );
  const response = await GET(mockRequest, mockAuthenticatedContext);

  expect(response.status).toBe('error');
  expect(response.code).toBe('DATABASE_ERROR');
  expect(response.message).toBe('Failed to retrieve dashboard statistics');
});

test('handles null data response from RPC', async () => {
  mockAuthenticatedContext.supabase.rpc.mockResolvedValue({
data: null,
error: null,
  });

  const mockRequest = new NextRequest(
'http://localhost:3000/api/dashboard/stats',
  );
  const response = await GET(mockRequest, mockAuthenticatedContext);

  expect(response.status).toBe('error');
  expect(response.code).toBe('DATABASE_ERROR');
  expect(response.message).toBe('No dashboard data available');
});

test('handles RPC function throwing exception', async () => {
  mockAuthenticatedContext.supabase.rpc.mockRejectedValue(
new Error('Database connection failed'),
  );

  const mockRequest = new NextRequest(
'http://localhost:3000/api/dashboard/stats',
  );
  const response = await GET(mockRequest, mockAuthenticatedContext);

  expect(response.status).toBe('error');
  expect(response.code).toBe('INTERNAL_SERVER_ERROR');
  expect(response.message).toBe('Failed to retrieve dashboard statistics');
});

test('correctly merges RPC data with user profile', async () => {
  const customRpcData = {
name_statistics: {
  total_names: 10,
  names_by_type: {
LEGAL: 2,
PREFERRED: 2,
NICKNAME: 3,
ALIAS: 2,
PROFESSIONAL: 1,
CULTURAL: 0,
  },
  has_preferred_name: false,
},
context_statistics: {
  custom_contexts: 5,
  active_consents: 3,
  pending_consent_requests: 2,
},
activity_metrics: {
  recent_activity_count: 25,
  api_calls_today: 100,
  total_api_calls: 5000,
},
privacy_metrics: {
  privacy_score: 92,
  gdpr_compliance_status: 'compliant' as const,
  audit_retention_days: 365,
},
  };

  mockAuthenticatedContext.supabase.rpc.mockResolvedValue({
data: customRpcData,
error: null,
  });

  const mockRequest = new NextRequest(
'http://localhost:3000/api/dashboard/stats',
  );
  const response = await GET(mockRequest, mockAuthenticatedContext);

  expect(response.data.user_profile.email).toBe('test@example.com');
  expect(response.data.name_statistics.total_names).toBe(10);
  expect(response.data.privacy_metrics.privacy_score).toBe(92);
});

test('handles missing email fallback', async () => {
  const contextWithoutEmail = {
...mockAuthenticatedContext,
user: {
  ...mockUser,
  email: undefined,
  profile: {
id: 'profile-123',
email: 'test@example.com',
display_name: 'Test User',
  },
},
  };

  mockAuthenticatedContext.supabase.rpc.mockResolvedValue({
data: mockDashboardRpcData,
error: null,
  });

  const mockRequest = new NextRequest(
'http://localhost:3000/api/dashboard/stats',
  );
  const response = await GET(mockRequest, contextWithoutEmail);

  expect(response.data.user_profile.email).toBe('');
});
  });
});
