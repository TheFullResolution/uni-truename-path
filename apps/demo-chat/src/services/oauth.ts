/**
 * Centralized OAuth Configuration and Client Service
 */

import { TrueNameOAuthClient } from '@uni-final/truename-oauth';
import { APP_CONFIG } from '@/config';

const isDevelopment = APP_CONFIG.API_BASE_URL.includes('localhost');

export const oauthClient = new TrueNameOAuthClient({
  appName: APP_CONFIG.APP_NAME,
  apiBaseUrl: APP_CONFIG.API_BASE_URL,
  callbackUrl: `${APP_CONFIG.APP_URL}/callback`,
});

export const oauthConfig = {
  apiBaseUrl: APP_CONFIG.API_BASE_URL,
  isDevelopment,
} as const;

export { APP_CONFIG } from '@/config';
