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

/**
 * Authenticated handler for dashboard statistics retrieval
 * Uses single RPC call for optimal performance
 */
const getDashboardStats: AuthenticatedHandler = async (
  request: NextRequest,
  { user, requestId, timestamp },
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
  `[${requestId}] Returning mock dashboard stats due to ongoing refactoring`,
);

// TEMPORARY: Return mock data while refactoring is in progress
// TODO: Step 16 - Restore real dashboard stats after OAuth implementation
// The analytics re-architecture in Step 16.1.4 replaced broken context_usage_analytics
// with new app_usage_log system. Dashboard stats integration pending OAuth completion.
// Restore get_dashboard_stats RPC function call after Phase 6 dashboard integration.
const dashboard_stats = {
  user_profile,
  total_names: 3,
  names_by_type_json: {
given_name: 1,
family_name: 1,
display_name: 1,
  },
  has_preferred_name: true,
  custom_contexts: 2,
  unique_applications_total: 0,
  applications_today: 0,
  applications_this_week: 0,
  active_contexts_today: 0,
  active_contexts_week: 0,
  total_context_usages: 0,
  context_usages_today: 0,
  context_usages_week: 0,
  avg_response_time_week: null,
  avg_response_time_today: null,
  success_rate_today: null,
  top_application_today: null,
  top_context_today: null,
  unique_properties_disclosed_week: 0,
  active_consents: 1,
  pending_requests: 0,
  privacy_score: 85,
  gdpr_compliant: true,
  recent_activity: [],
  api_usage: {
today: 0,
this_week: 0,
this_month: 0,
total: 0,
  },
};

/* COMMENTED OUT - Broken due to refactoring
// Call the RPC function to get all dashboard statistics in a single query
const { data: dashboard_data, error } = await supabase.rpc(
  'get_dashboard_stats',
  { p_profile_id: profile_id },
);

if (error) {
  console.error(`[${requestId}] Dashboard stats RPC error:`, {
message: error.message,
details: error.details,
hint: error.hint,
code: error.code,
full_error: error,
  });
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
`Failed to retrieve dashboard statistics: ${error.message}`,
requestId,
undefined,
timestamp,
  );
}

if (!dashboard_data) {
  console.error(`[${requestId}] No data returned from dashboard stats RPC`);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'No dashboard data available',
requestId,
undefined,
timestamp,
  );
}

console.log(
  `[${requestId}] Successfully retrieved dashboard data, processing response`,
);

// Construct response with user profile data and RPC results
// The RPC function returns typed JSON structure from database
const rpc_data = dashboard_data as DashboardStatsRPCResult;
const dashboard_stats = {
  user_profile,
  ...(rpc_data as Record<string, unknown>),
};
*/

console.log(
  `[${requestId}] Dashboard stats response prepared successfully (mock data)`,
);
return createSuccessResponse(dashboard_stats, requestId, timestamp);
  } catch (error) {
console.error(`[${requestId}] Dashboard stats error:`, {
  error_message: error instanceof Error ? error.message : 'Unknown error',
  error_stack: error instanceof Error ? error.stack : undefined,
  error_full: error,
});
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  `Failed to retrieve dashboard statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
