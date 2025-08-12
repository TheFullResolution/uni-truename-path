// Vitest setup for TrueNamePath Database Package
// Date: August 12, 2025
// Sets up global mocks and test environment

import { vi } from 'vitest';

// Mock console methods to avoid noise in tests (but allow warnings for important database issues)
const originalError = console.error;
const originalWarn = console.warn;

// Mock console.error to suppress noisy error logs but still capture them for assertion
vi.spyOn(console, 'error').mockImplementation((...args) => {
  // Store the error for tests that want to verify error logging
  (console.error as any).__lastError = args;
});

// Keep warnings visible but track them
vi.spyOn(console, 'warn').mockImplementation((...args) => {
  (console.warn as any).__lastWarn = args;
  // Uncomment for debugging: originalWarn(...args);
});

// Mock environment variables for consistent testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock window object for browser client tests
Object.defineProperty(global, 'window', {
  value: {
location: {
  origin: 'http://localhost:3000',
},
  },
  writable: true,
});

// Setup global test helpers
global.testHelpers = {
  resetConsole: () => {
vi.clearAllMocks();
(console.error as any).__lastError = undefined;
(console.warn as any).__lastWarn = undefined;
  },
  getLastError: () => (console.error as any).__lastError,
  getLastWarn: () => (console.warn as any).__lastWarn,
};

// Note: afterEach cleanup is handled in individual test files
// This setup file only configures global environment
