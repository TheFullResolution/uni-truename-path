/// <reference types="vitest" />
// Vitest configuration for TrueNamePath OAuth Client Library
// Date: August 27, 2025

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
// Test environment - Node for utility library
environment: 'node',

// Test file patterns
include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
exclude: ['dist/**/*', 'node_modules/**/*'],

// Global test setup
setupFiles: ['./vitest.setup.ts'],

// Timeout for tests
testTimeout: 10000,

// Reporter configuration
reporters: ['verbose', 'json'],

// Output directories
outputFile: {
  json: './test-results.json',
},

// Coverage configuration
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'html'],
  include: ['src/**/*.ts'],
  exclude: [
'src/**/*.d.ts',
'src/**/__tests__/**',
'src/**/__mocks__/**',
'src/**/types.ts',
'src/index.ts', // Just exports, no logic
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

  // ESBuild configuration for TypeScript
  esbuild: {
target: 'node14',
  },
});
