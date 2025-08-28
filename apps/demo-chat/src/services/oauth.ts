/**
 * Centralized OAuth Configuration and Client Service
 *
 * Single source of truth for all OAuth-related configuration and client instances
 * in the Demo Chat application. This ensures consistent configuration across all
 * components and prevents multiple client instantiations.
 *
 * Usage:
 * - For OAuth flows: import { oauthClient }
 * - For SWR hooks: import { oauthConfig }
 */

import { TrueNameOAuthClient } from '@uni-final/truename-oauth';
import { APP_CONFIG } from '@/config';

/**
 * Determine environment mode based on API base URL
 *
 * Simple detection: if API URL contains localhost, we're in development.
 * This avoids hardcoding and makes it work with environment variables.
 */
const isDevelopment = APP_CONFIG.API_BASE_URL.includes('localhost');

/**
 * Singleton OAuth client instance
 *
 * Created once when module is imported, reused across all components.
 * This prevents multiple client instantiations and ensures consistent
 * configuration throughout the application lifecycle.
 */
export const oauthClient = new TrueNameOAuthClient({
  appName: APP_CONFIG.APP_NAME,
  apiBaseUrl: APP_CONFIG.API_BASE_URL,
  callbackUrl: `${APP_CONFIG.APP_URL}/callback`,
});

/**
 * Standardized OAuth configuration for SWR hooks
 *
 * Used by useOAuthToken and other OAuth-related hooks that need
 * configuration parameters. Ensures all hooks use identical settings.
 */
export const oauthConfig = {
  apiBaseUrl: APP_CONFIG.API_BASE_URL,
  isDevelopment,
} as const;

/**
 * App configuration re-export for convenience
 *
 * Allows components to access app config through the OAuth service
 * if needed, maintaining the single source of truth principle.
 */
export { APP_CONFIG } from '@/config';
