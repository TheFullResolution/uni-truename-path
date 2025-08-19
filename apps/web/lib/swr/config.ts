import type { SWRConfiguration } from 'swr';

/**
 * Enhanced SWR configuration with performance optimizations
 * Implements better error handling, caching, and retry logic
 */
export const swrConfig: SWRConfiguration = {
  // Error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 2000, // 2 second base retry interval

  // Performance optimizations
  revalidateOnFocus: true, // Revalidate when window regains focus
  revalidateOnReconnect: true, // Revalidate when network reconnects
  dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds

  // Cache and persistence
  revalidateIfStale: true, // Revalidate stale data
  refreshInterval: 0, // No automatic refresh (manual only)

  // Error handling configuration
  shouldRetryOnError: (error: Error & { status?: number }) => {
// Don't retry on 4xx client errors (except 401 auth errors)
if (
  error.status &&
  error.status >= 400 &&
  error.status < 500 &&
  error.status !== 401
) {
  return false;
}

// Retry on 5xx server errors and network errors
return true;
  },

  // Loading indicator delay to prevent flashing
  loadingTimeout: 3000,
};

/**
 * Configuration for critical data that needs faster retries
 * Used for authentication-related requests
 */
export const criticalSWRConfig: SWRConfiguration = {
  ...swrConfig,
  errorRetryCount: 5, // More retries for critical data
  errorRetryInterval: 1000, // Faster retry interval
  dedupingInterval: 1000, // More aggressive deduping for critical data
};

/**
 * Configuration for background data that can tolerate slower updates
 * Used for analytics, audit logs, and non-critical information
 */
export const backgroundSWRConfig: SWRConfiguration = {
  ...swrConfig,
  errorRetryCount: 2, // Fewer retries for background data
  errorRetryInterval: 5000, // Slower retry interval
  revalidateOnFocus: false, // Don't revalidate on focus for background data
  dedupingInterval: 5000, // Less aggressive deduping
};

/**
 * Get the appropriate SWR config based on data priority
 */
export function getSWRConfig(
  priority: 'critical' | 'normal' | 'background' = 'normal',
): SWRConfiguration {
  switch (priority) {
case 'critical':
  return criticalSWRConfig;
case 'background':
  return backgroundSWRConfig;
default:
  return swrConfig;
  }
}

/**
 * Custom error retry function with exponential backoff and jitter
 * Can be used with individual SWR hooks that need advanced retry logic
 */
export function createRetryFunction(
  baseDelay: number = 1000,
  maxDelay: number = 30000,
) {
  return (
error: Error & { status?: number },
key: string,
config: SWRConfiguration,
revalidate: () => void,
{ retryCount }: { retryCount: number },
  ) => {
// Don't retry on certain status codes
if (error.status === 404) return;
if (error.status === 403) return;
if (error.status === 401) return; // Let auth system handle this

// Stop retrying after configured max attempts
if (retryCount >= (config.errorRetryCount || 3)) return;

// Calculate delay with exponential backoff and jitter
const exponentialDelay = Math.min(
  baseDelay * Math.pow(2, retryCount),
  maxDelay,
);

const jitter = Math.random() * 1000; // 0-1 second jitter
const delay = exponentialDelay + jitter;

setTimeout(() => revalidate(), delay);
  };
}
