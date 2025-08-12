// TrueNamePath: TrueNameContextEngine Unit Tests
// Date: August 11, 2025
// Comprehensive test suite covering all resolution paths and error scenarios

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TrueNameContextEngine, type ResolveNameParams } from '../TrueNameContextEngine';
import { createMockSupabaseClient } from '../../__mocks__/supabase';

describe('TrueNameContextEngine', () => {
  let engine: TrueNameContextEngine;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
// Reset all mocks before each test
vi.clearAllMocks();

mockSupabase = createMockSupabaseClient();
engine = new TrueNameContextEngine(mockSupabase as any);
  });

  describe('Constructor and Factory', () => {
test('should create instance with provided Supabase client', () => {
  const customEngine = new TrueNameContextEngine(mockSupabase as any);
  expect(customEngine).toBeInstanceOf(TrueNameContextEngine);
});

test('should create instance with default client when none provided', () => {
  // This test would use the actual createServerSupabaseClient in real scenario
  const defaultEngine = new TrueNameContextEngine();
  expect(defaultEngine).toBeInstanceOf(TrueNameContextEngine);
});
  });

  describe('Priority 1: Consent-based Resolution', () => {
test('should resolve name when active consent exists', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
requesterUserId: 'requester-user-456',
contextName: 'Work Colleagues',
  };

  // Mock successful consent lookup
  mockSupabase.rpc.mockImplementation((functionName, params) => {
if (functionName === 'get_active_consent') {
  return Promise.resolve({
data: [
  {
context_id: 'context-789',
context_name: 'Work Colleagues',
consent_id: 'consent-abc',
granted_at: '2025-08-11T10:00:00Z',
expires_at: null,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock context assignment lookup for consent
  mockSupabase.from.mockImplementation((table) => {
if (table === 'context_name_assignments') {
  return {
select: vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
eq: vi.fn().mockReturnValue({
  single: vi.fn().mockResolvedValue({
data: { name_id: 'name-123' },
error: null,
  }),
}),
  }),
}),
  };
}

if (table === 'names') {
  return {
select: vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
single: vi.fn().mockResolvedValue({
  data: { name_text: 'Jędrzej Lewandowski' },
  error: null,
}),
  }),
}),
  };
}

if (table === 'audit_log_entries') {
  return {
insert: vi.fn().mockResolvedValue({
  data: null,
  error: null,
}),
  };
}

return {};
  });

  const result = await engine.resolveName(params);

  expect(result.name).toBe('Jędrzej Lewandowski');
  expect(result.source).toBe('consent_based');
  expect(result.metadata.contextName).toBe('Work Colleagues');
  expect(result.metadata.nameId).toBe('name-123');
  expect(result.metadata.consentId).toBe('consent-abc');
  expect(result.metadata.resolutionTimestamp).toBeDefined();
  expect(result.metadata.performanceMs).toBeDefined();
  expect(typeof result.metadata.performanceMs).toBe('number');

  // Verify consent lookup was called
  expect(mockSupabase.rpc).toHaveBeenCalledWith('get_active_consent', {
p_target_user_id: 'target-user-123',
p_requester_user_id: 'requester-user-456',
  });
});

test('should proceed to context resolution when no consent exists', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
requesterUserId: 'requester-user-456',
contextName: 'Social Friends',
  };

  // Mock no consent found
  mockSupabase.rpc.mockImplementation((functionName, params) => {
if (functionName === 'get_active_consent') {
  return Promise.resolve({ data: [], error: null });
}
if (functionName === 'get_context_assignment') {
  return Promise.resolve({
data: [
  {
name_id: 'name-456',
name_text: 'JJ',
context_id: 'context-456',
context_name: 'Social Friends',
name_type: 'NICKNAME',
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock audit log
  mockSupabase.from.mockImplementation((table) => {
if (table === 'audit_log_entries') {
  return {
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}
return {};
  });

  const result = await engine.resolveName(params);

  expect(result.name).toBe('JJ');
  expect(result.source).toBe('context_specific');
  expect(result.metadata.contextName).toBe('Social Friends');
  expect(result.metadata.nameId).toBe('name-456');

  // Verify both consent and context lookups were called
  expect(mockSupabase.rpc).toHaveBeenCalledWith('get_active_consent', {
p_target_user_id: 'target-user-123',
p_requester_user_id: 'requester-user-456',
  });
  expect(mockSupabase.rpc).toHaveBeenCalledWith('get_context_assignment', {
p_user_id: 'target-user-123',
p_context_name: 'Social Friends',
  });
});

test('should handle consent lookup database error gracefully', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
requesterUserId: 'requester-user-456',
  };

  // Mock consent lookup error
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_active_consent') {
  return Promise.resolve({
data: null,
error: { message: 'Database connection failed' },
  });
}
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [
  {
name_id: 'fallback-name',
name_text: 'Anonymous User',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock audit log
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveName(params);

  // Should fall back to preferred name since consent lookup failed
  expect(result.source).toBe('preferred_fallback');
  expect(result.metadata.fallbackReason).toBe('no_active_consent');
});
  });

  describe('Priority 2: Context-specific Resolution', () => {
test('should resolve name when context assignment exists', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
contextName: 'Professional Network',
  };

  // Mock context assignment lookup
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_context_assignment') {
  return Promise.resolve({
data: [
  {
name_id: 'name-789',
name_text: 'Li Wei',
context_id: 'context-prof',
context_name: 'Professional Network',
name_type: 'PREFERRED',
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock audit log
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveName(params);

  expect(result.name).toBe('Li Wei');
  expect(result.source).toBe('context_specific');
  expect(result.metadata.contextName).toBe('Professional Network');
  expect(result.metadata.nameId).toBe('name-789');
  expect(result.metadata.contextId).toBe('context-prof');
  expect(result.metadata.hadRequester).toBe(false);

  expect(mockSupabase.rpc).toHaveBeenCalledWith('get_context_assignment', {
p_user_id: 'target-user-123',
p_context_name: 'Professional Network',
  });
});

test('should proceed to fallback when context not found', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
contextName: 'Non-existent Context',
  };

  // Mock context assignment not found
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_context_assignment') {
  return Promise.resolve({ data: [], error: null });
}
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [
  {
name_id: 'preferred-name',
name_text: 'Default Name',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock audit log
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveName(params);

  expect(result.name).toBe('Default Name');
  expect(result.source).toBe('preferred_fallback');
  expect(result.metadata.fallbackReason).toBe('context_not_found_or_no_assignment');
  expect(result.metadata.requestedContext).toBe('Non-existent Context');
});

test('should handle empty context name', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
contextName: '   ', // Whitespace only
  };

  // Mock preferred name lookup
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [
  {
name_id: 'preferred-name',
name_text: 'Preferred Name',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock audit log
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveName(params);

  // Should skip to fallback due to empty context name
  expect(result.source).toBe('preferred_fallback');
  expect(result.metadata.fallbackReason).toBe('context_not_found_or_no_assignment');

  // Should not call context assignment function
  expect(mockSupabase.rpc).not.toHaveBeenCalledWith(
'get_context_assignment',
expect.any(Object)
  );
});
  });

  describe('Priority 3: Preferred Name Fallback', () => {
test('should return preferred name when available', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
  };

  // Mock preferred name lookup
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [
  {
name_id: 'preferred-123',
name_text: 'Alex Johnson',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock audit log
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveName(params);

  expect(result.name).toBe('Alex Johnson');
  expect(result.source).toBe('preferred_fallback');
  expect(result.metadata.fallbackReason).toBe('no_specific_request');
  expect(result.metadata.nameId).toBe('preferred-123');
  expect(result.metadata.hadRequester).toBe(false);

  expect(mockSupabase.rpc).toHaveBeenCalledWith('get_preferred_name', {
p_user_id: 'target-user-123',
  });
});

test('should return Anonymous User when no preferred name found', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
contextName: 'Unknown Context',
  };

  // Mock no preferred name found
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({ data: [], error: null });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock audit log
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveName(params);

  expect(result.name).toBe('Anonymous User');
  expect(result.source).toBe('preferred_fallback');
  expect(result.metadata.fallbackReason).toBe('context_not_found_or_no_assignment');
  expect(result.metadata.nameId).toBeUndefined();
});

test('should generate correct fallback reasons', async () => {
  // Mock no preferred name
  mockSupabase.rpc.mockImplementation(() =>
Promise.resolve({ data: [], error: null })
  );
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  // Test different fallback scenarios
  const testCases = [
{
  params: {
targetUserId: 'user-123',
requesterUserId: 'requester-456',
contextName: 'Work',
  },
  expectedReason: 'no_consent_and_no_context_assignment',
},
{
  params: {
targetUserId: 'user-123',
requesterUserId: 'requester-456',
  },
  expectedReason: 'no_active_consent',
},
{
  params: {
targetUserId: 'user-123',
contextName: 'Work',
  },
  expectedReason: 'context_not_found_or_no_assignment',
},
{
  params: {
targetUserId: 'user-123',
  },
  expectedReason: 'no_specific_request',
},
  ];

  for (const testCase of testCases) {
const result = await engine.resolveName(testCase.params);
expect(result.metadata.fallbackReason).toBe(testCase.expectedReason);
  }
});

test('should handle preferred name database error', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
  };

  // Mock database error
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: null,
error: { message: 'Connection timeout' },
  });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock audit log
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveName(params);

  expect(result.name).toBe('Anonymous User');
  expect(result.source).toBe('preferred_fallback');
  expect(result.metadata.fallbackReason).toBe('no_specific_request_with_database_error');
  expect(result.metadata.error).toBe('Connection timeout');
});
  });

  describe('Error Handling', () => {
test('should return error fallback on complete database failure', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
requesterUserId: 'requester-user-456',
contextName: 'Work',
  };

  // Mock complete database failure
  mockSupabase.rpc.mockRejectedValue(new Error('Database unavailable'));

  // Mock audit log still works
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveName(params);

  expect(result.name).toBe('Anonymous User');
  expect(result.source).toBe('error_fallback');
  expect(result.metadata.error).toBe('Database unavailable');
  expect(result.metadata.requestedContext).toBe('Work');
  expect(result.metadata.hadRequester).toBe(true);
  expect(result.metadata.performanceMs).toBeDefined();
});

test('should handle audit logging failure gracefully', async () => {
  const params: ResolveNameParams = {
targetUserId: 'target-user-123',
  };

  // Mock successful name resolution
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [
  {
name_id: 'name-123',
name_text: 'Test User',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  // Mock audit logging failure
  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({
  data: null,
  error: { message: 'Audit table unavailable' },
}),
  }));

  // Should still resolve name successfully despite audit failure
  const result = await engine.resolveName(params);

  expect(result.name).toBe('Test User');
  expect(result.source).toBe('preferred_fallback');
  // Should not throw error due to audit failure
});
  });

  describe('Utility Methods', () => {
test('resolveNameSimple should return just the name string', async () => {
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [
  {
name_id: 'name-123',
name_text: 'Simple Name',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveNameSimple('user-123', 'Work');
  expect(typeof result).toBe('string');
  expect(result).toBe('Simple Name');
});

test('resolveNamesAsync should handle batch resolution', async () => {
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [
  {
name_id: 'name-123',
name_text: 'Batch Name',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const requests = [
{ targetUserId: 'user-1' },
{ targetUserId: 'user-2', contextName: 'Work' },
{ targetUserId: 'user-3', requesterUserId: 'requester-1' },
  ];

  const results = await engine.resolveNamesAsync(requests);

  expect(results).toHaveLength(3);
  expect(results.every(r => r.name === 'Batch Name')).toBe(true);
  expect(results.every(r => r.source === 'preferred_fallback')).toBe(true);
});

test('benchmark should return performance statistics', async () => {
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [
  {
name_id: 'name-123',
name_text: 'Benchmark Name',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const params = { targetUserId: 'user-123' };
  const stats = await engine.benchmark(params, 5);

  expect(stats.iterations).toBe(5);
  expect(stats.averageMs).toBeGreaterThan(0);
  expect(stats.minMs).toBeGreaterThan(0);
  expect(stats.maxMs).toBeGreaterThan(0);
  expect(stats.totalMs).toBeGreaterThan(0);
  expect(stats.maxMs).toBeGreaterThanOrEqual(stats.minMs);
  expect(Math.abs(stats.totalMs - stats.averageMs * 5)).toBeLessThan(0.1);
});
  });

  describe('Performance Monitoring', () => {
test('should include performance metrics in resolution metadata', async () => {
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  // Add small delay to ensure measurable performance
  return new Promise(resolve => {
setTimeout(() => {
  resolve({
data: [
  {
name_id: 'name-123',
name_text: 'Performance Test',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}, 1);
  });
}
return Promise.resolve({ data: [], error: null });
  });

  mockSupabase.from.mockImplementation(() => ({
insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const result = await engine.resolveName({ targetUserId: 'user-123' });

  expect(result.metadata.performanceMs).toBeDefined();
  expect(typeof result.metadata.performanceMs).toBe('number');
  expect(result.metadata.performanceMs).toBeGreaterThan(0);
});

test('should include performance metrics in audit logs', async () => {
  mockSupabase.rpc.mockImplementation((functionName) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [
  {
name_id: 'name-123',
name_text: 'Audit Test',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });

  const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  mockSupabase.from.mockImplementation(() => ({
insert: mockInsert,
  }));

  await engine.resolveName({ targetUserId: 'user-123' });

  expect(mockInsert).toHaveBeenCalledWith(
expect.objectContaining({
  details: expect.objectContaining({
performance_ms: expect.any(Number),
  }),
})
  );
});
  });
});