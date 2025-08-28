/**
 * Environment Configuration for Demo HR App
 *
 * Centralized environment variable management with type safety
 * and sensible defaults for development and production.
 */

export interface EnvironmentConfig {
  /** Base URL for TrueNamePath API (OAuth server) */
  apiBaseUrl: string;
  /** This app's own URL */
  appUrl: string;
  /** App name for OAuth registration */
  appName: string;
  /** OAuth callback URL */
  callbackUrl: string;
  /** Whether we're in development mode */
  isDevelopment: boolean;
}

/**
 * Get environment configuration with type safety and defaults
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Get environment variables from Vite
  const apiBaseUrl =
import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:4000';
  const appName = import.meta.env.VITE_APP_NAME || 'demo-hr';

  // Derive callback URL from app URL
  const callbackUrl = `${appUrl}/callback`;

  // Determine if we're in development mode
  const isDevelopment = import.meta.env.DEV || apiBaseUrl.includes('localhost');

  return {
apiBaseUrl,
appUrl,
appName,
callbackUrl,
isDevelopment,
  };
}

/**
 * Create OAuth configuration object for API calls
 */
export function createOAuthConfig() {
  const config = getEnvironmentConfig();

  return {
appName: config.appName,
apiBaseUrl: config.apiBaseUrl,
callbackUrl: config.callbackUrl,
  };
}

// Export singleton config instance
export const ENV_CONFIG = getEnvironmentConfig();
