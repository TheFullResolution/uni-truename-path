// TrueNamePath: Audit Log API Route
// GET /api/audit/[profileId] - User audit log endpoint
// Date: August 12, 2025
// Academic project REST API with authentication and validation

// TrueNamePath: Audit Log API Route - JSend Compliant
import { NextRequest } from 'next/server';
import type { AuditLogResponseData } from '../types';
import type { AuthenticatedContext, StandardResponse } from '@/utils/api';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
} from '@/utils/api';
import { z } from 'zod';

/**
 * Query parameter validation schema for audit log requests
 */
const AuditQuerySchema = z.object({
  limit: z
.string()
.regex(/^\d+$/, 'Limit must be a valid number')
.transform(Number)
.refine(
  (num) => num >= 1 && num <= 1000,
  'Limit must be between 1 and 1000',
)
.optional()
.default(50),

  action: z
.enum(['NAME_DISCLOSED', 'CONSENT_GRANTED', 'CONSENT_REVOKED'] as const)
.optional(),

  date_from: z
.string()
.datetime('Start date must be a valid ISO date')
.optional(),

  date_to: z.string().datetime('End date must be a valid ISO date').optional(),
});

/**
 * Core handler function implementing the audit log retrieval logic
 * This is wrapped by the required authentication HOF
 */
async function handleGetAuditLogRequest(
  request: NextRequest,
  context: AuthenticatedContext,
): Promise<StandardResponse<AuditLogResponseData>> {
  try {
const { user, supabase, requestId } = context;

// Get profileId from URL parameters
const url = new URL(request.url);
const profileId = url.pathname.split('/').pop();

if (!profileId) {
  return createErrorResponse(
'INVALID_PROFILE_ID',
'Profile ID is required',
requestId,
  );
}

// 1. Authorization check
if (!user || user.id !== profileId) {
  console.log(`[${requestId}] Unauthorized access attempt`, {
user_id: user?.id,
requested_profile_id: profileId,
  });
  return createErrorResponse(
'UNAUTHORIZED',
'Cannot access audit log for different user',
requestId,
  );
}

// 2. Parse and validate filters from query string
const { searchParams } = new URL(request.url);
const queryParams = Object.fromEntries(searchParams.entries());
const filtersResult = AuditQuerySchema.safeParse(queryParams);

if (!filtersResult.success) {
  console.log(`[${requestId}] Invalid filters`, {
errors: filtersResult.error.issues,
  });
  return createErrorResponse(
'INVALID_FILTERS',
'Invalid filters: ' +
  filtersResult.error.issues
.map((e: { message: string }) => e.message)
.join(', '),
requestId,
  );
}

const filters = filtersResult.data;

console.log(`[${requestId}] Processing audit log request`, {
  profile_id: profileId,
  filters,
});

// 3. Fetch audit logs using RPC function
// Note: The RPC function has limited filtering capabilities
// We apply additional filters client-side for now
const { data, error } = await supabase.rpc('get_user_audit_log', {
  p_user_id: profileId,
  p_limit: filters.limit || 50,
});

if (error) {
  console.error(`[${requestId}] Database error fetching audit log`, {
error: error.message,
code: error.code,
details: error.details,
  });
  return createErrorResponse(
'DATABASE_ERROR',
'Failed to fetch audit log: ' + error.message,
requestId,
  );
}

console.log(
  `[${requestId}] Retrieved ${data?.length || 0} audit entries from database`,
);

// 4. Transform data to ensure type safety with generated types
// The RPC function returns snake_case fields that match our generated types
const normalizedData = data || [];

// 5. Apply client-side filters (since database function has limited filtering)
// Note: This could be enhanced to use database-side filtering for better performance
let filteredEntries = normalizedData;

// Filter by action type
if (filters.action) {
  filteredEntries = filteredEntries.filter((entry) => {
return entry.action === filters.action;
  });
}

// Filter by date range using snake_case fields
if (filters.date_from) {
  const dateFrom = new Date(filters.date_from);
  filteredEntries = filteredEntries.filter((entry) => {
return new Date(entry.accessed_at) >= dateFrom;
  });
}

if (filters.date_to) {
  const dateTo = new Date(filters.date_to);
  filteredEntries = filteredEntries.filter((entry) => {
return new Date(entry.accessed_at) <= dateTo;
  });
}

// 6. Success response with comprehensive metadata
const responseData: AuditLogResponseData = {
  entries: filteredEntries,
  total: filteredEntries.length,
  profile_id: profileId,
  filters: {
limit: filters.limit,
action: filters.action,
// Always use snake_case in responses
date_from: filters.date_from,
date_to: filters.date_to,
  },
  metadata: {
retrieved_at: new Date().toISOString(),
request_id: requestId,
total_entries: data?.length || 0,
filtered_entries: filteredEntries.length,
  },
};

console.log(`[${requestId}] Audit log request successful`, {
  total_entries: responseData.total,
  filtered_entries: responseData.metadata.filtered_entries,
});

return createSuccessResponse(responseData, requestId);
  } catch (error) {
const { requestId } = context;
console.error(`[${requestId}] Unexpected error in audit log request`, {
  error: error instanceof Error ? error.message : String(error),
});
return createErrorResponse(
  'INTERNAL_SERVER_ERROR',
  'Internal server error',
  requestId,
);
  }
}

/**
 * GET /api/audit/[profileId]
 *
 * Retrieves audit log entries for a specific user profile with comprehensive filtering options.
 *
 * Features:
 * - Cookie-based session authentication via HOF wrapper
 * - Comprehensive query parameter validation with Zod
 * - Direct RPC call to get_user_audit_log() function
 * - GDPR-compliant audit trail access
 * - Detailed error handling with proper HTTP status codes
 * - Academic-quality response metadata
 * - JSend format compliance
 * - Client-side filtering (could be enhanced for database-side filtering)
 */
export const GET = withRequiredAuth(handleGetAuditLogRequest, {
  enableLogging: true,
});

/**
 * Handle unsupported HTTP methods using shared utility
 */
export const POST = () => handle_method_not_allowed(['GET']);
export const PUT = () => handle_method_not_allowed(['GET']);
export const DELETE = () => handle_method_not_allowed(['GET']);
export const PATCH = () => handle_method_not_allowed(['GET']);

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
status: 200,
headers: {
  'Allow': 'GET, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
},
  });
}
