// OAuth E2E Test Configuration

export const OAUTH_TEST_CONFIG = {
  DEMO_APPS: ['demo-hr', 'demo-chat'] as const,
  CALLBACK_URLS: {
HR: 'http://localhost:3001/callback',
CHAT: 'http://localhost:3002/callback',
DEMO_HR: 'http://localhost:4000/callback',
DEMO_CHAT: 'http://localhost:4500/callback',
  },
  DEMO_HR: {
PORT: 4000,
BASE_URL: 'http://localhost:4000',
APP_NAME: 'demo-hr',
SERVER_STARTUP_TIMEOUT: 30000,
HEALTH_CHECK_TIMEOUT: 2000,
  },
  DEMO_CHAT: {
PORT: 4500,
BASE_URL: 'http://localhost:4500',
APP_NAME: 'demo-chat',
SERVER_STARTUP_TIMEOUT: 30000,
HEALTH_CHECK_TIMEOUT: 2000,
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
