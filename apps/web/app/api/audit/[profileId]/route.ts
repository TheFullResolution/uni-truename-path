// TrueNamePath: Audit Log API Route
// GET /api/audit/[profileId] - User audit log endpoint
// Date: August 12, 2025
// Academic project REST API with authentication and validation

// TrueNamePath: Audit Log API Route - JSend Compliant
import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../../lib/api';
import { ErrorCodes } from '../../../../lib/api';
import { z } from 'zod';
import { Json } from '../../../../types/generated';

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

  startDate: z
.string()
.datetime('Start date must be a valid ISO date')
.optional(),

  endDate: z.string().datetime('End date must be a valid ISO date').optional(),
});

/**
 * Validated query parameters type
 */

/**
 * Audit log entry interface matching database schema
 */
interface AuditLogEntry {
  accessed_at: string;
  action: string;
  requester_user_id: string;
  context_name: string;
  resolved_name: string;
  details: Json;
}

/**
 * Audit filters for response metadata
 */
interface AuditFilters {
  limit: number;
  action?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * API Response interfaces for type safety and consistency
 */
interface AuditLogResponseData {
  entries: AuditLogEntry[];
  total: number;
  profile_id: string;
  filters: AuditFilters;
  metadata: {
retrieved_at: string;
request_id: string;
total_entries: number;
filtered_entries: number;
  };
}

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

  // Validate UUID format
  const uuidRegex =
/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(profileId)) {
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

  // Filter by date range
  if (filters.startDate) {
const startDate = new Date(filters.startDate);
filteredEntries = filteredEntries.filter(
  (entry: AuditLogEntry) => new Date(entry.accessed_at) >= startDate,
);
  }

  if (filters.endDate) {
const endDate = new Date(filters.endDate);
filteredEntries = filteredEntries.filter(
  (entry: AuditLogEntry) => new Date(entry.accessed_at) <= endDate,
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
  startDate: filters.startDate,
  endDate: filters.endDate,
},
metadata: {
  retrieved_at: context.timestamp,
  request_id: context.requestId,
  total_entries: data?.length || 0,
  filtered_entries: filteredEntries.length,
},
  };

  console.log(`Audit API Request [${context.requestId}]:`, {
profileId: profileId.substring(0, 8) + '...',
authenticated: 'yes',
userId: context.user.id.substring(0, 8) + '...',
totalEntries: data?.length || 0,
filteredEntries: filteredEntries.length,
filters: {
  limit: filters.limit,
  action: filters.action,
  hasDateFilter: !!(filters.startDate || filters.endDate),
},
  });

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
 * - JWT authentication via HOF wrapper
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
 * Handle unsupported HTTP methods with proper JSend error responses
 */
export async function POST(): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const errorResponse = createErrorResponse(
ErrorCodes.METHOD_NOT_ALLOWED,
'Method not allowed. Use GET to retrieve audit logs.',
requestId,
{ allowedMethods: ['GET'] },
timestamp,
  );

  return new Response(JSON.stringify(errorResponse), {
status: 405,
headers: {
  'Allow': 'GET',
  'Content-Type': 'application/json',
  'X-Request-ID': requestId,
},
  });
}

export async function PUT(): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const errorResponse = createErrorResponse(
ErrorCodes.METHOD_NOT_ALLOWED,
'Method not allowed. Use GET to retrieve audit logs.',
requestId,
{ allowedMethods: ['GET'] },
timestamp,
  );

  return new Response(JSON.stringify(errorResponse), {
status: 405,
headers: {
  'Allow': 'GET',
  'Content-Type': 'application/json',
  'X-Request-ID': requestId,
},
  });
}

export async function DELETE(): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const errorResponse = createErrorResponse(
ErrorCodes.METHOD_NOT_ALLOWED,
'Method not allowed. Use GET to retrieve audit logs.',
requestId,
{ allowedMethods: ['GET'] },
timestamp,
  );

  return new Response(JSON.stringify(errorResponse), {
status: 405,
headers: {
  'Allow': 'GET',
  'Content-Type': 'application/json',
  'X-Request-ID': requestId,
},
  });
}

export async function PATCH(): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const errorResponse = createErrorResponse(
ErrorCodes.METHOD_NOT_ALLOWED,
'Method not allowed. Use GET to retrieve audit logs.',
requestId,
{ allowedMethods: ['GET'] },
timestamp,
  );

  return new Response(JSON.stringify(errorResponse), {
status: 405,
headers: {
  'Allow': 'GET',
  'Content-Type': 'application/json',
  'X-Request-ID': requestId,
},
  });
}

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
