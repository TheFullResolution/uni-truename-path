/**
 * SWR Focus-Based Configuration for Real-Time Updates
 *
 * This configuration module provides focus-based update patterns for Step 16.6.7
 * implementation. It enables real-time updates without aggressive polling,
 * focusing on window focus events as the primary update trigger.
 *
 * Academic Purpose: Demonstrates efficient real-time data patterns in OAuth
 * applications where user engagement (focus) indicates data freshness requirements.
 */

import type { SWRConfiguration } from 'swr';

/**
 * SWR configuration optimized for focus-based real-time updates
 *
 * Key Features:
 * - Updates on window focus (primary mechanism)
 * - Fresh data on component mount
 * - Network reconnection updates
 * - No polling intervals (performance)
 * - Request deduplication (prevents spam)
 *
 * Use Cases:
 * - Dashboard ConnectedAppsPanel
 * - Demo HR application
 * - Demo Chat application
 */
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

  // Academic constraints: no complex retry logic
  shouldRetryOnError: false,
  errorRetryCount: 0,
};

/**
 * Creates focus-based SWR configuration with custom deduplication
 *
 * @param dedupingMs - Custom deduplication interval in milliseconds
 * @returns SWR configuration object
 */
export function createFocusConfig(dedupingMs = 2000): SWRConfiguration {
  return {
...swrFocusConfig,
dedupingInterval: dedupingMs,
  };
}

/**
 * Focus configuration for high-frequency updates (chat, notifications)
 * Reduced deduplication for more responsive updates
 */
export const swrHighFrequencyFocusConfig: SWRConfiguration = {
  ...swrFocusConfig,
  dedupingInterval: 500, // More responsive for chat-like apps
};

/**
 * Focus configuration for low-frequency updates (settings, profiles)
 * Increased deduplication for less critical updates
 */
export const swrLowFrequencyFocusConfig: SWRConfiguration = {
  ...swrFocusConfig,
  dedupingInterval: 5000, // Less aggressive for static data
};
