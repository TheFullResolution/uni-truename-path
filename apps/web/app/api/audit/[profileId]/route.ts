// TrueNamePath: Audit Log API Route
// GET /api/audit/[profileId] - User audit log endpoint
// Date: August 12, 2025
// Academic project REST API with authentication and validation

// TrueNamePath: Audit Log API Route - JSend Compliant
import { NextRequest } from 'next/server';
import type {
  AuditLogEntry,
  AuditFilters,
  AuditLogResponseData,
} from '../types';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  validate_uuid,
  handle_method_not_allowed,
  type AuthenticatedHandler,
} from '@/utils/api';
import { ErrorCodes } from '@/utils/api';
import { z } from 'zod';

/**
 * Query parameter validation schema for audit log requests
 */
const AuditQuerySchema = z
  .object({
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

// Support both naming conventions for backward compatibility
startDate: z
  .string()
  .datetime('Start date must be a valid ISO date')
  .optional(),

date_from: z
  .string()
  .datetime('Start date must be a valid ISO date')
  .optional(),

endDate: z
  .string()
  .datetime('End date must be a valid ISO date')
  .optional(),

date_to: z
  .string()
  .datetime('End date must be a valid ISO date')
  .optional(),
  })
  .transform((data) => ({
...data,
// Normalize to snake_case internally, prioritizing snake_case over camelCase
date_from: data.date_from || data.startDate,
date_to: data.date_to || data.endDate,
// Remove the camelCase versions from the internal object
startDate: undefined,
endDate: undefined,
  }));

/**
 * Core handler function implementing the audit log retrieval logic
 * This is wrapped by the required authentication HOF
 */
const handleGetAuditLogRequest: AuthenticatedHandler<
  AuditLogResponseData
> = async (request: NextRequest, context) => {
  // 1. Extract and validate profileId parameter from URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const profileId = pathSegments[pathSegments.length - 1];

  if (!profileId) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Profile ID is required',
  context.requestId,
  'Profile ID must be provided in the URL path',
  context.timestamp,
);
  }

  // Validate UUID format using shared utility
  if (!validate_uuid(profileId)) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid profile ID format',
  context.requestId,
  'Profile ID must be a valid UUID',
  context.timestamp,
);
  }

  // 2. Authorization - ensure user can only access their own audit log
  if (!context.user || context.user.id !== profileId) {
return createErrorResponse(
  ErrorCodes.AUTHORIZATION_FAILED,
  'Access denied',
  context.requestId,
  'You can only access your own audit log',
  context.timestamp,
);
  }

  // 3. Query parameter parsing and validation
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const queryValidation = AuditQuerySchema.safeParse(queryParams);

  if (!queryValidation.success) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid query parameters',
  context.requestId,
  queryValidation.error.issues.map((err) => ({
field: err.path.join('.'),
message: err.message,
code: err.code,
  })),
  context.timestamp,
);
  }

  const filters: AuditFilters = queryValidation.data;

  // 4. Database query - call existing get_user_audit_log() function
  const supabase = context.supabase;

  const { data, error } = await supabase.rpc('get_user_audit_log', {
p_user_id: profileId,
p_limit: filters.limit || 50,
  });

  if (error) {
console.error(`Database error for request [${context.requestId}]:`, error);

return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to retrieve audit log',
  context.requestId,
  process.env.NODE_ENV === 'development'
? { message: error.message }
: undefined,
  context.timestamp,
);
  }

  // 5. Apply client-side filters (since database function has limited filtering)
  // Note: This could be enhanced to use database-side filtering for better performance
  let filteredEntries = (data || []) as AuditLogEntry[];

  // Filter by action type
  if (filters.action) {
filteredEntries = filteredEntries.filter(
  (entry: AuditLogEntry) => entry.action === filters.action,
);
  }

  // Filter by date range using normalized snake_case fields
  if (filters.date_from) {
const date_from = new Date(filters.date_from);
filteredEntries = filteredEntries.filter(
  (entry: AuditLogEntry) => new Date(entry.accessed_at) >= date_from,
);
  }

  if (filters.date_to) {
const date_to = new Date(filters.date_to);
filteredEntries = filteredEntries.filter(
  (entry: AuditLogEntry) => new Date(entry.accessed_at) <= date_to,
);
  }

  // 6. Success response with comprehensive metadata
  const responseData: AuditLogResponseData = {
entries: filteredEntries as AuditLogEntry[],
total: filteredEntries.length,
profile_id: profileId,
filters: {
  limit: filters.limit,
  action: filters.action,
  date_from: filters.date_from,
  date_to: filters.date_to,
},
metadata: {
  retrieved_at: context.timestamp,
  request_id: context.requestId,
  total_entries: data?.length || 0,
  filtered_entries: filteredEntries.length,
},
  };

  return createSuccessResponse(
responseData,
context.requestId,
context.timestamp,
  );
};

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
 * Eliminates 87 lines of boilerplate code
 */
export const POST = () => handle_method_not_allowed(['GET']);
export const PUT = POST;
export const DELETE = POST;
export const PATCH = POST;

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
