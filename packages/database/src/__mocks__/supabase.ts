// Mock Supabase client for database package testing
// Date: August 12, 2025
// Provides comprehensive mocking for Supabase operations used by client and auth modules

import { vi } from 'vitest';
import type { Database } from '../types';

/**
 * Mock implementation of Supabase client specifically for database package testing
 * Focuses on auth operations and basic query functionality
 */
export function createMockSupabaseClient() {
  // Mock data storage for stateful testing
  const mockData = {
users: new Map(),
sessions: new Map(),
profiles: new Map(),
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
// Auth operations (primary focus for database package)
auth: {
  getUser: vi.fn().mockImplementation((token?: string) => {
if (token && mockData.users.has(token)) {
  return Promise.resolve({
data: { user: mockData.users.get(token) },
error: null,
  });
}
return Promise.resolve({
  data: { user: null },
  error: null,
});
  }),

  getSession: vi.fn().mockImplementation(() => {
const sessions = Array.from(mockData.sessions.values());
const activeSession = sessions.find((s: any) => s.active);
return Promise.resolve({
  data: { session: activeSession || null },
  error: null,
});
  }),

  signInWithPassword: vi.fn().mockImplementation(({ email, password }) => {
if (email === 'test@example.com' && password === 'password123') {
  const user = {
id: 'test-user-id',
email: 'test@example.com',
created_at: new Date().toISOString(),
  };
  mockData.users.set('test-token', user);
  return Promise.resolve({
data: { user, session: { access_token: 'test-token' } },
error: null,
  });
}
return Promise.resolve({
  data: { user: null, session: null },
  error: { message: 'Invalid credentials' },
});
  }),

  signUp: vi.fn().mockImplementation(({ email, password }) => {
if (email && password) {
  const user = {
id: `user-${Date.now()}`,
email,
created_at: new Date().toISOString(),
  };
  return Promise.resolve({
data: { user, session: null }, // Typical signup flow requires confirmation
error: null,
  });
}
return Promise.resolve({
  data: { user: null, session: null },
  error: { message: 'Invalid signup data' },
});
  }),

  signOut: vi.fn().mockImplementation(() => {
mockData.sessions.clear();
return Promise.resolve({ error: null });
  }),

  onAuthStateChange: vi.fn().mockImplementation((callback) => {
// Return unsubscribe function
return {
  data: { subscription: { unsubscribe: vi.fn() } },
  error: null,
};
  }),

  refreshSession: vi.fn().mockImplementation(() => {
const sessions = Array.from(mockData.sessions.values());
const activeSession = sessions.find((s: any) => s.active);
return Promise.resolve({
  data: { session: activeSession || null },
  error: null,
});
  }),
},

// Table operations
from: vi.fn().mockImplementation((table: string) => {
  const queryBuilder = createMockQueryBuilder();

  // Configure specific table behaviors
  if (table === 'profiles') {
queryBuilder.single.mockImplementation(() => {
  return Promise.resolve({
data: { id: 'test-user-id', email: 'test@example.com' },
error: null,
  });
});

queryBuilder.upsert.mockImplementation((data: any) => {
  mockData.profiles.set(data.id, data);
  return Promise.resolve({
data: null,
error: null,
  });
});
  }

  return queryBuilder;
}),

// RPC function calls
rpc: vi.fn().mockImplementation((functionName: string, params: any) => {
  return Promise.resolve({ data: [], error: null });
}),

// Storage operations (minimal for database package)
storage: {
  from: vi.fn(),
},

// Helper methods for test data management
__testHelpers: {
  // Reset all mock data
  reset: () => {
mockData.users.clear();
mockData.sessions.clear();
mockData.profiles.clear();
mockData.auditLogs.length = 0;
vi.clearAllMocks();
  },

  // Set mock user for token-based auth
  setMockUser: (token: string, userData: any) => {
mockData.users.set(token, userData);
  },

  // Set active session
  setMockSession: (sessionData: any) => {
mockData.sessions.set('active', { ...sessionData, active: true });
  },

  // Get profiles for verification
  getProfiles: () => Array.from(mockData.profiles.values()),

  // Get call counts for verification
  getAuthCallCount: (method?: string) => {
if (method) {
  return (
mockClient.auth[
  method as keyof typeof mockClient.auth
] as vi.MockedFunction
  ).mock.calls.length;
}
return Object.values(mockClient.auth).reduce((total, fn) => {
  if (vi.isMockFunction(fn)) {
return total + fn.mock.calls.length;
  }
  return total;
}, 0);
  },
},
  };

  return mockClient;
}

/**
 * Mock client factory for specific scenarios
 */
export function createMockClientForScenario(
  scenario: 'auth-success' | 'auth-error' | 'network-error' | 'profile-error',
) {
  const mockClient = createMockSupabaseClient();

  switch (scenario) {
case 'auth-success':
  // Pre-configure successful authentication
  mockClient.__testHelpers.setMockUser('valid-token', {
id: 'auth-user-123',
email: 'authenticated@example.com',
created_at: '2025-08-12T10:00:00Z',
  });
  mockClient.__testHelpers.setMockSession({
access_token: 'valid-token',
user: {
  id: 'auth-user-123',
  email: 'authenticated@example.com',
},
  });
  break;

case 'auth-error':
  // Configure for authentication failures
  mockClient.auth.getUser.mockResolvedValue({
data: { user: null },
error: { message: 'Invalid JWT token' },
  });
  mockClient.auth.signInWithPassword.mockResolvedValue({
data: { user: null, session: null },
error: { message: 'Invalid login credentials' },
  });
  break;

case 'network-error':
  // Configure for network failures
  const networkError = new Error('Network connection failed');
  mockClient.auth.getUser.mockRejectedValue(networkError);
  mockClient.auth.signInWithPassword.mockRejectedValue(networkError);
  mockClient.from.mockImplementation(() => {
throw networkError;
  });
  break;

case 'profile-error':
  // Configure for profile-related database errors
  mockClient.from.mockImplementation((table: string) => {
const queryBuilder = createMockQueryBuilder();
if (table === 'profiles') {
  queryBuilder.single.mockResolvedValue({
data: null,
error: { message: 'Profile not found', code: 'PGRST116' },
  });
  queryBuilder.upsert.mockResolvedValue({
data: null,
error: { message: 'Profile upsert failed' },
  });
}
return queryBuilder;
  });
  break;
  }

  return mockClient;
}

/**
 * Type-safe mock client interface for TypeScript
 */
export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;

/**
 * Environment setup helper for database package tests
 */
export function setupTestEnvironment() {
  // Store original env vars
  const originalEnv = { ...process.env };

  // Set test environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

  return {
cleanup: () => {
  // Restore original environment
  process.env = originalEnv;
  vi.restoreAllMocks();
},
  };
}
