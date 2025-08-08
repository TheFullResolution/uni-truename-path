import type { Linter } from 'eslint';

export const baseConfig: Linter.Config[] = [
  {
files: ['**/*.{js,jsx,ts,tsx}'],
languageOptions: {
  ecmaVersion: 'latest',
  sourceType: 'module',
  parserOptions: {
ecmaFeatures: {
  jsx: true,
},
  },
},
rules: {
  'no-unused-vars': 'warn',
  'no-console': 'warn',
  'prefer-const': 'error',
},
  },
];

export const reactConfig: Linter.Config[] = [
  ...baseConfig,
  {
files: ['**/*.{jsx,tsx}'],
rules: {
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
},
  },
];

export const nextConfig: Linter.Config[] = [
  ...reactConfig,
  {
files: ['**/*.{js,jsx,ts,tsx}'],
rules: {
  '@next/next/no-html-link-for-pages': 'error',
},
  },
];
