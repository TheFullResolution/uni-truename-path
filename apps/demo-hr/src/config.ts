/**
 * Demo HR App Configuration Constants
 * Ensures consistent naming and port assignments across the application
 */

// App Identity Configuration
export const APP_CONFIG = {
  // OAuth App Name (must match API expectations)
  APP_NAME: 'demo-hr' as const,

  // Port Assignment (fixed to avoid collisions)
  DEV_PORT: 4000 as const,

  // Domain Configuration
  DOMAIN: {
DEV: 'localhost:4000' as const,
PROD: 'demo-hr-truename.vercel.app' as const,
  },

  // OAuth Configuration
  OAUTH: {
CALLBACK_PATH: '/callback' as const,
SCOPE: 'openid profile' as const,
  },
} as const;

// TrueNamePath API Configuration
export const TRUENAME_API = {
  BASE_URL: {
DEV: 'http://localhost:3000' as const,
PROD: 'https://truename.path' as const,
  },
  ENDPOINTS: {
OAUTH_APPS: '/api/oauth/apps' as const,
OAUTH_AUTHORIZE: '/auth/oauth-authorize' as const,
OAUTH_RESOLVE: '/api/oauth/resolve' as const,
  },
} as const;

// Port Allocation Documentation (for reference)
export const PORT_ALLOCATION = {
  TRUENAME_MAIN: 3000,
  DEMO_HR: 4000, // This app - separated from main app port range
  DEMO_CHAT: 4001, // Reserved for chat demo
} as const;

// Environment Helper
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
