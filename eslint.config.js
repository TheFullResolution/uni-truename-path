import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default [
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
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/no-explicit-any': 'warn',
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
rules: {
  '@typescript-eslint/no-require-imports': 'off',
},
  },
];