import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
files: ['**/*.ts', '**/*.tsx'],
languageOptions: {
  parser: tsParser,
  parserOptions: {
ecmaVersion: 2022,
sourceType: 'module',
jsx: true,
  },
  globals: {
...globals.browser,
...globals.es2022,
  },
},
plugins: {
  '@typescript-eslint': tsPlugin,
},
rules: {
  ...tsPlugin.configs.recommended.rules,
  '@typescript-eslint/no-unused-vars': [
'error',
{ argsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
  'no-console': 'warn',
},
  },
];
