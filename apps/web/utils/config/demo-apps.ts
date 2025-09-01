/**
 * Demo Application URLs Configuration
 *
 * This configuration provides URLs for the deployed demo applications
 * that showcase TrueNamePath's context-aware identity management system.
 */

/** Demo application types */
export type DemoAppType = 'professional' | 'social';

/** Demo application configuration interface */
export interface DemoAppConfig {
  /** Display name for the demo application */
  name: string;
  /** Description of the demo application's purpose */
  description: string;
  /** URL to the deployed demo application */
  url: string;
  /** Type of identity context this demo represents */
  type: DemoAppType;
}

/** Environment variable validation result */
export interface DemoAppValidationResult {
  /** Whether all environment variables are valid */
  isValid: boolean;
  /** Array of missing or invalid environment variables */
  errors: string[];
  /** Array of warnings about configuration */
  warnings: string[];
}

/** Configuration for all demo applications */
export interface DemoAppsConfig {
  /** HR Demo Application - Enterprise professional context */
  HR_URL: string;
  /** Chat Demo Application - Casual social context */
  CHAT_URL: string;
}

export const DEMO_APPS: DemoAppsConfig = {
  /** HR Demo Application - Enterprise professional context */
  HR_URL:
process.env.NEXT_PUBLIC_DEMO_HR_URL ||
'https://demo-hr-truename.vercel.app',

  /** Chat Demo Application - Casual social context */
  CHAT_URL:
process.env.NEXT_PUBLIC_DEMO_CHAT_URL ||
'https://demo-chat-truename.vercel.app',
} as const;

/**
 * Validates a URL string
 * @param url - URL string to validate
 * @param name - Name of the URL for error reporting
 * @returns Validation result with error message if invalid
 */
function validateUrl(
  url: string,
  name: string,
): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
return { isValid: false, error: `${name} is missing or not a string` };
  }

  if (!url.trim()) {
return { isValid: false, error: `${name} is empty` };
  }

  try {
const urlObj = new URL(url);
if (!['http:', 'https:'].includes(urlObj.protocol)) {
  return {
isValid: false,
error: `${name} must use HTTP or HTTPS protocol`,
  };
}
return { isValid: true };
  } catch (error) {
return {
  isValid: false,
  error: `${name} is not a valid URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
};
  }
}

/**
 * Validates that all required demo app environment variables are configured
 * @returns boolean indicating if all demo app URLs are available
 * @deprecated Use validateDemoAppConfigDetailed for better error reporting
 */
export function validateDemoAppConfig(): boolean {
  return Boolean(DEMO_APPS.HR_URL && DEMO_APPS.CHAT_URL);
}

/**
 * Validates demo app configuration with detailed error reporting
 * @returns Detailed validation result with errors and warnings
 */
export function validateDemoAppConfigDetailed(): DemoAppValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate HR URL
  const hrValidation = validateUrl(DEMO_APPS.HR_URL, 'NEXT_PUBLIC_DEMO_HR_URL');
  if (!hrValidation.isValid) {
errors.push(hrValidation.error!);
  } else if (!process.env.NEXT_PUBLIC_DEMO_HR_URL) {
warnings.push('Using default HR demo URL (environment variable not set)');
  }

  // Validate Chat URL
  const chatValidation = validateUrl(
DEMO_APPS.CHAT_URL,
'NEXT_PUBLIC_DEMO_CHAT_URL',
  );
  if (!chatValidation.isValid) {
errors.push(chatValidation.error!);
  } else if (!process.env.NEXT_PUBLIC_DEMO_CHAT_URL) {
warnings.push('Using default Chat demo URL (environment variable not set)');
  }

  return {
isValid: errors.length === 0,
errors,
warnings,
  };
}

/**
 * Validates demo app configuration and throws if invalid
 * Useful for build-time validation
 * @throws Error with detailed validation information if configuration is invalid
 */
export function assertDemoAppConfig(): void {
  const validation = validateDemoAppConfigDetailed();

  if (!validation.isValid) {
const errorMessage = [
  'Demo app configuration validation failed:',
  ...validation.errors.map((error) => `  - ${error}`),
  '',
  'Please check your environment variables in .env.local or use the defaults in .env.example',
].join('\n');

throw new Error(errorMessage);
  }

  // Log warnings in development
  if (
validation.warnings.length > 0 &&
process.env.NODE_ENV === 'development'
  ) {
console.warn('Demo app configuration warnings:');
validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
}

/**
 * Gets all demo app URLs as an array for iteration
 * @returns Array of demo app configuration objects
 * @throws Error if demo app configuration is invalid
 */
export function getDemoApps(): DemoAppConfig[] {
  // Validate configuration before returning
  const validation = validateDemoAppConfigDetailed();
  if (!validation.isValid) {
throw new Error(`Cannot get demo apps: ${validation.errors.join(', ')}`);
  }

  return [
{
  name: 'HR Demo',
  description: 'Enterprise professional identity context',
  url: DEMO_APPS.HR_URL,
  type: 'professional' as const,
},
{
  name: 'Chat Demo',
  description: 'Casual social identity context',
  url: DEMO_APPS.CHAT_URL,
  type: 'social' as const,
},
  ];
}

/**
 * Gets a specific demo app configuration by type
 * @param type - The type of demo app to retrieve
 * @returns Demo app configuration or undefined if not found
 */
export function getDemoAppByType(type: DemoAppType): DemoAppConfig | undefined {
  return getDemoApps().find((app) => app.type === type);
}

/**
 * Gets demo app URL by type with fallback handling
 * @param type - The type of demo app URL to retrieve
 * @returns Demo app URL or throws error if not found
 * @throws Error if demo app type is not found or configuration is invalid
 */
export function getDemoAppUrl(type: DemoAppType): string {
  const app = getDemoAppByType(type);
  if (!app) {
throw new Error(`Demo app type '${type}' not found`);
  }
  return app.url;
}
