/**
 * Demo Chat App Environment Configuration
 */

interface AppConfig {
  API_BASE_URL: string;
  APP_URL: string;
  APP_NAME: string;
  DEV_PORT: number;
  DOMAIN: {
DEV: string;
PROD: string;
  };
  OAUTH: {
CALLBACK_PATH: string;
SCOPE: string;
  };
}

export const APP_CONFIG: AppConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:4500',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'demo-chat',
  DEV_PORT: Number(import.meta.env.VITE_DEV_PORT) || 4500,
  DOMAIN: {
DEV:
  import.meta.env.VITE_APP_URL?.replace('http://', '') || 'localhost:4500',
PROD: 'demo-chat-truename.vercel.app',
  },
  OAUTH: {
CALLBACK_PATH: '/callback',
SCOPE: 'openid profile',
  },
} as const;
