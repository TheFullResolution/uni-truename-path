import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
  {
ignores: [
  // Test artifacts
  'test-results/**',
  'playwright-report/**',
  'coverage/**',
  // Dependencies
  'node_modules/**',
],
  },
  {
files: ['**/*.ts'],
rules: {
  // Playwright/test specific rules
  'no-console': 'off', // Allow console in tests
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': 'error',
},
  },
  {
// Relaxed rules for test files
files: ['**/*.spec.ts', '**/*.test.ts', '**/tests/**/*.ts'],
rules: {
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
},
  },
];
