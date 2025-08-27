// Mock Next.js headers for testing API authentication HOFs
// Date: August 19, 2025
// Provides mock implementation of Next.js headers() function for unit testing

import { vi } from 'vitest';

export interface MockHeaders {
  get: vi.MockedFunction<(name: string) => string | null>;
  has: vi.MockedFunction<(name: string) => boolean>;
  set: vi.MockedFunction<(name: string, value: string) => void>;
  delete: vi.MockedFunction<(name: string) => void>;
  forEach: vi.MockedFunction<
(callback: (value: string, key: string) => void) => void
  >;
}

export function createMockHeaders(
  initialHeaders: Record<string, string> = {},
): MockHeaders {
  const headerStore = new Map<string, string>(Object.entries(initialHeaders));

  const mockHeaders: MockHeaders = {
get: vi.fn((name: string) => headerStore.get(name.toLowerCase()) || null),
has: vi.fn((name: string) => headerStore.has(name.toLowerCase())),
set: vi.fn((name: string, value: string) => {
  headerStore.set(name.toLowerCase(), value);
}),
delete: vi.fn((name: string) => {
  headerStore.delete(name.toLowerCase());
}),
forEach: vi.fn((callback: (value: string, key: string) => void) => {
  headerStore.forEach((value, key) => callback(value, key));
}),
  };

  return mockHeaders;
}

// Pre-configured mock headers for common test scenarios
export const mockAuthenticatedHeaders = createMockHeaders({
  'x-authentication-verified': 'true',
  'x-authenticated-user-id': 'user-123',
  'x-authenticated-user-email': 'test@example.com',
  'x-authenticated-user-profile': JSON.stringify({
id: 'user-123',
email: 'test@example.com',
full_name: 'Test User',
  }),
});

export const mockUnauthenticatedHeaders = createMockHeaders({
  'x-authentication-verified': 'false',
});

export const mockMissingAuthHeaders = createMockHeaders({});

// OAuth-specific mock headers for security testing
export const mockOAuthHeaders = createMockHeaders({
  'x-authentication-verified': 'true',
  'x-authenticated-user-id': 'user-oauth-456',
  'x-oauth-authenticated': 'true',
  'x-oauth-session-id': 'oauth-session-789',
  'x-oauth-client-id': 'demo-hr-app',
  // Note: Intentionally missing email and profile for OAuth security
});

export const mockOAuthWithSensitiveHeaders = createMockHeaders({
  'x-authentication-verified': 'true',
  'x-authenticated-user-id': 'user-oauth-456',
  'x-authenticated-user-email': 'oauth-user@example.com', // Should be filtered
  'x-oauth-authenticated': 'true',
  'x-oauth-session-id': 'oauth-session-789',
  'x-oauth-client-id': 'demo-hr-app',
  'x-authenticated-user-profile': JSON.stringify({
// Should be filtered
id: 'user-oauth-456',
email: 'oauth-user@example.com',
full_name: 'OAuth Test User',
  }),
});

// Default mock for Next.js headers() function
export const mockHeaders = vi.fn(() => mockMissingAuthHeaders);

// Reset function for test cleanup
export function resetHeadersMocks() {
  mockHeaders.mockClear();

  // Reset all standard headers
  [
mockAuthenticatedHeaders,
mockUnauthenticatedHeaders,
mockMissingAuthHeaders,
mockOAuthHeaders,
mockOAuthWithSensitiveHeaders,
  ].forEach((mockHeader) => {
mockHeader.get.mockClear();
mockHeader.has.mockClear();
mockHeader.set.mockClear();
mockHeader.delete.mockClear();
mockHeader.forEach.mockClear();
  });
}
