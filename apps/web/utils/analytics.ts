/**
 * Context Usage Analytics Utility
 *
 * This module provides utilities for tracking context usage analytics
 * for the TrueNamePath context-aware identity management system.
 *
 * Academic Project: University Final Project (CM3035 Advanced Web Design)
 * Innovation: Analytics tracking for context-aware name resolution usage patterns
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { OIDCScope, OIDCResolveResponse } from '@/types/oidc';

// =============================================================================
// Types for Analytics Functions
// =============================================================================

/**
 * Configuration for context usage tracking
 */
export interface TrackContextUsageConfig {
  /** Supabase client for database operations */
  supabase: SupabaseClient<Database>;

  /** Target user whose context was accessed */
  targetUserId: string;

  /** Context ID that was used (if available) */
  contextId?: string;

  /** Requesting application identifier */
  requestingApplication: string;

  /** Type of application making the request */
  applicationType?: 'oauth_client' | 'oidc_client' | 'api_integration';

  /** OAuth/OIDC scopes requested */
  scopesRequested: OIDCScope[];

  /** Actual properties disclosed to the application */
  propertiesDisclosed: Record<string, unknown>;

  /** API response time in milliseconds */
  responseTimeMs: number;

  /** Whether the request was successful */
  success?: boolean;

  /** Error type if request failed */
  errorType?: string;

  /** Additional request metadata */
  metadata?: {
sourceIp?: string;
userAgent?: string;
sessionId?: string;
requestId?: string;
  };
}

/**
 * Result from tracking context usage
 */
export interface TrackContextUsageResult {
  /** Success status */
  success: boolean;

  /** Analytics record ID if successful */
  analyticsId?: number;

  /** Error message if failed */
  error?: string;
}

// =============================================================================
// Core Analytics Functions
// =============================================================================

/**
 * Tracks context usage analytics by calling the database log_context_usage function
 *
 * This function logs external OAuth/OIDC application usage of user contexts
 * for analytics, performance monitoring, and GDPR compliance tracking.
 *
 * @param config Configuration object with all required analytics data
 * @returns Promise resolving to tracking result
 */
export async function trackContextUsage(
  config: TrackContextUsageConfig,
): Promise<TrackContextUsageResult> {
  try {
const {
  supabase,
  targetUserId,
  contextId,
  requestingApplication,
  applicationType = 'oidc_client',
  scopesRequested,
  propertiesDisclosed,
  responseTimeMs,
  success = true,
  errorType,
  metadata = {},
} = config;

// Validate required parameters
if (!targetUserId) {
  throw new Error('Target user ID is required for analytics tracking');
}

if (!requestingApplication) {
  throw new Error('Requesting application identifier is required');
}

// Call the database function to log context usage
const { data: analyticsId, error: dbError } = await supabase.rpc(
  'log_context_usage',
  {
p_target_user_id: targetUserId,
p_context_id: contextId || '',
p_requesting_application: requestingApplication,
p_application_type: applicationType,
p_scopes_requested: scopesRequested,
p_properties_disclosed: Object.keys(propertiesDisclosed),
p_response_time_ms: responseTimeMs,
p_success: success,
p_error_type: errorType,
p_source_ip: metadata.sourceIp,
p_user_agent: metadata.userAgent,
p_session_id: metadata.sessionId,
p_details: {
  request_id: metadata.requestId || null,
  timestamp: new Date().toISOString(),
  ...metadata,
},
  },
);

if (dbError) {
  console.error('Failed to log context usage analytics:', dbError);
  return {
success: false,
error: `Database error: ${dbError.message}`,
  };
}

return {
  success: true,
  analyticsId: analyticsId,
};
  } catch (error) {
console.error('Error tracking context usage:', error);
return {
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error',
};
  }
}

/**
 * Extracts properties disclosed from OIDC response claims
 *
 * This helper function converts an OIDC response into the format
 * expected by the analytics tracking system.
 *
 * @param claims OIDC response claims
 * @param scopesRequested Original scopes that were requested
 * @returns Properties disclosed object for analytics
 */
export function extractPropertiesDisclosed(
  claims: OIDCResolveResponse,
  scopesRequested: OIDCScope[],
): Record<string, unknown> {
  const disclosed: Record<string, unknown> = {};

  // Always include sub (subject identifier)
  if (claims.sub) {
disclosed.sub = claims.sub;
  }

  // Include profile scope properties if requested
  if (scopesRequested.includes('profile')) {
const profileProps = [
  'name',
  'given_name',
  'family_name',
  'middle_name',
  'nickname',
  'preferred_username',
  'profile',
  'picture',
  'website',
  'gender',
  'birthdate',
  'zoneinfo',
  'locale',
  'updated_at',
] as const;

profileProps.forEach((prop) => {
  if (claims[prop] !== undefined) {
disclosed[prop] = claims[prop];
  }
});
  }

  // Include email scope properties if requested
  if (scopesRequested.includes('email')) {
if (claims.email !== undefined) {
  disclosed.email = claims.email;
}
if (claims.email_verified !== undefined) {
  disclosed.email_verified = claims.email_verified;
}
  }

  // Include address scope properties if requested
  if (scopesRequested.includes('address') && claims.address !== undefined) {
disclosed.address = claims.address;
  }

  // Include phone scope properties if requested
  if (scopesRequested.includes('phone')) {
if (claims.phone_number !== undefined) {
  disclosed.phone_number = claims.phone_number;
}
if (claims.phone_number_verified !== undefined) {
  disclosed.phone_number_verified = claims.phone_number_verified;
}
  }

  // Include TrueNamePath-specific metadata (not part of standard OIDC)
  if (claims.resolution_source) {
disclosed.resolution_source = claims.resolution_source;
  }
  if (claims.context_name) {
disclosed.context_name = claims.context_name;
  }

  return disclosed;
}

/**
 * Helper function to determine context ID from context name
 *
 * This function looks up a user's context ID by name for analytics tracking.
 *
 * @param supabase Supabase client
 * @param userId User ID who owns the context
 * @param contextName Name of the context to look up
 * @returns Promise resolving to context ID or null if not found
 */
export async function getContextIdByName(
  supabase: SupabaseClient<Database>,
  userId: string,
  contextName?: string,
): Promise<string | null> {
  if (!contextName) {
return null;
  }

  try {
const { data: context, error } = await supabase
  .from('user_contexts')
  .select('id')
  .eq('user_id', userId)
  .eq('name', contextName)
  .single();

if (error || !context) {
  console.warn(`Context not found: ${contextName} for user ${userId}`);
  return null;
}

return context.id;
  } catch (error) {
console.error('Error looking up context ID:', error);
return null;
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Simplified function to track successful OIDC resolution
 *
 * @param config Tracking configuration
 * @param claims OIDC response claims
 * @param responseTimeMs Response time in milliseconds
 * @returns Promise resolving to tracking result
 */
export async function trackOIDCResolution(
  supabase: SupabaseClient<Database>,
  targetUserId: string,
  contextName: string | undefined,
  requestingApplication: string,
  scopesRequested: OIDCScope[],
  claims: OIDCResolveResponse,
  responseTimeMs: number,
  metadata?: TrackContextUsageConfig['metadata'],
): Promise<TrackContextUsageResult> {
  // Get context ID if context name is provided
  const contextId = await getContextIdByName(
supabase,
targetUserId,
contextName,
  );

  // Extract properties that were actually disclosed
  const propertiesDisclosed = extractPropertiesDisclosed(
claims,
scopesRequested,
  );

  return trackContextUsage({
supabase,
targetUserId,
contextId: contextId || undefined,
requestingApplication,
applicationType: 'oidc_client',
scopesRequested,
propertiesDisclosed,
responseTimeMs,
success: true,
metadata,
  });
}

/**
 * Track failed OIDC resolution attempt
 *
 * @param config Basic tracking configuration
 * @param errorType Type of error that occurred
 * @param responseTimeMs Response time in milliseconds
 * @returns Promise resolving to tracking result
 */
export async function trackOIDCResolutionFailure(
  supabase: SupabaseClient<Database>,
  targetUserId: string,
  contextName: string | undefined,
  requestingApplication: string,
  scopesRequested: OIDCScope[],
  errorType: string,
  responseTimeMs: number,
  metadata?: TrackContextUsageConfig['metadata'],
): Promise<TrackContextUsageResult> {
  // Get context ID if context name is provided
  const contextId = await getContextIdByName(
supabase,
targetUserId,
contextName,
  );

  return trackContextUsage({
supabase,
targetUserId,
contextId: contextId || undefined,
requestingApplication,
applicationType: 'oidc_client',
scopesRequested,
propertiesDisclosed: {}, // No properties disclosed on failure
responseTimeMs,
success: false,
errorType,
metadata,
  });
}
