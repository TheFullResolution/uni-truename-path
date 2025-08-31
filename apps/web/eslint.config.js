import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import baseConfig from '../../eslint.config.js';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

const nextLintConfig = [
  {
ignores: [
  'node_modules/**',
  '.next/**',
  'out/**',
  'build/**',
  'next-env.d.ts',
  'vitest-ui/**',
],
  },
  ...baseConfig,
  {}, // Use FlatCompat to integrate Next.js ESLint config
  ...compat.config({
extends: ['next/core-web-vitals'],
settings: {
  next: {
rootDir: '.',
  },
},
  }),
  {
// Client component import protection
files: [
  'components/**/*.{ts,tsx}',
  'app/**/components/**/*.{ts,tsx}',
  'utils/context/**/*.{ts,tsx}',
],
ignores: [
  'components/server/**', // Convention for server-only components
  'components/home/**', // Home components are server components
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

export default nextLintConfig;
