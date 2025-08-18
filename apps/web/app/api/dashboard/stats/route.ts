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
} from '@/utils/api';
import { ErrorCodes } from '@/utils/api';

/**
 * Authenticated handler for dashboard statistics retrieval
 * Uses single RPC call for optimal performance
 */
const getDashboardStats: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
if (!user?.profile?.id) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User profile not found',
requestId,
undefined,
timestamp,
  );
}

const profileId = user.profile.id;

// Call the RPC function to get all dashboard statistics in a single query
const { data: dashboardData, error } = await supabase.rpc(
  'get_dashboard_stats',
  { p_profile_id: profileId },
);

if (error) {
  console.error('Dashboard stats RPC error:', error);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve dashboard statistics',
requestId,
undefined,
timestamp,
  );
}

if (!dashboardData) {
  console.error('No data returned from dashboard stats RPC');
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'No dashboard data available',
requestId,
undefined,
timestamp,
  );
}

// Calculate member since date (use user creation or profile creation)
const memberSince = user.created_at || new Date().toISOString();

// Construct response with user profile data and RPC results
// The RPC function returns Json, so we need to parse it as the expected structure
const rpcData = dashboardData as Record<string, unknown>;
const dashboardStats = {
  user_profile: {
email: user.email || '',
profile_id: profileId,
member_since: memberSince,
  },
  ...rpcData,
};

return createSuccessResponse(dashboardStats, requestId, timestamp);
  } catch (error) {
console.error('Dashboard stats error:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to retrieve dashboard statistics',
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
