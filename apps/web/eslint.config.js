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
},
  },
  {
// Client component import protection
files: [
  'components/**/*.{ts,tsx}',
  'app/**/components/**/*.{ts,tsx}',
  'utils/context/**/*.{ts,tsx}',
],
ignores: [
  'components/server/**', // Convention for server-only components
],
rules: {
  'no-restricted-imports': [
'error',
{
  patterns: [
{
  group: ['**/auth/server', '**/supabase/server'],
  message:
'Server-only modules cannot be imported in client components. Use the `useAuth()` hook from AuthProvider context or move logic to a Server Component.',
},
{
  group: ['next/headers', 'next/cookies'],
  message:
'Next.js server-only modules cannot be used in client components.',
},
  ],
},
  ],
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
