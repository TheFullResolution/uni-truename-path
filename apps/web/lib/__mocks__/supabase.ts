// Mock Supabase client for testing TrueNameContextEngine
// Date: August 11, 2025
// Provides comprehensive mocking for all Supabase operations used by the context engine

import { vi } from 'vitest';

/**
 * Mock implementation of Supabase client for unit testing
 * Matches the interface expected by TrueNameContextEngine
 */
export function createMockSupabaseClient() {
  // Mock data storage for stateful testing
  const mockData = {
consents: new Map(),
contexts: new Map(),
names: new Map(),
assignments: new Map(),
auditLogs: [] as any[],
  };

  // Mock query builder chain methods
  const createMockQueryBuilder = () => ({
select: vi.fn().mockReturnThis(),
from: vi.fn().mockReturnThis(),
eq: vi.fn().mockReturnThis(),
single: vi.fn(),
insert: vi.fn(),
update: vi.fn(),
delete: vi.fn(),
upsert: vi.fn(),
order: vi.fn().mockReturnThis(),
limit: vi.fn().mockReturnThis(),
range: vi.fn().mockReturnThis(),
  });

  const mockClient = {
// RPC function calls (for helper functions)
rpc: vi.fn().mockImplementation((functionName: string, params: any) => {
  // Default implementation returns empty results
  return Promise.resolve({ data: [], error: null });
}),

// Table operations
from: vi.fn().mockImplementation((table: string) => {
  const queryBuilder = createMockQueryBuilder();
  
  // Configure specific table behaviors
  if (table === 'names') {
queryBuilder.single.mockImplementation(() => {
  return Promise.resolve({
data: { name_text: 'Mock Name' },
error: null,
  });
});
  }
  
  if (table === 'context_name_assignments') {
queryBuilder.single.mockImplementation(() => {
  return Promise.resolve({
data: { name_id: 'mock-name-id' },
error: null,
  });
});
  }
  
  if (table === 'audit_log_entries') {
queryBuilder.insert.mockImplementation((data: any) => {
  mockData.auditLogs.push(data);
  return Promise.resolve({
data: null,
error: null,
  });
});
  }

  return queryBuilder;
}),

// Auth operations (not used by context engine but included for completeness)
auth: {
  getUser: vi.fn().mockResolvedValue({
data: { user: null },
error: null,
  }),
  getSession: vi.fn().mockResolvedValue({
data: { session: null },
error: null,
  }),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
  refreshSession: vi.fn(),
},

// Storage operations (not used by context engine)
storage: {
  from: vi.fn(),
},

// Helper methods for test data management
__testHelpers: {
  // Reset all mock data
  reset: () => {
mockData.consents.clear();
mockData.contexts.clear();
mockData.names.clear();
mockData.assignments.clear();
mockData.auditLogs.length = 0;
vi.clearAllMocks();
  },

  // Set mock data for specific scenarios
  setMockConsent: (targetUserId: string, requesterUserId: string, contextData: any) => {
const key = `${targetUserId}:${requesterUserId}`;
mockData.consents.set(key, contextData);
  },

  setMockContext: (userId: string, contextName: string, assignmentData: any) => {
const key = `${userId}:${contextName}`;
mockData.contexts.set(key, assignmentData);
  },

  setMockName: (nameId: string, nameData: any) => {
mockData.names.set(nameId, nameData);
  },

  // Get audit logs for verification
  getAuditLogs: () => [...mockData.auditLogs],

  // Get call counts for verification
  getRpcCallCount: (functionName?: string) => {
const calls = (mockClient.rpc as vi.MockedFunction).mock.calls;
if (functionName) {
  return calls.filter(call => call[0] === functionName).length;
}
return calls.length;
  },

  // Get the last RPC call arguments
  getLastRpcCall: () => {
const calls = (mockClient.rpc as vi.MockedFunction).mock.calls;
return calls[calls.length - 1];
  },
},
  };

  return mockClient;
}

/**
 * Demo persona data for testing with realistic scenarios
 */
export const mockDemoPersonas = {
  jj: {
id: '54c00e81-cda9-4251-9456-7778df91b988',
names: {
  legal: { id: 'jj-legal', text: 'Jędrzej Lewandowski', type: 'LEGAL' },
  preferred: { id: 'jj-preferred', text: 'Jędrzej', type: 'PREFERRED' },
  nickname: { id: 'jj-nickname', text: 'JJ', type: 'NICKNAME' },
},
contexts: {
  work: { id: 'jj-work-ctx', name: 'Work', assignedName: 'jj-legal' },
  social: { id: 'jj-social-ctx', name: 'Social Friends', assignedName: 'jj-nickname' },
},
  },

  liwei: {
id: '809d0224-81f1-48a0-9405-2258de21ea60',
names: {
  legal: { id: 'lw-legal', text: '李伟', type: 'LEGAL' },
  western: { id: 'lw-western', text: 'Li Wei', type: 'PREFERRED' },
  nickname: { id: 'lw-nickname', text: 'Wei', type: 'NICKNAME' },
},
contexts: {
  professional: { id: 'lw-prof-ctx', name: 'Professional Network', assignedName: 'lw-western' },
  family: { id: 'lw-family-ctx', name: 'Family', assignedName: 'lw-legal' },
},
  },

  alex: {
id: '257113c8-7a62-4758-9b1b-7992dd8aca1e',
names: {
  legal: { id: 'alex-legal', text: 'Alexander Rodriguez', type: 'LEGAL' },
  preferred: { id: 'alex-preferred', text: 'Alex', type: 'PREFERRED' },
  alias: { id: 'alex-alias', text: '@CodeAlex', type: 'ALIAS' },
},
contexts: {
  github: { id: 'alex-github-ctx', name: 'GitHub', assignedName: 'alex-alias' },
  work: { id: 'alex-work-ctx', name: 'Work', assignedName: 'alex-preferred' },
},
  },
};

/**
 * Factory function to create pre-configured mock clients for specific scenarios
 */
export function createMockClientForScenario(scenario: 'consent' | 'context' | 'fallback' | 'error') {
  const mockClient = createMockSupabaseClient();

  switch (scenario) {
case 'consent':
  // Configure for consent-based resolution testing
  mockClient.rpc.mockImplementation((functionName: string, params: any) => {
if (functionName === 'get_active_consent') {
  return Promise.resolve({
data: [{
  context_id: 'consent-context-123',
  context_name: 'Work Colleagues',
  consent_id: 'consent-abc',
  granted_at: '2025-08-11T10:00:00Z',
  expires_at: null,
}],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });
  break;

case 'context':
  // Configure for context-specific resolution testing
  mockClient.rpc.mockImplementation((functionName: string, params: any) => {
if (functionName === 'get_context_assignment') {
  return Promise.resolve({
data: [{
  name_id: 'context-name-456',
  name_text: 'Context Name',
  context_id: 'context-456',
  context_name: params.p_context_name,
  name_type: 'PREFERRED',
}],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });
  break;

case 'fallback':
  // Configure for preferred name fallback testing
  mockClient.rpc.mockImplementation((functionName: string, params: any) => {
if (functionName === 'get_preferred_name') {
  return Promise.resolve({
data: [{
  name_id: 'preferred-789',
  name_text: 'Fallback Name',
  name_type: 'PREFERRED',
  is_preferred: true,
}],
error: null,
  });
}
return Promise.resolve({ data: [], error: null });
  });
  break;

case 'error':
  // Configure for error scenario testing
  mockClient.rpc.mockRejectedValue(new Error('Database connection failed'));
  break;
  }

  return mockClient;
}

/**
 * Vitest setup helper for TrueNameContextEngine tests
 */
export function setupMockEnvironment() {
  // Mock performance.now() for consistent testing
  const mockPerformanceNow = vi.fn();
  let performanceCounter = 0;
  
  mockPerformanceNow.mockImplementation(() => {
performanceCounter += 1.5; // Simulate 1.5ms increments
return performanceCounter;
  });

  // Replace global performance.now if available
  if (typeof performance !== 'undefined') {
vi.spyOn(performance, 'now').mockImplementation(mockPerformanceNow);
  } else {
// Node.js environment fallback
(global as any).performance = { now: mockPerformanceNow };
  }

  // Mock console methods to avoid noise in tests
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;

  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});

  return {
cleanup: () => {
  vi.restoreAllMocks();
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
},
  };
}

/**
 * Type-safe mock client interface for TypeScript
 */
export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;