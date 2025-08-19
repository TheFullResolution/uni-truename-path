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

// Default mock for Next.js headers() function
export const mockHeaders = vi.fn(() => mockMissingAuthHeaders);

// Reset function for test cleanup
export function resetHeadersMocks() {
  mockHeaders.mockClear();
  mockAuthenticatedHeaders.get.mockClear();
  mockAuthenticatedHeaders.has.mockClear();
  mockAuthenticatedHeaders.set.mockClear();
  mockAuthenticatedHeaders.delete.mockClear();
  mockAuthenticatedHeaders.forEach.mockClear();

  mockUnauthenticatedHeaders.get.mockClear();
  mockUnauthenticatedHeaders.has.mockClear();
  mockUnauthenticatedHeaders.set.mockClear();
  mockUnauthenticatedHeaders.delete.mockClear();
  mockUnauthenticatedHeaders.forEach.mockClear();

  mockMissingAuthHeaders.get.mockClear();
  mockMissingAuthHeaders.has.mockClear();
  mockMissingAuthHeaders.set.mockClear();
  mockMissingAuthHeaders.delete.mockClear();
  mockMissingAuthHeaders.forEach.mockClear();
}
