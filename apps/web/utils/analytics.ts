/**
 * Analytics Utility - Non-OAuth Operations Only
 *
 * This module provides utilities for tracking non-OAuth application events
 * that are not handled by database triggers.
 *
 * Academic Project: University Final Project (CM3035 Advanced Web Design)
 *
 * =============================================================================
 * ANALYTICS SYSTEM - TRIGGER-FIRST APPROACH
 * =============================================================================
 *
 * IMPORTANT: OAuth events are now automatically logged via database triggers:
 * - OAuth authorization: oauth_session_creation_logging_trigger
 * - OAuth resolution: oauth_usage_logging_trigger (existing)
 * - OAuth revocation: oauth_session_deletion_logging_trigger
 * - Context assignments: app_context_assignment_logging_trigger
 *
 * This utility is now focused on non-OAuth system events that require
 * manual logging (e.g., password changes, account settings, etc.)
 *
 * KEY FEATURES:
 * - Manual logging for non-OAuth system operations
 * - Performance monitoring integration
 * - Clean integration with app_usage_log table
 * - Reduced client-side complexity
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/generated/database';

// =============================================================================
// Types for OAuth Analytics
// =============================================================================

/**
 * OAuth action types for tracking
 */
export type OAuthAction = 'authorize' | 'resolve' | 'revoke' | 'assign_context';

/**
 * OAuth error types for tracking
 */
export type OAuthErrorType =
  | 'authorization_denied'
  | 'invalid_token'
  | 'context_missing'
  | 'server_error'
  | 'rate_limited';

/**
 * Configuration for OAuth app usage tracking
 */
export interface TrackOAuthUsageConfig {
  /** Supabase client for database operations */
  supabase: SupabaseClient<Database>;

  /** Profile ID of user performing the OAuth operation */
  profileId: string;

  /** OAuth client ID */
  clientId: string;

  /** Type of OAuth operation */
  action: OAuthAction;

  /** Context ID used for operation (optional) */
  contextId?: string;

  /** OAuth session ID (optional) */
  sessionId?: string;

  /** API response time in milliseconds */
  responseTimeMs?: number;

  /** Whether the operation was successful */
  success?: boolean;

  /** Error type if operation failed */
  errorType?: OAuthErrorType;
}

/**
 * Result from tracking OAuth usage
 */
export interface TrackOAuthUsageResult {
  /** Success status */
  success: boolean;

  /** Usage log ID if successful */
  logId?: number;

  /** Error message if failed */
  error?: string;
}

// =============================================================================
// OAuth Analytics Functions
// =============================================================================

/**
 * Tracks OAuth app usage by calling the simplified log_app_usage function
 *
 * This function logs OAuth application operations for demo analytics,
 * performance monitoring, and dashboard integration.
 *
 * @param config Configuration object with OAuth operation data
 * @returns Promise resolving to tracking result
 */
export async function trackOAuthUsage(
  config: TrackOAuthUsageConfig,
): Promise<TrackOAuthUsageResult> {
  try {
const {
  supabase,
  profileId,
  clientId,
  action,
  contextId,
  sessionId,
  responseTimeMs = 0,
  success = true,
  errorType,
} = config;

// Validate required parameters
if (!profileId) {
  throw new Error('Profile ID is required for OAuth analytics tracking');
}

if (!clientId) {
  throw new Error('Client ID is required for OAuth analytics tracking');
}

if (!action) {
  throw new Error('Action is required for OAuth analytics tracking');
}

// Call the simplified database function to log OAuth usage
const { data: logId, error: dbError } = await supabase.rpc(
  'log_app_usage',
  {
p_profile_id: profileId,
p_client_id: clientId,
p_action: action,
p_context_id: contextId,
p_session_id: sessionId,
p_response_time_ms: responseTimeMs,
p_success: success,
p_error_type: errorType,
  },
);

if (dbError) {
  console.error('Failed to log OAuth usage analytics:', dbError);
  return {
success: false,
error: `Database error: ${dbError.message}`,
  };
}

return {
  success: true,
  logId: logId,
};
  } catch (error) {
console.error('Error tracking OAuth usage:', error);
return {
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error',
};
  }
}

/**
 * @deprecated OAuth authorization events are now automatically logged via database triggers.
 * This function is kept for backward compatibility but should not be used.
 */
export async function trackOAuthAuthorization(
  supabase: SupabaseClient<Database>,
  profileId: string,
  clientId: string,
  contextId: string,
  sessionId: string,
  responseTimeMs: number = 0,
): Promise<TrackOAuthUsageResult> {
  console.warn(
'trackOAuthAuthorization is deprecated. OAuth authorization events are now automatically logged via database triggers.',
  );
  return { success: true, logId: 0 };
}

/**
 * @deprecated OAuth resolve events are now automatically logged via database triggers.
 * This function is kept for backward compatibility but should not be used.
 */
export async function trackOAuthResolve(
  supabase: SupabaseClient<Database>,
  profileId: string,
  clientId: string,
  contextId: string,
  sessionId: string,
  responseTimeMs: number = 0,
): Promise<TrackOAuthUsageResult> {
  console.warn(
'trackOAuthResolve is deprecated. OAuth resolve events are now automatically logged via database triggers.',
  );
  return { success: true, logId: 0 };
}

/**
 * @deprecated OAuth revocation events are now automatically logged via database triggers.
 * This function is kept for backward compatibility but should not be used.
 */
export async function trackOAuthRevocation(
  supabase: SupabaseClient<Database>,
  profileId: string,
  clientId: string,
): Promise<TrackOAuthUsageResult> {
  console.warn(
'trackOAuthRevocation is deprecated. OAuth revocation events are now automatically logged via database triggers.',
  );
  return { success: true, logId: 0 };
}

/**
 * @deprecated Context assignment events are now automatically logged via database triggers.
 * This function is kept for backward compatibility but should not be used.
 */
export async function trackContextAssignment(
  supabase: SupabaseClient<Database>,
  profileId: string,
  clientId: string,
  contextId: string,
): Promise<TrackOAuthUsageResult> {
  console.warn(
'trackContextAssignment is deprecated. Context assignment events are now automatically logged via database triggers.',
  );
  return { success: true, logId: 0 };
}

// =============================================================================
// Analytics Constants
// =============================================================================

/**
 * Performance targets for OAuth operations
 */
export const OAUTH_PERFORMANCE_TARGETS = {
  /** Maximum response time for OAuth operations (3ms) */
  MAX_RESPONSE_TIME_MS: 3,

  /** Target success rate for OAuth operations (99%) */
  TARGET_SUCCESS_RATE: 99,

  /** Maximum acceptable error rate (1%) */
  MAX_ERROR_RATE: 1,
} as const;

/**
 * OAuth action display names for UI
 */
export const OAUTH_ACTION_LABELS: Record<OAuthAction, string> = {
  authorize: 'Authorization',
  resolve: 'Name Resolution',
  revoke: 'Access Revocation',
  assign_context: 'Context Assignment',
} as const;

/**
 * OAuth error type display names for UI
 */
export const OAUTH_ERROR_LABELS: Record<OAuthErrorType, string> = {
  authorization_denied: 'Authorization Denied',
  invalid_token: 'Invalid Token',
  context_missing: 'Context Missing',
  server_error: 'Server Error',
  rate_limited: 'Rate Limited',
} as const;
