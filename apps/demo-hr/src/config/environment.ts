/**
 * Environment Configuration for Demo HR App
 */

export interface EnvironmentConfig {
  apiBaseUrl: string;
  appUrl: string;
  appName: string;
  callbackUrl: string;
  isDevelopment: boolean;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const apiBaseUrl =
import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:4000';
  const appName = import.meta.env.VITE_APP_NAME || 'demo-hr';
  const callbackUrl = `${appUrl}/callback`;
  const isDevelopment = import.meta.env.DEV || apiBaseUrl.includes('localhost');

  return {
apiBaseUrl,
appUrl,
appName,
callbackUrl,
isDevelopment,
  };
}

export function createOAuthConfig() {
  const config = getEnvironmentConfig();

  return {
appName: config.appName,
apiBaseUrl: config.apiBaseUrl,
callbackUrl: config.callbackUrl,
  };
}

export const ENV_CONFIG = getEnvironmentConfig();
