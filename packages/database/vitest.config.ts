import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
environment: 'node',
globals: true,
include: ['src/**/__tests__/**/*.test.ts'],
exclude: ['src/**/__tests__/**/*.e2e.test.ts'],
setupFiles: [],
coverage: {
  reporter: ['text', 'json', 'html'],
  include: ['src/**'],
  exclude: [
'src/**/__tests__/**',
'src/**/__mocks__/**',
'src/types.ts', // Auto-generated types
  ],
},
// Mock configuration
mockReset: true,
clearMocks: true,
restoreMocks: true,
  },
});
