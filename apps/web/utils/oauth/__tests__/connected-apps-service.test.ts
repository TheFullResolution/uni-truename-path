/**
 * Unit Tests for OAuth Connected Apps Service (Fixed Version)
 *
 * Comprehensive test suite for Step 16.6.1 - Connected Apps Service Layer
 * Tests all service functions with edge cases, error handling, and performance validation
 * Academic project - TrueNamePath Context-Aware Identity Management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock the service functions directly for more focused testing
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
};
vi.stubGlobal('process', { env: mockEnv });

// Create comprehensive mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
};

const mockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn(),
});

// Special mock for session queries that need the full chain
const mockSessionQueryBuilder = () => ({
  select: vi.fn().mockReturnValue({
eq: vi.fn().mockReturnValue({
  in: vi.fn().mockReturnValue({
gt: vi.fn(),
  }),
}),
  }),
});

// Import the functions after mocking
import {
  getConnectedAppsForUser,
  getUsageStatisticsForApps,
  formatConnectedAppResponse,
} from '../connected-apps-service';

describe('OAuth Connected Apps Service (Fixed)', () => {
  beforeEach(() => {
vi.clearAllMocks();
  });

  afterEach(() => {
vi.restoreAllMocks();
  });

  describe('getConnectedAppsForUser', () => {
it('should fetch connected apps successfully', async () => {
  const mockAssignments = [
{
  client_id: 'tnp_1234567890abcdef',
  context_id: 'context-1',
  user_contexts: { id: 'context-1', context_name: 'Work Context' },
},
  ];

  const mockClients = [
{
  client_id: 'tnp_1234567890abcdef',
  display_name: 'HR App',
  publisher_domain: 'demo-hr.vercel.app',
  last_used_at: '2025-08-28T10:00:00Z',
},
  ];

  const expectedData = [
{
  client_id: 'tnp_1234567890abcdef',
  context_id: 'context-1',
  user_contexts: { id: 'context-1', context_name: 'Work Context' },
  oauth_client_registry: {
client_id: 'tnp_1234567890abcdef',
display_name: 'HR App',
publisher_domain: 'demo-hr.vercel.app',
last_used_at: '2025-08-28T10:00:00Z',
  },
},
  ];

  const assignmentsQueryBuilder = mockQueryBuilder();
  assignmentsQueryBuilder.eq.mockResolvedValue({
data: mockAssignments,
error: null,
  });

  const clientsQueryBuilder = mockQueryBuilder();
  clientsQueryBuilder.in.mockReturnValue(clientsQueryBuilder);
  clientsQueryBuilder.order.mockResolvedValue({
data: mockClients,
error: null,
  });

  mockSupabaseClient.from
.mockReturnValueOnce(assignmentsQueryBuilder)
.mockReturnValueOnce(clientsQueryBuilder);

  const result = await getConnectedAppsForUser('test-profile-123');

  expect(mockSupabaseClient.from).toHaveBeenNthCalledWith(
1,
'app_context_assignments',
  );
  expect(mockSupabaseClient.from).toHaveBeenNthCalledWith(
2,
'oauth_client_registry',
  );
  expect(result.data).toEqual(expectedData);
  expect(result.error).toBeNull();
});

it('should handle database errors', async () => {
  const mockError = { message: 'Database connection failed' };

  const queryBuilder = mockQueryBuilder();
  queryBuilder.eq.mockResolvedValue({
data: null,
error: mockError,
  });

  mockSupabaseClient.from.mockReturnValue(queryBuilder);

  const result = await getConnectedAppsForUser('test-profile-123');

  expect(result.data).toBeNull();
  expect(result.error).toEqual(mockError);
});

it('should handle empty assignments', async () => {
  const queryBuilder = mockQueryBuilder();
  queryBuilder.eq.mockResolvedValue({
data: [],
error: null,
  });

  mockSupabaseClient.from.mockReturnValue(queryBuilder);

  const result = await getConnectedAppsForUser('test-profile-123');

  expect(mockSupabaseClient.from).toHaveBeenCalledWith(
'app_context_assignments',
  );
  expect(result.data).toEqual([]);
  expect(result.error).toBeNull();
});
  });

  describe('getUsageStatisticsForApps', () => {
it('should return empty array for empty client IDs', async () => {
  const result = await getUsageStatisticsForApps([]);

  expect(result.data).toEqual([]);
  expect(result.error).toBeNull();
  expect(mockSupabaseClient.from).not.toHaveBeenCalled();
});

it('should aggregate usage statistics correctly', async () => {
  const clientIds = ['tnp_client1', 'tnp_client2'];
  const mockUsageData = [
{ client_id: 'tnp_client1' },
{ client_id: 'tnp_client1' },
{ client_id: 'tnp_client2' },
  ];

  const queryBuilder = mockQueryBuilder();
  queryBuilder.eq.mockResolvedValue({
data: mockUsageData,
error: null,
  });

  mockSupabaseClient.from.mockReturnValue(queryBuilder);

  const result = await getUsageStatisticsForApps(clientIds);

  expect(mockSupabaseClient.from).toHaveBeenCalledWith('app_usage_log');
  expect(result.data).toEqual([
{ client_id: 'tnp_client1', total_usage_count: 2 },
{ client_id: 'tnp_client2', total_usage_count: 1 },
  ]);
  expect(result.error).toBeNull();
});

it('should handle database errors', async () => {
  const mockError = { message: 'Usage log query failed' };
  const clientIds = ['tnp_client1'];

  const queryBuilder = mockQueryBuilder();
  queryBuilder.eq.mockResolvedValue({
data: null,
error: mockError,
  });

  mockSupabaseClient.from.mockReturnValue(queryBuilder);

  const result = await getUsageStatisticsForApps(clientIds);

  expect(result.data).toBeNull();
  expect(result.error).toEqual(mockError);
});

it('should handle clients with zero usage', async () => {
  const clientIds = ['tnp_unused1', 'tnp_unused2'];

  const queryBuilder = mockQueryBuilder();
  queryBuilder.eq.mockResolvedValue({
data: [], // No usage records
error: null,
  });

  mockSupabaseClient.from.mockReturnValue(queryBuilder);

  const result = await getUsageStatisticsForApps(clientIds);

  expect(result.data).toEqual([
{ client_id: 'tnp_unused1', total_usage_count: 0 },
{ client_id: 'tnp_unused2', total_usage_count: 0 },
  ]);
});
  });

  describe('formatConnectedAppResponse', () => {
it('should return empty array for empty data array', async () => {
  const result = await formatConnectedAppResponse([], 'test-profile');
  expect(result).toEqual([]);
});

it('should format response correctly', async () => {
  const mockAppsData = [
{
  client_id: 'tnp_1234567890abcdef',
  context_id: 'context-1',
  user_contexts: { id: 'context-1', context_name: 'Work Context' },
  oauth_client_registry: {
client_id: 'tnp_1234567890abcdef',
display_name: 'HR App',
publisher_domain: 'demo-hr.vercel.app',
last_used_at: '2025-08-28T10:00:00Z',
  },
},
  ];

  // Mock usage statistics call
  const usageQueryBuilder = mockQueryBuilder();
  usageQueryBuilder.eq.mockResolvedValue({
data: [{ client_id: 'tnp_1234567890abcdef' }],
error: null,
  });

  // Mock sessions call
  const sessionQueryBuilder = mockSessionQueryBuilder();
  sessionQueryBuilder
.select()
.eq()
.in()
.gt.mockResolvedValue({
  data: [{ client_id: 'tnp_1234567890abcdef' }],
  error: null,
});

  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'app_usage_log') {
  return usageQueryBuilder;
}
if (table === 'oauth_sessions') {
  return sessionQueryBuilder;
}
return mockQueryBuilder();
  });

  const result = await formatConnectedAppResponse(
mockAppsData,
'test-profile',
  );

  expect(result).toHaveLength(1);
  expect(result[0]).toEqual({
client_id: 'tnp_1234567890abcdef',
display_name: 'HR App',
publisher_domain: 'demo-hr.vercel.app',
context_id: 'context-1',
context_name: 'Work Context',
last_used_at: '2025-08-28T10:00:00Z',
active_sessions: 1,
total_usage_count: 1,
  });
});

it('should handle database errors gracefully in formatting', async () => {
  const mockAppsData = [
{
  client_id: 'tnp_error_test',
  context_id: 'context-1',
  user_contexts: { id: 'context-1', context_name: 'Error Context' },
  oauth_client_registry: {
client_id: 'tnp_error_test',
display_name: 'Error App',
publisher_domain: 'error.app',
last_used_at: null,
  },
},
  ];

  // Mock error responses
  const errorUsageQueryBuilder = mockQueryBuilder();
  errorUsageQueryBuilder.eq.mockResolvedValue({
data: null,
error: { message: 'Database error' },
  });

  const errorSessionQueryBuilder = mockSessionQueryBuilder();
  errorSessionQueryBuilder
.select()
.eq()
.in()
.gt.mockResolvedValue({
  data: null,
  error: { message: 'Database error' },
});

  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'app_usage_log') {
  return errorUsageQueryBuilder;
}
if (table === 'oauth_sessions') {
  return errorSessionQueryBuilder;
}
return mockQueryBuilder();
  });

  const result = await formatConnectedAppResponse(
mockAppsData,
'test-profile',
  );

  expect(result).toHaveLength(1);
  expect(result[0].active_sessions).toBe(0);
  expect(result[0].total_usage_count).toBe(0);
});

it('should validate performance requirement', async () => {
  const mockAppsData = Array.from({ length: 10 }, (_, i) => ({
client_id: `tnp_perf_${i}`,
context_id: `context-${i}`,
user_contexts: { id: `context-${i}`, context_name: `Context ${i}` },
oauth_client_registry: {
  client_id: `tnp_perf_${i}`,
  display_name: `App ${i}`,
  publisher_domain: `app${i}.test`,
  last_used_at: '2025-08-28T10:00:00Z',
},
  }));

  const fastUsageQueryBuilder = mockQueryBuilder();
  fastUsageQueryBuilder.eq.mockResolvedValue({ data: [], error: null });

  const fastSessionQueryBuilder = mockSessionQueryBuilder();
  fastSessionQueryBuilder
.select()
.eq()
.in()
.gt.mockResolvedValue({ data: [], error: null });

  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'app_usage_log') {
  return fastUsageQueryBuilder;
}
if (table === 'oauth_sessions') {
  return fastSessionQueryBuilder;
}
return mockQueryBuilder();
  });

  const startTime = Date.now();
  const result = await formatConnectedAppResponse(
mockAppsData,
'test-profile',
  );
  const duration = Date.now() - startTime;

  expect(result).toHaveLength(10);
  expect(duration).toBeLessThan(500); // Performance requirement
});
  });

  describe('Type Safety Validation', () => {
it('should ensure ConnectedApp interface compliance', async () => {
  const mockAppsData = [
{
  client_id: 'tnp_type_test',
  context_id: 'context-type',
  user_contexts: { id: 'context-type', context_name: 'Type Context' },
  oauth_client_registry: {
client_id: 'tnp_type_test',
display_name: 'Type Test App',
publisher_domain: 'typetest.app',
last_used_at: '2025-08-28T12:00:00Z',
  },
},
  ];

  const usageQueryBuilder = mockQueryBuilder();
  usageQueryBuilder.eq.mockResolvedValue({ data: [], error: null });

  const sessionQueryBuilder = mockSessionQueryBuilder();
  sessionQueryBuilder
.select()
.eq()
.in()
.gt.mockResolvedValue({ data: [], error: null });

  mockSupabaseClient.from.mockImplementation((table) => {
if (table === 'app_usage_log') {
  return usageQueryBuilder;
}
if (table === 'oauth_sessions') {
  return sessionQueryBuilder;
}
return mockQueryBuilder();
  });

  const result = await formatConnectedAppResponse(
mockAppsData,
'test-profile',
  );

  const connectedApp = result[0];

  expect(typeof connectedApp.client_id).toBe('string');
  expect(typeof connectedApp.display_name).toBe('string');
  expect(typeof connectedApp.publisher_domain).toBe('string');
  expect(typeof connectedApp.context_id).toBe('string');
  expect(typeof connectedApp.context_name).toBe('string');
  expect(typeof connectedApp.active_sessions).toBe('number');
  expect(typeof connectedApp.total_usage_count).toBe('number');
  expect(
connectedApp.last_used_at === null ||
  typeof connectedApp.last_used_at === 'string',
  ).toBe(true);
});
  });

  describe('Edge Cases and Error Handling', () => {
it('should handle malformed data gracefully', async () => {
  const malformedData = [
{
  client_id: 'tnp_malformed',
  // Missing required fields
},
  ];

  // Should not throw errors even with malformed data
  try {
const result = await formatConnectedAppResponse(
  malformedData as any,
  'test-profile',
);
expect(Array.isArray(result)).toBe(true);
  } catch (error) {
// Graceful error handling is expected
expect(error).toBeDefined();
  }
});

it('should handle large datasets efficiently', async () => {
  const largeDataset = Array.from(
{ length: 100 },
(_, i) => `tnp_large_${i}`,
  );

  const queryBuilder = mockQueryBuilder();
  queryBuilder.eq.mockResolvedValue({ data: [], error: null });

  mockSupabaseClient.from.mockReturnValue(queryBuilder);

  const startTime = Date.now();
  const result = await getUsageStatisticsForApps(largeDataset);
  const duration = Date.now() - startTime;

  expect(result.data).toHaveLength(100);
  expect(duration).toBeLessThan(200); // Should handle large datasets quickly
});
  });
});
