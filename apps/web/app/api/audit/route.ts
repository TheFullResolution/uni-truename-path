import { NextRequest } from 'next/server';
import type { AuditLogResponseData, AuditLogEntry } from './types';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type AuthenticatedHandler,
} from '@/utils/api';

/**
 * GET /api/audit - Retrieve audit log for current authenticated user
 *
 * This base route provides access to the current user's audit log without
 * requiring an explicit profile ID. It uses the authenticated user's ID
 * from the auth context.
 */
const handleGetAuditLog: AuthenticatedHandler<AuditLogResponseData> = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  // Use authenticated user's ID directly from context
  if (!user) {
return createErrorResponse(
  ErrorCodes.AUTHENTICATION_REQUIRED,
  'User authentication required',
  requestId,
  undefined,
  timestamp,
);
  }
  const userId = user.id;

  // Parse query parameters
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const validatedLimit = Math.min(Math.max(limit, 1), 1000); // Clamp between 1-1000

  // Call existing RPC function
  const { data, error } = await supabase.rpc('get_user_audit_log', {
p_user_id: userId,
p_limit: validatedLimit,
  });

  if (error) {
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to retrieve audit log',
  requestId,
  process.env.NODE_ENV === 'development' ? error.message : undefined,
  timestamp,
);
  }

  // Format response data
  const responseData: AuditLogResponseData = {
entries: (data || []) as AuditLogEntry[],
total: data?.length || 0,
profile_id: userId,
filters: { limit: validatedLimit },
metadata: {
  retrieved_at: timestamp,
  request_id: requestId,
  total_entries: data?.length || 0,
  filtered_entries: data?.length || 0,
},
  };

  return createSuccessResponse(responseData, requestId, timestamp);
};

export const GET = withRequiredAuth(handleGetAuditLog);
