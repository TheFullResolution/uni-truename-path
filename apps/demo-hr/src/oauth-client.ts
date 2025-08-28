/**
 * OAuth Client Instance for Demo HR Application
 * Singleton pattern for consistent OAuth operations
 */

import { TrueNameOAuthClient, OAuthConfig } from '@uni-final/truename-oauth';
import { APP_CONFIG, TRUENAME_API, isDevelopment } from './config';

// Build OAuth configuration based on environment
const createOAuthConfig = (): OAuthConfig => {
  const apiBaseUrl = isDevelopment
? TRUENAME_API.BASE_URL.DEV
: TRUENAME_API.BASE_URL.PROD;

  const domain = isDevelopment ? APP_CONFIG.DOMAIN.DEV : APP_CONFIG.DOMAIN.PROD;

  const callbackUrl = `${isDevelopment ? 'http://' : 'https://'}${domain}${APP_CONFIG.OAUTH.CALLBACK_PATH}`;

  return {
appName: APP_CONFIG.APP_NAME,
apiBaseUrl,
callbackUrl,
  };
};

// Create singleton OAuth client instance
export const oauthClient = new TrueNameOAuthClient(createOAuthConfig());

// Export configuration for debugging/testing
export const oauthConfig = createOAuthConfig();
