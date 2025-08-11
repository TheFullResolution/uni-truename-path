import { test, expect } from '@playwright/test';
import { DatabaseTestHelper, supabase } from '../../utils/db-helpers';

test.describe('resolve_name() Performance Testing - Step 2 Architecture', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should resolve names in under 100ms (performance requirement)', async () => {
const uniqueId = Math.random().toString(36).substring(7);

// Create test data with multiple names and contexts
const userData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-performance-${uniqueId}@example.test`,
  {
names: [
  {
name_text: 'Performance Test User',
name_type: 'PREFERRED',
is_preferred: true,
  },
  { name_text: 'P. User', name_type: 'ALIAS', is_preferred: false },
  {
name_text: 'Performance Legal Name',
name_type: 'LEGAL',
is_preferred: false,
  },
],
contexts: [
  {
context_name: 'Performance Context',
description: 'Testing performance',
assigned_name: 'Performance Test User',
  },
  {
context_name: 'Speed Test',
description: 'Speed testing context',
assigned_name: 'P. User',
  },
],
  },
);

// Test different resolution types and measure performance
const performanceTests = [
  {
name: 'Preferred name fallback',
params: {
  p_target_user_id: userData.profile.id,
  p_requester_user_id: null,
  p_context_name: null,
},
  },
  {
name: 'Context-specific resolution',
params: {
  p_target_user_id: userData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'Performance Context',
},
  },
  {
name: 'Context not found fallback',
params: {
  p_target_user_id: userData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'NonExistent Context',
},
  },
];

for (const testCase of performanceTests) {
  // Run multiple iterations to get stable measurements
  const measurements: number[] = [];

  for (let i = 0; i < 10; i++) {
const startTime = performance.now();

const { data, error } = await supabase.rpc(
  'resolve_name',
  testCase.params,
);

const endTime = performance.now();
const duration = endTime - startTime;

expect(error).toBeNull();
expect(data).toBeTruthy();
measurements.push(duration);
  }

  // Calculate statistics
  const avgTime =
measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  const maxTime = Math.max(...measurements);
  const minTime = Math.min(...measurements);

  console.log(
`${testCase.name} - Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms`,
  );

  // Performance requirement: <100ms response time
  expect(avgTime).toBeLessThan(100);
  expect(maxTime).toBeLessThan(200); // Allow some variance for max
}
  });

  test('should handle concurrent name resolution efficiently', async () => {
const uniqueId = Math.random().toString(36).substring(7);

// Create multiple users for concurrent testing
const users = await Promise.all([
  DatabaseTestHelper.createPersonaWithContexts(
`test-concurrent-1-${uniqueId}@example.test`,
{
  names: [
{
  name_text: 'Concurrent User 1',
  name_type: 'PREFERRED',
  is_preferred: true,
},
  ],
  contexts: [
{
  context_name: 'Concurrent Context 1',
  description: 'Testing',
  assigned_name: 'Concurrent User 1',
},
  ],
},
  ),
  DatabaseTestHelper.createPersonaWithContexts(
`test-concurrent-2-${uniqueId}@example.test`,
{
  names: [
{
  name_text: 'Concurrent User 2',
  name_type: 'PREFERRED',
  is_preferred: true,
},
  ],
  contexts: [
{
  context_name: 'Concurrent Context 2',
  description: 'Testing',
  assigned_name: 'Concurrent User 2',
},
  ],
},
  ),
  DatabaseTestHelper.createPersonaWithContexts(
`test-concurrent-3-${uniqueId}@example.test`,
{
  names: [
{
  name_text: 'Concurrent User 3',
  name_type: 'PREFERRED',
  is_preferred: true,
},
  ],
  contexts: [
{
  context_name: 'Concurrent Context 3',
  description: 'Testing',
  assigned_name: 'Concurrent User 3',
},
  ],
},
  ),
]);

// Test concurrent resolution
const startTime = performance.now();

const concurrentPromises = users.flatMap((user, index) => [
  // Test context-specific resolution
  supabase.rpc('resolve_name', {
p_target_user_id: user.profile.id,
p_context_name: `Concurrent Context ${index + 1}`,
  }),
  // Test preferred name fallback
  supabase.rpc('resolve_name', {
p_target_user_id: user.profile.id,
  }),
]);

const results = await Promise.all(concurrentPromises);
const endTime = performance.now();
const totalTime = endTime - startTime;

// Verify all requests succeeded
results.forEach((result, index) => {
  expect(result.error).toBeNull();
  expect(result.data).toBeTruthy();
});

console.log(
  `Concurrent resolution of ${results.length} requests: ${totalTime.toFixed(2)}ms`,
);

// Even with concurrent requests, average per request should be reasonable
const avgPerRequest = totalTime / results.length;
expect(avgPerRequest).toBeLessThan(50); // Concurrent should be faster per request
  });

  test('should validate audit log performance', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const userData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-audit-performance-${uniqueId}@example.test`,
  {
names: [
  {
name_text: 'Audit Test User',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
contexts: [
  {
context_name: 'Audit Context',
description: 'Testing audit performance',
assigned_name: 'Audit Test User',
  },
],
  },
);

// Generate multiple resolutions to create audit entries
const resolutionCount = 20;
const resolutionPromises = [];

for (let i = 0; i < resolutionCount; i++) {
  resolutionPromises.push(
supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_context_name: 'Audit Context',
}),
  );
}

const startTime = performance.now();
await Promise.all(resolutionPromises);
const endTime = performance.now();
const totalTime = endTime - startTime;

console.log(
  `${resolutionCount} name resolutions with audit logging: ${totalTime.toFixed(2)}ms`,
);

// Verify audit entries were created
const { count } = await supabase
  .from('audit_log_entries')
  .select('*', { count: 'exact', head: true })
  .eq('target_user_id', userData.profile.id);

expect(count).toBe(resolutionCount);

// Performance should still be good even with audit logging
const avgTimePerResolution = totalTime / resolutionCount;
expect(avgTimePerResolution).toBeLessThan(100);
  });

  test('should test helper function performance', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const userData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-helper-performance-${uniqueId}@example.test`,
  {
names: [
  {
name_text: 'Helper Test User',
name_type: 'PREFERRED',
is_preferred: true,
  },
  { name_text: 'H. User', name_type: 'ALIAS', is_preferred: false },
],
contexts: [
  {
context_name: 'Helper Context 1',
description: 'Testing',
assigned_name: 'Helper Test User',
  },
  {
context_name: 'Helper Context 2',
description: 'Testing',
assigned_name: 'H. User',
  },
],
  },
);

// Test get_user_contexts performance
const startTime = performance.now();

const { data: contexts } = await supabase.rpc('get_user_contexts', {
  p_user_id: userData.profile.id,
});

const endTime = performance.now();
const duration = endTime - startTime;

console.log(`get_user_contexts performance: ${duration.toFixed(2)}ms`);

expect(contexts).toHaveLength(2);
expect(duration).toBeLessThan(50); // Helper functions should be fast

// Test get_user_audit_log performance
const startTime2 = performance.now();

const { data: auditLog } = await supabase.rpc('get_user_audit_log', {
  p_user_id: userData.profile.id,
  p_limit: 10,
});

const endTime2 = performance.now();
const duration2 = endTime2 - startTime2;

console.log(`get_user_audit_log performance: ${duration2.toFixed(2)}ms`);

expect(auditLog).toBeDefined();
expect(duration2).toBeLessThan(50); // Helper functions should be fast
  });
});
