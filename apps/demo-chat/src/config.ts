/**
 * Demo Chat App Environment Configuration
 * Reads configuration from environment variables for flexible deployment
 */

interface AppConfig {
  // API Configuration
  API_BASE_URL: string;
  APP_URL: string;

  // App Identity Configuration
  APP_NAME: string;
  DEV_PORT: number;

  // Domain Configuration
  DOMAIN: {
DEV: string;
PROD: string;
  };

  // OAuth Configuration
  OAUTH: {
CALLBACK_PATH: string;
SCOPE: string;
  };
}

// Environment-based configuration
export const APP_CONFIG: AppConfig = {
  // API Configuration - CRITICAL: This should point to TrueNamePath API (port 3000)
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:4500',

  // OAuth App Name (must match API expectations)
  APP_NAME: import.meta.env.VITE_APP_NAME || 'demo-chat',

  // Port Assignment (fixed to avoid collisions)
  DEV_PORT: Number(import.meta.env.VITE_DEV_PORT) || 4500,

  // Domain Configuration
  DOMAIN: {
DEV:
  import.meta.env.VITE_APP_URL?.replace('http://', '') || 'localhost:4500',
PROD: 'demo-chat-truename.vercel.app',
  },

  // OAuth Configuration
  OAUTH: {
CALLBACK_PATH: '/callback',
SCOPE: 'openid profile',
  },
} as const;
