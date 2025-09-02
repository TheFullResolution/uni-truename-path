// Dashboard Statistics API Route

import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
  get_user_profile_data,
  ErrorCodes,
} from '@/utils/api';
import type { DashboardStatsResponse } from './types';

/**
 * Authenticated handler for dashboard statistics retrieval
 */
const getDashboardStats: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
const user_validation = get_user_profile_data(user, requestId, timestamp);
if ('error' in user_validation) {
  return user_validation.error;
}

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

const { data: oauth_stats, error } = await supabase.rpc(
  'get_oauth_dashboard_stats',
  { p_profile_id: user!.id },
);

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

export const GET = withRequiredAuth(getDashboardStats);
