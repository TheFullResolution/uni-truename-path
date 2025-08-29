/// <reference types="vitest" />
// Vitest configuration for TrueNamePath Context Engine testing
// Date: August 11, 2025

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
// Test environment
environment: 'jsdom',

// Global test utilities
globals: true,

// Test file patterns
include: [
  'utils/**/__tests__/**/*.test.ts',
  'utils/**/*.test.ts',
  'utils/**/__tests__/**/*.test.tsx',
  'utils/**/*.test.tsx',
  'app/**/__tests__/**/*.test.ts',
  'app/**/*.test.ts',
  'app/**/__tests__/**/*.test.tsx',
  'app/**/*.test.tsx',
  'components/**/__tests__/**/*.test.ts',
  'components/**/*.test.ts',
  'components/**/__tests__/**/*.test.tsx',
  'components/**/*.test.tsx',
],
exclude: [
  'utils/**/__tests__/**/*.e2e.test.ts', // E2E tests handled by Playwright
  'utils/**/*.e2e.test.ts',
  'app/**/__tests__/**/*.e2e.test.ts',
  'app/**/*.e2e.test.ts',
  'components/**/__tests__/**/*.e2e.test.ts',
  'components/**/*.e2e.test.ts',
],

// Global test setup
setupFiles: ['./vitest.setup.ts'],

// Global timeout for database operations
testTimeout: 30000,

// Reporter configuration
reporters: ['verbose', 'json', 'html'],

// Output directories
outputFile: {
  html: './vitest-ui/index.html',
  json: './vitest-ui/results.json',
},

// Coverage configuration
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'html'],
  include: [
'utils/**/*.ts',
'app/**/*.ts',
'components/**/*.ts',
'components/**/*.tsx',
  ],
  exclude: [
'utils/**/*.d.ts',
'utils/**/__tests__/**',
'utils/**/__mocks__/**',
'utils/**/demo.ts',
'utils/**/types.ts',
'app/**/*.d.ts',
'app/**/__tests__/**',
'app/**/__mocks__/**',
'app/**/types.ts',
'components/**/*.d.ts',
'components/**/__tests__/**',
'components/**/__mocks__/**',
'components/**/types.ts',
  ],
  thresholds: {
global: {
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80,
},
  },
},

// Pool options for better performance
pool: 'threads',
poolOptions: {
  threads: {
singleThread: false,
  },
},
  },

  // Path resolution
  resolve: {
alias: {
  '@uni-final-project/database': path.resolve(
__dirname,
'../../packages/database/src',
  ),
  '@': path.resolve(__dirname, '.'),
},
  },

  // ESBuild configuration for TypeScript and React
  esbuild: {
target: 'node14',
jsx: 'automatic',
  },
});
