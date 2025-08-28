/**
 * OAuth App Usage Analytics Utility
 *
 * This module provides utilities for tracking OAuth application usage analytics
 * for the TrueNamePath OAuth demo integration system.
 *
 * Academic Project: University Final Project (CM3035 Advanced Web Design)
 * Innovation: Simplified OAuth analytics for context-aware identity demonstration
 *
 * =============================================================================
 * OAUTH ANALYTICS SYSTEM - STEP 16 IMPLEMENTATION
 * =============================================================================
 *
 * This file provides OAuth-focused analytics tracking to replace the
 * over-engineered context_usage_analytics system with a simplified approach
 * suitable for academic demonstration purposes.
 *
 * KEY FEATURES:
 * - Simple OAuth operation tracking (authorize, resolve, revoke, assign_context)
 * - Performance monitoring for <3ms requirement
 * - Dashboard integration for real OAuth metrics
 * - Clean integration with app_usage_log table
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
 * Helper function to track OAuth authorization
 */
export async function trackOAuthAuthorization(
  supabase: SupabaseClient<Database>,
  profileId: string,
  clientId: string,
  contextId: string,
  sessionId: string,
  responseTimeMs: number = 0,
): Promise<TrackOAuthUsageResult> {
  return trackOAuthUsage({
supabase,
profileId,
clientId,
action: 'authorize',
contextId,
sessionId,
responseTimeMs,
success: true,
  });
}

/**
 * Helper function to track OIDC claims resolution
 */
export async function trackOAuthResolve(
  supabase: SupabaseClient<Database>,
  profileId: string,
  clientId: string,
  contextId: string,
  sessionId: string,
  responseTimeMs: number = 0,
): Promise<TrackOAuthUsageResult> {
  return trackOAuthUsage({
supabase,
profileId,
clientId,
action: 'resolve',
contextId,
sessionId,
responseTimeMs,
success: true,
  });
}

/**
 * Helper function to track app revocation
 */
export async function trackOAuthRevocation(
  supabase: SupabaseClient<Database>,
  profileId: string,
  clientId: string,
): Promise<TrackOAuthUsageResult> {
  return trackOAuthUsage({
supabase,
profileId,
clientId,
action: 'revoke',
success: true,
  });
}

/**
 * Helper function to track context assignment changes
 */
export async function trackContextAssignment(
  supabase: SupabaseClient<Database>,
  profileId: string,
  clientId: string,
  contextId: string,
): Promise<TrackOAuthUsageResult> {
  return trackOAuthUsage({
supabase,
profileId,
clientId,
action: 'assign_context',
contextId,
success: true,
  });
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
