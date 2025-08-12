/// <reference types="vitest" />
// Vitest configuration for TrueNamePath Context Engine testing
// Date: August 11, 2025

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
// Test environment
environment: 'jsdom',

// Test file patterns
include: ['lib/**/__tests__/**/*.test.ts', 'lib/**/*.test.ts'],
exclude: [
  'lib/**/__tests__/**/*.e2e.test.ts', // E2E tests handled by Playwright
  'lib/**/*.e2e.test.ts',
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
  include: ['lib/**/*.ts'],
  exclude: [
'lib/**/*.d.ts',
'lib/**/__tests__/**',
'lib/**/__mocks__/**',
'lib/**/demo.ts',
'lib/**/types.ts',
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

  // ESBuild configuration for TypeScript
  esbuild: {
target: 'node14',
  },
});
