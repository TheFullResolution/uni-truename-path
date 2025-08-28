import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
ignores: [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/.turbo/**',
  '**/coverage/**',
  '**/.vercel/**',
  '**/out/**',
  // Auto-generated files
  '**/next-env.d.ts',
  '**/generated/**',
],
  },
  js.configs.recommended,
  {
files: ['**/*.{ts,tsx}'],
languageOptions: {
  parser: tsParser,
  parserOptions: {
ecmaVersion: 'latest',
sourceType: 'module',
ecmaFeatures: {
  jsx: true,
},
  },
  globals: {
...globals.browser,
...globals.node,
...globals.es2021,
  },
},
plugins: {
  '@typescript-eslint': typescript,
  'react': react,
  'react-hooks': reactHooks,
},
rules: {
  ...typescript.configs.recommended.rules,
  ...react.configs.recommended.rules,
  ...reactHooks.configs.recommended.rules,
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  // Allow triple-slash references in auto-generated files
  '@typescript-eslint/triple-slash-reference': 'off',
  // Ban explicit any types
  '@typescript-eslint/no-explicit-any': 'error',
},
settings: {
  react: {
version: 'detect',
  },
},
  },
  {
files: ['packages/**/*.{ts,tsx}'],
rules: {
  // Disable Next.js specific rules for packages
  '@next/next/no-html-link-for-pages': 'off',
},
  },
  {
files: ['**/*.js'],
languageOptions: {
  globals: {
...globals.node,
...globals.es2021,
  },
},
rules: {
  '@typescript-eslint/no-require-imports': 'off',
},
  },
  {
// Relaxed rules for test files and mocks globally
files: [
  '**/__tests__/**/*',
  '**/*.test.{ts,tsx}',
  '**/__mocks__/**/*',
  '**/vitest.setup.ts',
  'packages/e2e-tests/**/*',
],
rules: {
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
},
  },
];
