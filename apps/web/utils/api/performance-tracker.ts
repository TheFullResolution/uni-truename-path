/**
 * Performance Tracking Utilities for OAuth Operations
 *
 * This module provides correlation ID-based performance measurement
 * that works with trigger-based logging. Each operation gets a unique
 * request ID that can be used to match client-side timing with
 * database log entries.
 *
 * Database triggers log operations with NULL response_time_ms initially,
 * and client-side performance updates fill in actual measurements
 * asynchronously using the correlation ID.
 */

import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Performance measurement for a single request
 */
export interface PerformanceMeasurement {
  /** Unique identifier for this request */
  requestId: string;
  /** When the measurement started */
  startTime: number;
  /** Get elapsed time in milliseconds */
  getElapsed: () => number;
}

/**
 * Result of updating performance measurement
 */
export interface PerformanceUpdateResult {
  /** Whether the update was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Number of log entries updated (should be 1 for success) */
  updateCount?: number;
}

/**
 * Configuration for performance tracking
 */
export interface PerformanceTrackingConfig {
  /** Custom Supabase client (optional, will create server client if not provided) */
  supabase?: SupabaseClient<Database>;
  /** Whether to log performance updates to console (default: false) */
  enableLogging?: boolean;
}

// =============================================================================
// Core Performance Measurement Functions
// =============================================================================

/**
 * Starts a new performance measurement with correlation ID
 *
 * @returns PerformanceMeasurement object with requestId and timing functions
 *
 * @example
 * ```typescript
 * const perf = startPerformanceMeasurement();
 * // ... do OAuth operation, pass perf.requestId to database calls
 * const elapsed = perf.getElapsed();
 * await updatePerformanceMeasurement(perf.requestId, elapsed);
 * ```
 */
export function startPerformanceMeasurement(): PerformanceMeasurement {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  return {
requestId,
startTime,
getElapsed: () => Math.round(performance.now() - startTime),
  };
}

/**
 * Updates the performance measurement for a specific request ID
 *
 * Updates database log entries that have NULL response_time_ms with
 * the actual measured response time. Uses correlation ID matching.
 *
 * @param requestId - The correlation ID from startPerformanceMeasurement()
 * @param responseTimeMs - The measured response time in milliseconds
 * @param config - Optional configuration for Supabase client and logging
 * @returns Promise<PerformanceUpdateResult> indicating success/failure
 *
 * @example
 * ```typescript
 * const result = await updatePerformanceMeasurement('abc-123', 45);
 * if (!result.success) {
 *   console.error('Failed to update performance:', result.error);
 * }
 * ```
 */
export async function updatePerformanceMeasurement(
  requestId: string,
  responseTimeMs: number,
  config: PerformanceTrackingConfig = {},
): Promise<PerformanceUpdateResult> {
  try {
// Validate input parameters
if (!requestId || requestId.trim() === '') {
  return {
success: false,
error: 'Request ID is required and cannot be empty',
  };
}

if (responseTimeMs < 0) {
  return {
success: false,
error: `Invalid response time: ${responseTimeMs}ms (must be >= 0)`,
  };
}

// Get or create Supabase client
const supabase = config.supabase || (await createClient());

// Call the database function to update performance
const { data: updateSuccess, error: dbError } = await supabase.rpc(
  'update_log_performance',
  {
p_request_id: requestId,
p_response_time_ms: responseTimeMs,
  },
);

if (dbError) {
  const errorMsg = `Database error updating performance for ${requestId}: ${dbError.message}`;
  if (config.enableLogging) {
console.error('Performance Tracker:', errorMsg);
  }
  return {
success: false,
error: errorMsg,
  };
}

if (updateSuccess) {
  if (config.enableLogging) {
console.log(
  `Performance Tracker: Updated ${requestId} with ${responseTimeMs}ms`,
);
  }
  return {
success: true,
updateCount: 1,
  };
} else {
  const errorMsg = `No log entry found for request ID: ${requestId}`;
  if (config.enableLogging) {
console.warn('Performance Tracker:', errorMsg);
  }
  return {
success: false,
error: errorMsg,
updateCount: 0,
  };
}
  } catch (error) {
const errorMsg = error instanceof Error ? error.message : 'Unknown error';
if (config.enableLogging) {
  console.error('Performance Tracker: Unexpected error:', error);
}
return {
  success: false,
  error: `Unexpected error updating performance: ${errorMsg}`,
};
  }
}

/**
 * Convenience function that measures performance and updates the log
 *
 * @param measurement - The PerformanceMeasurement object from startPerformanceMeasurement()
 * @param config - Optional configuration for Supabase client and logging
 * @returns Promise<PerformanceUpdateResult> indicating success/failure
 *
 * @example
 * ```typescript
 * const perf = startPerformanceMeasurement();
 * // ... do OAuth operation
 * const result = await finishPerformanceMeasurement(perf);
 * ```
 */
export async function finishPerformanceMeasurement(
  measurement: PerformanceMeasurement,
  config: PerformanceTrackingConfig = {},
): Promise<PerformanceUpdateResult> {
  const elapsed = measurement.getElapsed();
  return updatePerformanceMeasurement(measurement.requestId, elapsed, config);
}

// =============================================================================
// Fire-and-Forget Performance Updates
// =============================================================================

/**
 * Updates performance measurement without waiting for the result
 *
 * This is useful for OAuth endpoints where you don't want to slow down
 * the response by waiting for the performance update to complete.
 *
 * @param requestId - The correlation ID from startPerformanceMeasurement()
 * @param responseTimeMs - The measured response time in milliseconds
 * @param config - Optional configuration for Supabase client and logging
 *
 * @example
 * ```typescript
 * // Fire-and-forget: don't wait for performance update
 * updatePerformanceMeasurementAsync(perf.requestId, perf.getElapsed());
 *
 * // Return response immediately without waiting
 * return createSuccessResponse(data);
 * ```
 */
export function updatePerformanceMeasurementAsync(
  requestId: string,
  responseTimeMs: number,
  config: PerformanceTrackingConfig = {},
): void {
  // Fire-and-forget: update performance in background
  updatePerformanceMeasurement(requestId, responseTimeMs, config)
.then((result) => {
  if (!result.success && config.enableLogging) {
console.warn('Performance Tracker (async):', result.error);
  }
})
.catch((error) => {
  if (config.enableLogging) {
console.error('Performance Tracker (async): Unexpected error:', error);
  }
});
}

/**
 * Convenience function for fire-and-forget performance measurement completion
 *
 * @param measurement - The PerformanceMeasurement object from startPerformanceMeasurement()
 * @param config - Optional configuration for Supabase client and logging
 *
 * @example
 * ```typescript
 * const perf = startPerformanceMeasurement();
 * // ... do OAuth operation
 * finishPerformanceMeasurementAsync(perf); // Don't wait
 * return createSuccessResponse(data);
 * ```
 */
export function finishPerformanceMeasurementAsync(
  measurement: PerformanceMeasurement,
  config: PerformanceTrackingConfig = {},
): void {
  const elapsed = measurement.getElapsed();
  updatePerformanceMeasurementAsync(measurement.requestId, elapsed, config);
}

// =============================================================================
// Helper Functions for Database Operations
// =============================================================================

/**
 * Creates metadata object for storing request ID in oauth_sessions
 *
 * @param requestId - The correlation ID for this request
 * @param additionalMetadata - Optional additional metadata to include
 * @returns JSON metadata object for database storage
 *
 * @example
 * ```typescript
 * const perf = startPerformanceMeasurement();
 * const metadata = createSessionMetadata(perf.requestId, { source: 'api' });
 * // Pass metadata to session creation function
 * ```
 */
export function createSessionMetadata(
  requestId: string,
  additionalMetadata: Record<string, string | number | boolean | null> = {},
): { [key: string]: string | number | boolean | null } {
  return {
request_id: requestId,
created_at: new Date().toISOString(),
...additionalMetadata,
  };
}

/**
 * Formats request ID for storage in resource_id field
 *
 * @param requestId - The correlation ID for this request
 * @returns Formatted string for resource_id field (format: "request:{uuid}")
 *
 * @example
 * ```typescript
 * const perf = startPerformanceMeasurement();
 * const resourceId = formatRequestIdForStorage(perf.requestId);
 * // Store in resource_id field: "request:abc-123-def-456"
 * ```
 */
export function formatRequestIdForStorage(requestId: string): string {
  return `request:${requestId}`;
}

// =============================================================================
// Performance Constants and Targets
// =============================================================================

/**
 * Performance targets for OAuth operations (in milliseconds)
 */
export const PERFORMANCE_TARGETS = {
  /** Target for OAuth authorization (authorize endpoint) */
  AUTHORIZE_MS: 100,

  /** Target for OAuth resolution (resolve endpoint) */
  RESOLVE_MS: 50,

  /** Target for OAuth revocation (revoke/delete endpoints) */
  REVOKE_MS: 30,

  /** Target for context assignment operations */
  CONTEXT_ASSIGNMENT_MS: 25,

  /** Maximum acceptable response time for any operation */
  MAX_ACCEPTABLE_MS: 500,
} as const;

/**
 * Checks if response time meets performance targets
 *
 * @param action - The OAuth action type
 * @param responseTimeMs - The measured response time
 * @returns Whether the response time meets the target
 *
 * @example
 * ```typescript
 * const perf = startPerformanceMeasurement();
 * // ... do operation
 * const elapsed = perf.getElapsed();
 * const meetsTarget = isPerformanceTargetMet('authorize', elapsed);
 * ```
 */
export function isPerformanceTargetMet(
  action: 'authorize' | 'resolve' | 'revoke' | 'assign_context',
  responseTimeMs: number,
): boolean {
  const targets = {
authorize: PERFORMANCE_TARGETS.AUTHORIZE_MS,
resolve: PERFORMANCE_TARGETS.RESOLVE_MS,
revoke: PERFORMANCE_TARGETS.REVOKE_MS,
assign_context: PERFORMANCE_TARGETS.CONTEXT_ASSIGNMENT_MS,
  };

  return responseTimeMs <= targets[action];
}
