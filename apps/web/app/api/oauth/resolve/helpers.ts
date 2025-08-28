// TrueNamePath: OAuth Resolve Helper Functions
// Performance tracking and data extraction for POST /api/oauth/resolve endpoint
// Date: August 27, 2025
// Academic project - Maintaining handler ≤50 lines constraint
// Note: Database triggers now handle all OAuth usage logging automatically

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Performance measurement result
 * Contains timing data for performance monitoring
 */
export interface PerformanceMeasurement {
  /** Start timestamp in milliseconds */
  startTime: number;
  /** Function to calculate elapsed time in milliseconds */
  getElapsed: () => number;
}

// =============================================================================
// Performance Measurement Helper
// =============================================================================

/**
 * Creates performance measurement tracker
 *
 * @returns PerformanceMeasurement - Object with timing utilities
 */
export function measurePerformance(): PerformanceMeasurement {
  const startTime = performance.now();

  return {
startTime,
getElapsed: () => Math.round(performance.now() - startTime),
  };
}
