// TrueNamePath OAuth Client Library - Test Setup
// Date: August 27, 2025
// Global test configuration and mocks

import { vi } from 'vitest';

// Mock crypto.randomUUID for consistent testing
const mockUUID = vi.fn(() => 'mocked-uuid-12345');

// Create crypto mock if it doesn't exist
Object.defineProperty(global, 'crypto', {
  value: {
randomUUID: mockUUID,
  },
  writable: true,
});

// Mock localStorage for storage tests using proper Vitest approach
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
getItem: vi.fn((key: string) => store[key] ?? null), // Use ?? to properly handle undefined
setItem: vi.fn((key: string, value: string) => {
  store[key] = value;
}),
removeItem: vi.fn((key: string) => {
  delete store[key];
}),
clear: vi.fn(() => {
  store = {};
}),
key: vi.fn((index: number) => null),
get length() {
  return Object.keys(store).length;
},
// Expose store for test access
__getStore: () => store,
__setStore: (newStore: Record<string, string>) => {
  store = newStore;
},
  };
})();

// Use vi.stubGlobal for proper global mocking
vi.stubGlobal('localStorage', localStorageMock);

// Mock fetch for API tests
const mockFetch = vi.fn();
Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true,
});

// Mock window.location for URL building tests
Object.defineProperty(global, 'window', {
  value: {
location: {
  origin: 'https://demo-hr.example.com',
},
  },
  writable: true,
});

// Export mocks for use in tests
export { mockUUID, localStorageMock, mockFetch };
