// SWR Focus-Based Configuration for Real-Time Updates

import type { SWRConfiguration } from 'swr';

// SWR configuration optimized for focus-based real-time updates
export const swrFocusConfig: SWRConfiguration = {
  // Primary update mechanism - when user focuses window
  revalidateOnFocus: true,

  // Fresh data when components mount (good UX)
  revalidateOnMount: true,

  // Update after network recovery (connectivity handling)
  revalidateOnReconnect: true,

  // NO polling intervals (focus-based only)
  refreshInterval: 0,

  // Prevent request spam with 2-second deduplication
  dedupingInterval: 2000,

  // No complex retry logic
  shouldRetryOnError: false,
  errorRetryCount: 0,
};

// Creates focus-based SWR configuration with custom deduplication
export function createFocusConfig(dedupingMs = 2000): SWRConfiguration {
  return {
...swrFocusConfig,
dedupingInterval: dedupingMs,
  };
}

// Focus configuration for high-frequency updates (chat, notifications)
export const swrHighFrequencyFocusConfig: SWRConfiguration = {
  ...swrFocusConfig,
  dedupingInterval: 500, // More responsive for chat-like apps
};

// Focus configuration for low-frequency updates (settings, profiles)
export const swrLowFrequencyFocusConfig: SWRConfiguration = {
  ...swrFocusConfig,
  dedupingInterval: 5000, // Less aggressive for static data
};
