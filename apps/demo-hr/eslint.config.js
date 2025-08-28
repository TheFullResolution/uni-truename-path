import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
  {
ignores: [
  // Vite build artifacts
  'dist/**',
  'build/**',
  // Dependencies
  'node_modules/**',
],
  },
  {
files: ['**/*.{ts,tsx}'],
rules: {
  // Vite/React app specific rules
},
  },
];
