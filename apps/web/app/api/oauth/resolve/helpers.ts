// TrueNamePath: OAuth Resolve Analytics Helper Functions
// Analytics and performance tracking for POST /api/oauth/resolve endpoint
// Date: August 23, 2025
// Academic project - Maintaining handler ≤50 lines constraint

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/generated/database';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Database client type for helper functions
 * Ensures type safety with generated database schema
 */
type DatabaseClient = SupabaseClient<Database>;

/**
 * Performance measurement result
 * Contains timing data for analytics logging
 */
export interface PerformanceMeasurement {
  /** Start timestamp in milliseconds */
  startTime: number;
  /** Function to calculate elapsed time in milliseconds */
  getElapsed: () => number;
}

/**
 * Session data extracted from successful resolution
 * Used for analytics logging after OIDC claims resolution
 */
export interface ResolveSessionData {
  /** User profile ID */
  profile_id: string;
  /** OAuth client ID */
  client_id: string;
  /** OAuth session ID (session token) */
  session_id: string;
  /** Context ID used for resolution */
  context_id: string;
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

// =============================================================================
// Session Data Extraction Helper
// =============================================================================

/**
 * Extracts session data from OIDC claims for analytics logging
 *
 * @param claimsResult - Raw result from resolve_oauth_oidc_claims function
 * @param sessionToken - Original session token used for resolution
 * @returns ResolveSessionData | null - Session data or null if extraction fails
 */
export function extractSessionDataFromClaims(
  claimsResult: unknown,
  sessionToken: string,
): ResolveSessionData | null {
  try {
// Validate claims structure
if (!claimsResult || typeof claimsResult !== 'object') {
  return null;
}

// Extract required fields from OIDC claims
const claims = claimsResult as {
  sub?: string;
  context_name?: string;
  app_name?: string;
};
const profileId = claims.sub;
const contextName = claims.context_name;
const appName = claims.app_name;

if (!profileId || !contextName || !appName) {
  return null;
}

// Note: We need to make additional queries to get client_id and context_id
// For now, we'll return the available data and handle missing IDs in the logging function
return {
  profile_id: profileId,
  client_id: '', // Will be resolved in logOAuthUsage
  session_id: sessionToken,
  context_id: '', // Will be resolved in logOAuthUsage
};
  } catch (error) {
console.error('Session data extraction failed:', error);
return null;
  }
}

// =============================================================================
// OAuth Usage Logging Helper
// =============================================================================

/**
 * Logs OAuth resolution usage to app_usage_log table
 * Handles both successful and failed resolution attempts
 *
 * @param supabase - Authenticated Supabase client
 * @param sessionData - Session data for successful resolutions (null for failures)
 * @param sessionToken - OAuth session token used
 * @param success - Whether the resolution was successful
 * @param responseTimeMs - Response time in milliseconds
 * @param errorType - Error type for failed resolutions
 * @returns Promise<boolean> - True if logging was successful
 */
export async function logOAuthUsage(
  supabase: DatabaseClient,
  sessionData: ResolveSessionData | null,
  sessionToken: string,
  success: boolean,
  responseTimeMs: number,
  errorType?: string,
): Promise<boolean> {
  try {
if (success && sessionData) {
  // For successful resolutions, we need to resolve client_id and context_id
  // First get session info
  const { data: sessionInfo, error: sessionError } = await supabase
.from('oauth_sessions')
.select('id, profile_id, client_id')
.eq('session_token', sessionToken)
.single();

  if (sessionError || !sessionInfo) {
console.error(
  'Failed to resolve session info for logging:',
  sessionError,
);
return false;
  }

  // Then get context assignment
  const { data: contextAssignment } = await supabase
.from('app_context_assignments')
.select('context_id')
.eq('profile_id', sessionInfo.profile_id)
.eq('client_id', sessionInfo.client_id)
.single();

  const contextId = contextAssignment?.context_id;

  const { error: logError } = await supabase.rpc('log_app_usage', {
p_profile_id: sessionInfo.profile_id,
p_client_id: sessionInfo.client_id,
p_action: 'resolve',
p_context_id: contextId,
p_session_id: sessionInfo.id,
p_response_time_ms: responseTimeMs,
p_success: true,
  });

  if (logError) {
console.error('Failed to log successful OAuth usage:', logError);
return false;
  }
} else {
  // For failed resolutions, we might not have complete session data
  // Try to get what we can from the token
  const { data: sessionInfo } = await supabase
.from('oauth_sessions')
.select('id, profile_id, client_id')
.eq('session_token', sessionToken)
.single();

  if (sessionInfo) {
// Log failed resolution with available data
const { error: logError } = await supabase.rpc('log_app_usage', {
  p_profile_id: sessionInfo.profile_id,
  p_client_id: sessionInfo.client_id,
  p_action: 'resolve',
  p_session_id: sessionInfo.id,
  p_response_time_ms: responseTimeMs,
  p_success: false,
  p_error_type: errorType || 'resolution_failed',
});

if (logError) {
  console.error('Failed to log failed OAuth usage:', logError);
  return false;
}
  }
}

return true;
  } catch (error) {
console.error('OAuth usage logging failed:', error);
return false;
  }
}

// =============================================================================
// Error Type Mapping Helper
// =============================================================================

/**
 * Maps resolution errors to analytics error types
 *
 * @param error - Error object from resolution attempt
 * @returns string - Standardized error type for analytics
 */
export function mapErrorToAnalyticsType(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
const errorResult = error as { error: string };

switch (errorResult.error) {
  case 'invalid_token':
return 'invalid_token';
  case 'no_context_assigned':
return 'context_missing';
  default:
return 'resolution_failed';
}
  }

  return 'server_error';
}
