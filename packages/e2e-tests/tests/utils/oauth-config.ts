/**
 * OAuth E2E Test Configuration
 * Centralized configuration for OAuth testing
 */

export const OAUTH_TEST_CONFIG = {
  DEMO_APPS: ['demo-hr', 'demo-chat'] as const,
  CALLBACK_URLS: {
HR: 'http://localhost:3001/callback',
CHAT: 'http://localhost:3002/callback',
  },
  PERFORMANCE_LIMITS: {
E2E_FLOW_MS: 5000,
API_CALL_MS: 3000,
FULL_FLOW_MS: 10000,
  },
  TOKEN_VALIDATION: {
FORMAT_REGEX: /^tnp_[a-f0-9]{32}$/,
PREFIX: 'tnp_',
HEX_LENGTH: 32,
TOTAL_LENGTH: 36,
MIN_ENTROPY: 4.0,
  },
} as const;
