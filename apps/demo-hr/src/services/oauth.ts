/**
 * Centralized OAuth Configuration and Client Service
 *
 * Single source of truth for all OAuth-related configuration and client instances
 * in the Demo HR application. This ensures consistent configuration across all
 * components and prevents multiple client instantiations.
 *
 * Usage:
 * - For OAuth flows: import { oauthClient }
 * - For SWR hooks: import { oauthConfig }
 */

import { TrueNameOAuthClient } from '@uni-final/truename-oauth';
import { getEnvironmentConfig } from '@/config/environment';

// Get environment configuration once at module load
const envConfig = getEnvironmentConfig();

/**
 * Singleton OAuth client instance
 *
 * Created once when module is imported, reused across all components.
 * This prevents multiple client instantiations and ensures consistent
 * configuration throughout the application lifecycle.
 */
export const oauthClient = new TrueNameOAuthClient({
  appName: envConfig.appName,
  apiBaseUrl: envConfig.apiBaseUrl,
  callbackUrl: envConfig.callbackUrl,
});

/**
 * Standardized OAuth configuration for SWR hooks
 *
 * Used by useOAuthToken and other OAuth-related hooks that need
 * configuration parameters. Ensures all hooks use identical settings.
 */
export const oauthConfig = {
  apiBaseUrl: envConfig.apiBaseUrl,
  isDevelopment: envConfig.isDevelopment,
} as const;

/**
 * Environment configuration re-export for convenience
 *
 * Allows components to access environment variables through the OAuth service
 * if needed, maintaining the single source of truth principle.
 */
export { getEnvironmentConfig } from '@/config/environment';
