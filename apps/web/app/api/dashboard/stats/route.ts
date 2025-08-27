// TrueNamePath: Dashboard Statistics API Route
// GET /api/dashboard/stats - Retrieve comprehensive dashboard statistics for authenticated user
// Date: August 18, 2025 - Optimized with single RPC call
// Academic project REST API with JSend compliance and optimized performance

import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
  get_user_profile_data,
} from '@/utils/api';
import { ErrorCodes } from '@/utils/api';
import type { DashboardStatsResponse } from './types';

/**
 * Authenticated handler for dashboard statistics retrieval
 * Uses single RPC call for optimal performance
 */
const getDashboardStats: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// Validate user authentication and get profile data
const user_validation = get_user_profile_data(user, requestId, timestamp);
if ('error' in user_validation) {
  return user_validation.error;
}

// Check if user_profile exists in validation result
if (!('user_profile' in user_validation)) {
  console.error(`[${requestId}] User profile data missing from validation`);
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User profile data not available',
requestId,
undefined,
timestamp,
  );
}

const { user_profile } = user_validation;
console.log(
  `[${requestId}] Retrieving OAuth dashboard stats for profile ${user!.id}`,
);

// Call the OAuth dashboard stats RPC function
const { data: oauth_stats, error } = await supabase.rpc(
  'get_oauth_dashboard_stats',
  { p_profile_id: user!.id },
);

// Type assertion for the JSON response from the RPC function
const stats = oauth_stats as {
  connected_apps: number;
  recent_authorizations: number;
  total_usage: number;
  avg_response_time_ms: number | null;
  success_rate_percent: number | null;
  top_app_name: string | null;
  recent_activity: Array<{
app_name: string;
action: string;
created_at: string;
success: boolean;
  }>;
} | null;

if (error) {
  console.error(`[${requestId}] OAuth dashboard stats RPC error:`, {
message: error.message,
details: error.details,
hint: error.hint,
code: error.code,
  });
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
`Failed to retrieve OAuth dashboard statistics: ${error.message}`,
requestId,
undefined,
timestamp,
  );
}

if (!stats) {
  console.error(
`[${requestId}] No data returned from OAuth dashboard stats RPC`,
  );
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'No OAuth dashboard data available',
requestId,
undefined,
timestamp,
  );
}

// Construct OAuth-focused dashboard response
const dashboard_stats: DashboardStatsResponse = {
  user_profile,
  oauth_metrics: {
connected_apps: stats.connected_apps || 0,
recent_authorizations: stats.recent_authorizations || 0,
total_usage: stats.total_usage || 0,
avg_response_time_ms: stats.avg_response_time_ms || null,
success_rate_percent: stats.success_rate_percent || null,
top_app_name: stats.top_app_name || null,
recent_activity: stats.recent_activity || [],
  },
};

console.log(
  `[${requestId}] OAuth dashboard stats response prepared successfully`,
);
return createSuccessResponse(dashboard_stats, requestId, timestamp);
  } catch (error) {
console.error(`[${requestId}] OAuth dashboard stats error:`, {
  error_message: error instanceof Error ? error.message : 'Unknown error',
  error_stack: error instanceof Error ? error.stack : undefined,
  error_full: error,
});
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  `Failed to retrieve OAuth dashboard statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
  requestId,
  undefined,
  timestamp,
);
  }
};

/**
 * GET /api/dashboard/stats
 * Retrieve comprehensive dashboard statistics for the authenticated user
 *
 * Authentication: Required (cookie-based session management)
 * Rate limiting: Standard API rate limits apply
 *
 * Response format: JSend compliant
 * - success: true/false
 * - data: DashboardStats object
 * - message: Error message if applicable
 * - requestId: Unique request identifier
 * - timestamp: Response timestamp
 */
export const GET = withRequiredAuth(getDashboardStats);
