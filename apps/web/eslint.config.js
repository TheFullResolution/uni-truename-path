import nextPlugin from '@next/eslint-plugin-next';
import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
  {
ignores: [
  // Test and build artifacts
  'coverage/**',
  'vitest-ui/**',
  'html/**',
  // Generated files
  '**/*.generated.*',
  // Dependencies
  'node_modules/**',
],
  },
  {
files: ['**/*.{ts,tsx}'],
plugins: {
  '@next/next': nextPlugin,
},
rules: {
  ...nextPlugin.configs.recommended.rules,
  '@typescript-eslint/no-explicit-any': 'warn',
},
  },
  {
// Relaxed rules for test files and mocks
files: [
  '**/__tests__/**/*',
  '**/*.test.{ts,tsx}',
  '**/__mocks__/**/*',
  '**/vitest.setup.ts',
],
rules: {
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-namespace': 'off',
},
  },
];
