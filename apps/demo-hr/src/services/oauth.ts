/**
 * Centralized OAuth Configuration and Client Service
 */

import { TrueNameOAuthClient } from '@uni-final/truename-oauth';
import { getEnvironmentConfig } from '@/config/environment';

const envConfig = getEnvironmentConfig();

export const oauthClient = new TrueNameOAuthClient({
  appName: envConfig.appName,
  apiBaseUrl: envConfig.apiBaseUrl,
  callbackUrl: envConfig.callbackUrl,
});

export const oauthConfig = {
  apiBaseUrl: envConfig.apiBaseUrl,
  isDevelopment: envConfig.isDevelopment,
} as const;
export { getEnvironmentConfig } from '@/config/environment';
