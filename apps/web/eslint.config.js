import nextPlugin from '@next/eslint-plugin-next';
import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
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
];