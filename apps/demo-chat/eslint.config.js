import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
  {
ignores: ['dist/**', 'build/**', 'node_modules/**'],
  },
  {
files: ['**/*.{ts,tsx}'],
rules: {},
  },
];
