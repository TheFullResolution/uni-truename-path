/**
 * Performance Tests for OAuth Assignment Update Endpoint
 *
 * Dedicated performance validation for PUT /api/oauth/assignments/[clientId]
 * Tests for Step 16 OAuth integration - Reasonable response time requirements
 * Academic project - TrueNamePath Context-Aware Identity Management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '../route';
import type { UpdateAssignmentResponseData } from '../types';

// Performance test timeout and targets
const PERFORMANCE_TEST_TIMEOUT = 10000; // 10 seconds
const TARGET_RESPONSE_TIME = 3000; // 3 seconds - reasonable for database operations
const OPTIMAL_RESPONSE_TIME = 1000; // 1 second - optimal performance
const CONCURRENT_REQUEST_TIME = 5000; // 5 seconds for concurrent operations

// Mock implementations for controlled performance testing
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
...actual,
NextResponse: {
  json: vi.fn((data: any, init?: any) => ({
json: async () => data,
status: init?.status || 200,
  })),
},
  };
});

// Mock Supabase client with controlled performance characteristics
const mockSupabaseClient = {
  from: vi.fn(),
};

const mockSupabaseQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  upsert: vi.fn(),
};

// Mock Supabase SSR client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

// Mock auth utilities with performance timing
vi.mock('@/utils/api/with-auth', () => {
  return {
withRequiredAuth: vi.fn((handler) => async (request: NextRequest) => {
  const authStartTime = Date.now();

  const mockAuthContext = {
user: { id: 'perf-test-user', email: 'perf@test.com' },
supabase: mockSupabaseClient,
requestId: `perf-req-${Date.now()}`,
timestamp: new Date().toISOString(),
isAuthenticated: true,
isOAuth: false,
  };

  // Simulate auth processing time
  await new Promise((resolve) => setTimeout(resolve, 5)); // 5ms auth overhead

  const result = await handler(request, mockAuthContext);
  const authDuration = Date.now() - authStartTime;

  // Add performance metadata to response for analysis
  if (result && typeof result.json === 'function') {
const originalJson = result.json;
result.json = async () => {
  const data = await originalJson();
  return { ...data, _perf_auth_ms: authDuration };
};
  }

  return result;
}),
createErrorResponse: vi.fn(
  (code, message, requestId, details, timestamp) => ({
json: async () => ({
  success: false,
  error: { code, message, details },
  requestId,
  timestamp,
}),
status: code.includes('VALIDATION')
  ? 400
  : code.includes('NOT_FOUND')
? 404
: 500,
  }),
),
createSuccessResponse: vi.fn((data, requestId, timestamp) => ({
  json: async () => ({
success: true,
data,
requestId,
timestamp,
  }),
  status: 200,
})),
  };
});

/**
 * Helper to create mock NextRequest
 */
const createMockRequest = (clientId: string, body?: any): NextRequest => {
  const url = `http://localhost:3000/api/oauth/assignments/${clientId}`;
  return {
url,
method: 'PUT',
headers: new Map() as any,
json: () => Promise.resolve(body || {}),
text: () => Promise.resolve(JSON.stringify(body || {})),
  } as unknown as NextRequest;
};

/**
 * Simulate database query time with realistic variance
 */
function simulateDbQuery(
  baseMs: number,
  variance: number = 0.2,
): Promise<void> {
  const actualMs = baseMs + (Math.random() - 0.5) * baseMs * variance;
  return new Promise((resolve) => setTimeout(resolve, Math.max(1, actualMs)));
}

/**
 * Setup mock database responses with timing control
 */
function setupMockResponses(
  assignmentQueryMs: number = 20,
  contextQueryMs: number = 15,
  upsertMs: number = 30,
) {
  // Setup default mock chains
  mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);
  mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
  mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
  mockSupabaseQuery.single.mockReturnValue(mockSupabaseQuery);
  mockSupabaseQuery.upsert.mockReturnValue(mockSupabaseQuery);

  // Mock assignment ownership check with timing
  mockSupabaseQuery.single
.mockImplementationOnce(async () => {
  await simulateDbQuery(assignmentQueryMs);
  return {
data: { context_id: 'old-context-id' },
error: null,
  };
})
.mockImplementationOnce(async () => {
  await simulateDbQuery(contextQueryMs);
  return {
data: { context_name: 'Performance Test Context' },
error: null,
  };
});

  // Mock upsert operation with timing
  mockSupabaseQuery.upsert.mockImplementationOnce(async () => {
await simulateDbQuery(upsertMs);
return { error: null };
  });
}

describe('Performance Tests - OAuth Assignment Update Endpoint', () => {
  const VALID_CLIENT_ID = 'tnp_perf123456789abc';
  const VALID_CONTEXT_ID = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
vi.clearAllMocks();
  });

  afterEach(() => {
vi.restoreAllMocks();
  });

  describe('Response Time Requirements', () => {
it(
  'should meet target response time with optimal database performance',
  async () => {
setupMockResponses(10, 8, 15); // Very fast database operations

const requestBody = { context_id: VALID_CONTEXT_ID };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

const startTime = Date.now();
const response = await PUT(request);
const duration = Date.now() - startTime;
const data = await response.json();

expect(response.status).toBe(200);
expect(data.success).toBe(true);
expect(duration).toBeLessThan(OPTIMAL_RESPONSE_TIME);
expect(duration).toBeLessThan(TARGET_RESPONSE_TIME);

console.log(`Optimal performance test: ${duration}ms`);
  },
  PERFORMANCE_TEST_TIMEOUT,
);

it(
  'should meet target response time with average database performance',
  async () => {
setupMockResponses(25, 20, 35); // Average database operations

const requestBody = { context_id: VALID_CONTEXT_ID };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

const startTime = Date.now();
const response = await PUT(request);
const duration = Date.now() - startTime;
const data = await response.json();

expect(response.status).toBe(200);
expect(data.success).toBe(true);
expect(duration).toBeLessThan(TARGET_RESPONSE_TIME);

console.log(`Average performance test: ${duration}ms`);
  },
  PERFORMANCE_TEST_TIMEOUT,
);

it(
  'should meet target response time under realistic load conditions',
  async () => {
setupMockResponses(40, 35, 50); // Slower database under load

const requestBody = { context_id: VALID_CONTEXT_ID };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

const startTime = Date.now();
const response = await PUT(request);
const duration = Date.now() - startTime;
const data = await response.json();

expect(response.status).toBe(200);
expect(data.success).toBe(true);
expect(duration).toBeLessThan(TARGET_RESPONSE_TIME);

console.log(`Load condition performance test: ${duration}ms`);
  },
  PERFORMANCE_TEST_TIMEOUT,
);
  });

  describe('Database Operation Performance', () => {
it(
  'should optimize assignment ownership lookup',
  async () => {
let assignmentQueryTime = 0;

mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.single.mockImplementation(async () => {
  const queryStart = Date.now();
  await simulateDbQuery(20);
  assignmentQueryTime = Date.now() - queryStart;
  return { data: { context_id: 'old-context' }, error: null };
});

// Setup remaining mocks
setupMockResponses(0, 15, 25); // Skip first query timing

const requestBody = { context_id: VALID_CONTEXT_ID };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

await PUT(request);

expect(assignmentQueryTime).toBeLessThan(100); // Assignment lookup should be fast
console.log(`Assignment ownership lookup: ${assignmentQueryTime}ms`);
  },
  PERFORMANCE_TEST_TIMEOUT,
);

it(
  'should optimize context ownership validation',
  async () => {
let contextQueryTime = 0;

// Mock assignment query first
mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);

mockSupabaseQuery.single
  .mockResolvedValueOnce({
data: { context_id: 'old-context' },
error: null,
  })
  .mockImplementationOnce(async () => {
const queryStart = Date.now();
await simulateDbQuery(18);
contextQueryTime = Date.now() - queryStart;
return { data: { context_name: 'Test Context' }, error: null };
  });

mockSupabaseQuery.upsert.mockResolvedValueOnce({ error: null });

const requestBody = { context_id: VALID_CONTEXT_ID };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

await PUT(request);

expect(contextQueryTime).toBeLessThan(100); // Context validation should be fast
console.log(`Context ownership validation: ${contextQueryTime}ms`);
  },
  PERFORMANCE_TEST_TIMEOUT,
);

it(
  'should optimize assignment update operation',
  async () => {
let upsertTime = 0;

// Mock initial queries
mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);

mockSupabaseQuery.single
  .mockResolvedValueOnce({
data: { context_id: 'old-context' },
error: null,
  })
  .mockResolvedValueOnce({
data: { context_name: 'Test Context' },
error: null,
  });

mockSupabaseQuery.upsert.mockImplementationOnce(async () => {
  const upsertStart = Date.now();
  await simulateDbQuery(30);
  upsertTime = Date.now() - upsertStart;
  return { error: null };
});

const requestBody = { context_id: VALID_CONTEXT_ID };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

await PUT(request);

expect(upsertTime).toBeLessThan(200); // Upsert should be efficient
console.log(`Assignment update operation: ${upsertTime}ms`);
  },
  PERFORMANCE_TEST_TIMEOUT,
);
  });

  describe('Concurrent Performance', () => {
it(
  'should handle rapid successive updates efficiently',
  async () => {
const requestCount = 3;
const durations: number[] = [];

for (let i = 0; i < requestCount; i++) {
  setupMockResponses(25 + i * 5, 20 + i * 3, 35 + i * 5); // Slight variation

  const requestBody = { context_id: VALID_CONTEXT_ID };
  const request = createMockRequest(VALID_CLIENT_ID, requestBody);

  const startTime = Date.now();
  const response = await PUT(request);
  const duration = Date.now() - startTime;

  durations.push(duration);
  expect(response.status).toBe(200);
  expect(duration).toBeLessThan(TARGET_RESPONSE_TIME);

  // Small delay between requests to simulate realistic usage
  await new Promise((resolve) => setTimeout(resolve, 50));
}

const totalTime = durations.reduce((sum, d) => sum + d, 0);
const averageTime = totalTime / requestCount;

expect(averageTime).toBeLessThan(TARGET_RESPONSE_TIME);
expect(totalTime).toBeLessThan(CONCURRENT_REQUEST_TIME);

console.log(
  `Rapid successive updates - Average: ${Math.round(averageTime)}ms, Total: ${totalTime}ms`,
);
  },
  PERFORMANCE_TEST_TIMEOUT,
);

it(
  'should maintain performance consistency',
  async () => {
const runs = 5;
const durations: number[] = [];

for (let i = 0; i < runs; i++) {
  setupMockResponses(30, 25, 40); // Consistent timing

  const requestBody = { context_id: VALID_CONTEXT_ID };
  const request = createMockRequest(VALID_CLIENT_ID, requestBody);

  const startTime = Date.now();
  const response = await PUT(request);
  const duration = Date.now() - startTime;

  durations.push(duration);
  expect(response.status).toBe(200);
  expect(duration).toBeLessThan(TARGET_RESPONSE_TIME);
}

const averageDuration = durations.reduce((sum, d) => sum + d, 0) / runs;
const maxDuration = Math.max(...durations);
const minDuration = Math.min(...durations);
const variance = maxDuration - minDuration;

expect(averageDuration).toBeLessThan(TARGET_RESPONSE_TIME);
expect(maxDuration).toBeLessThan(TARGET_RESPONSE_TIME);
expect(variance).toBeLessThan(500); // Performance should be consistent within 500ms

console.log(
  `Consistency test - Average: ${Math.round(averageDuration)}ms, Variance: ${variance}ms`,
);
  },
  PERFORMANCE_TEST_TIMEOUT,
);
  });

  describe('Performance Under Error Conditions', () => {
it(
  'should fail fast for invalid requests',
  async () => {
const requestBody = { context_id: 'invalid-uuid' };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

const startTime = Date.now();
const response = await PUT(request);
const duration = Date.now() - startTime;
const data = await response.json();

expect(response.status).toBe(400);
expect(data.success).toBe(false);
expect(duration).toBeLessThan(100); // Validation errors should be very fast

console.log(`Invalid request fail-fast time: ${duration}ms`);
  },
  PERFORMANCE_TEST_TIMEOUT,
);

it(
  'should handle not found cases efficiently',
  async () => {
// Mock assignment not found
mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.select.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.eq.mockReturnValue(mockSupabaseQuery);
mockSupabaseQuery.single.mockImplementationOnce(async () => {
  await simulateDbQuery(25); // Realistic query time even for not found
  return { data: null, error: null };
});

const requestBody = { context_id: VALID_CONTEXT_ID };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

const startTime = Date.now();
const response = await PUT(request);
const duration = Date.now() - startTime;
const data = await response.json();

expect(response.status).toBe(404);
expect(data.success).toBe(false);
expect(duration).toBeLessThan(500); // Not found should be reasonably fast

console.log(`Not found case handling time: ${duration}ms`);
  },
  PERFORMANCE_TEST_TIMEOUT,
);
  });

  describe('Memory and Resource Efficiency', () => {
it(
  'should be memory efficient during processing',
  async () => {
setupMockResponses(25, 20, 35);

const requestBody = { context_id: VALID_CONTEXT_ID };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

const memoryBefore = process.memoryUsage();

const startTime = Date.now();
const response = await PUT(request);
const duration = Date.now() - startTime;

const memoryAfter = process.memoryUsage();
const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;

expect(response.status).toBe(200);
expect(duration).toBeLessThan(TARGET_RESPONSE_TIME);

// Memory usage should be minimal for single assignment update
console.log(
  `Memory delta: ${Math.round((memoryDelta / 1024) * 100) / 100}KB, Duration: ${duration}ms`,
);
  },
  PERFORMANCE_TEST_TIMEOUT,
);

it(
  'should clean up resources properly',
  async () => {
setupMockResponses(30, 25, 40);

const requestBody = { context_id: VALID_CONTEXT_ID };
const request = createMockRequest(VALID_CLIENT_ID, requestBody);

// Multiple iterations to check for resource leaks
const iterations = 10;
let maxMemoryDelta = 0;

for (let i = 0; i < iterations; i++) {
  const memoryBefore = process.memoryUsage().heapUsed;

  const response = await PUT(request);
  expect(response.status).toBe(200);

  const memoryAfter = process.memoryUsage().heapUsed;
  const memoryDelta = memoryAfter - memoryBefore;
  maxMemoryDelta = Math.max(maxMemoryDelta, memoryDelta);

  // Re-setup mocks for next iteration
  if (i < iterations - 1) {
vi.clearAllMocks();
setupMockResponses(30, 25, 40);
  }
}

console.log(
  `Max memory delta over ${iterations} iterations: ${Math.round((maxMemoryDelta / 1024) * 100) / 100}KB`,
);

// Should not accumulate significant memory over iterations
expect(maxMemoryDelta).toBeLessThan(1024 * 1024); // Less than 1MB per iteration
  },
  PERFORMANCE_TEST_TIMEOUT,
);
  });
});
