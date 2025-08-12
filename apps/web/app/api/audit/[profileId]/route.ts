// TrueNamePath: Audit Log API Route
// GET /api/audit/[profileId] - User audit log endpoint
// Date: August 12, 2025
// Academic project REST API with authentication and validation

import { NextRequest } from 'next/server';
import {
  verifyAndGetUser,
  extractTokenFromHeader,
} from '@uni-final-project/database';
import {
  createServerSupabaseClient,
  type Json,
} from '@uni-final-project/database';
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
.enum(['name_resolved', 'consent_granted', 'consent_revoked'])
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
interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
  profileId: string;
  filters: AuditFilters;
  metadata: {
retrievedAt: string;
requestId: string;
totalEntries: number;
filteredEntries: number;
  };
}

interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

/**
 * Generate unique request ID for tracking and debugging
 */
function generateRequestId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * GET /api/audit/[profileId]
 *
 * Retrieves audit log entries for a specific user profile with comprehensive filtering options.
 *
 * Features:
 * - JWT authentication using existing auth system
 * - Comprehensive query parameter validation with Zod
 * - Direct RPC call to get_user_audit_log() function
 * - GDPR-compliant audit trail access
 * - Detailed error handling with proper HTTP status codes
 * - Academic-quality response metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const requestId = generateRequestId();

  try {
// 1. Validate profileId parameter - await params for Next.js 15 compatibility
const resolvedParams = await params;
const profileId = resolvedParams.profileId;

if (!profileId) {
  return Response.json(
{
  error: 'Profile ID is required',
  code: 'MISSING_PROFILE_ID',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 400 },
  );
}

// Validate UUID format
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(profileId)) {
  return Response.json(
{
  error: 'Invalid profile ID format',
  code: 'INVALID_PROFILE_ID',
  details: 'Profile ID must be a valid UUID',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 400 },
  );
}

// 2. Authentication - require valid JWT token
const authHeader = request.headers.get('authorization');
const token = extractTokenFromHeader(authHeader);

if (!token) {
  return Response.json(
{
  error: 'Authorization required',
  code: 'MISSING_AUTH_TOKEN',
  details: 'Bearer token required in Authorization header',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 401 },
  );
}

const authResult = await verifyAndGetUser(token);

if (authResult.error || !authResult.user) {
  return Response.json(
{
  error: 'Authentication failed',
  code: 'INVALID_TOKEN',
  details: authResult.error || 'Invalid or expired token',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 401 },
  );
}

// 3. Authorization - ensure user can only access their own audit log
if (authResult.user.id !== profileId) {
  return Response.json(
{
  error: 'Access denied',
  code: 'UNAUTHORIZED_ACCESS',
  details: 'You can only access your own audit log',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 403 },
  );
}

// 4. Query parameter parsing and validation
const url = new URL(request.url);
const queryParams = Object.fromEntries(url.searchParams.entries());
const queryValidation = AuditQuerySchema.safeParse(queryParams);

if (!queryValidation.success) {
  return Response.json(
{
  error: 'Invalid query parameters',
  code: 'VALIDATION_ERROR',
  details: queryValidation.error.issues.map((err) => ({
field: err.path.join('.'),
message: err.message,
code: err.code,
  })),
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 400 },
  );
}

const filters: AuditFilters = queryValidation.data;

// 5. Database query - call existing get_user_audit_log() function
const supabase = createServerSupabaseClient();

const { data, error } = await supabase.rpc('get_user_audit_log', {
  p_user_id: profileId,
  p_limit: filters.limit || 50,
});

if (error) {
  console.error(`Database error for request [${requestId}]:`, error);

  return Response.json(
{
  error: 'Failed to retrieve audit log',
  code: 'DATABASE_ERROR',
  details:
process.env.NODE_ENV === 'development'
  ? { message: error.message }
  : undefined,
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 500 },
  );
}

// 6. Apply client-side filters (since database function has limited filtering)
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

// 7. Success response with comprehensive metadata
const response: AuditLogResponse = {
  entries: filteredEntries as AuditLogEntry[],
  total: filteredEntries.length,
  profileId: profileId,
  filters: {
limit: filters.limit,
action: filters.action,
startDate: filters.startDate,
endDate: filters.endDate,
  },
  metadata: {
retrievedAt: new Date().toISOString(),
requestId,
totalEntries: data?.length || 0,
filteredEntries: filteredEntries.length,
  },
};

console.log(`Audit API Request [${requestId}]:`, {
  profileId: profileId.substring(0, 8) + '...',
  authenticated: 'yes',
  userId: authResult.user.id.substring(0, 8) + '...',
  totalEntries: data?.length || 0,
  filteredEntries: filteredEntries.length,
  filters: {
limit: filters.limit,
action: filters.action,
hasDateFilter: !!(filters.startDate || filters.endDate),
  },
});

return Response.json(response, {
  status: 200,
  headers: {
'Content-Type': 'application/json',
'Cache-Control': 'no-cache, no-store, must-revalidate',
'X-Request-ID': requestId,
  },
});
  } catch (error) {
// Comprehensive error logging for debugging
console.error(`Audit API Route Error [${requestId}]:`, {
  error: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
  endpoint: `/api/audit/[profileId]`,
});

// Determine error type and appropriate response
let errorCode = 'INTERNAL_SERVER_ERROR';
let statusCode = 500;
let errorMessage = 'Internal server error occurred';

if (error instanceof Error) {
  // Check for specific error types
  if (error.message.includes('Database')) {
errorCode = 'DATABASE_ERROR';
errorMessage = 'Database operation failed';
  } else if (error.message.includes('Timeout')) {
errorCode = 'TIMEOUT_ERROR';
statusCode = 504;
errorMessage = 'Request timeout occurred';
  } else if (error.message.includes('Network')) {
errorCode = 'NETWORK_ERROR';
errorMessage = 'Network error occurred';
  } else if (
error.message.includes('JWT') ||
error.message.includes('token')
  ) {
errorCode = 'AUTH_ERROR';
statusCode = 401;
errorMessage = 'Authentication error occurred';
  }
}

return Response.json(
  {
error: errorMessage,
code: errorCode,
timestamp: new Date().toISOString(),
requestId,
details:
  process.env.NODE_ENV === 'development'
? {
message:
  error instanceof Error ? error.message : 'Unknown error',
  }
: undefined,
  } as ErrorResponse,
  {
status: statusCode,
headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId,
},
  },
);
  }
}

/**
 * Handle unsupported HTTP methods with proper error responses
 */
export async function POST(): Promise<Response> {
  return Response.json(
{
  error: 'Method not allowed. Use GET to retrieve audit logs.',
  code: 'METHOD_NOT_ALLOWED',
  timestamp: new Date().toISOString(),
  allowedMethods: ['GET'],
} as ErrorResponse,
{
  status: 405,
  headers: {
'Allow': 'GET',
'Content-Type': 'application/json',
  },
},
  );
}

export async function PUT(): Promise<Response> {
  return Response.json(
{
  error: 'Method not allowed. Use GET to retrieve audit logs.',
  code: 'METHOD_NOT_ALLOWED',
  timestamp: new Date().toISOString(),
  allowedMethods: ['GET'],
} as ErrorResponse,
{
  status: 405,
  headers: {
'Allow': 'GET',
'Content-Type': 'application/json',
  },
},
  );
}

export async function DELETE(): Promise<Response> {
  return Response.json(
{
  error: 'Method not allowed. Use GET to retrieve audit logs.',
  code: 'METHOD_NOT_ALLOWED',
  timestamp: new Date().toISOString(),
  allowedMethods: ['GET'],
} as ErrorResponse,
{
  status: 405,
  headers: {
'Allow': 'GET',
'Content-Type': 'application/json',
  },
},
  );
}

export async function PATCH(): Promise<Response> {
  return Response.json(
{
  error: 'Method not allowed. Use GET to retrieve audit logs.',
  code: 'METHOD_NOT_ALLOWED',
  timestamp: new Date().toISOString(),
  allowedMethods: ['GET'],
} as ErrorResponse,
{
  status: 405,
  headers: {
'Allow': 'GET',
'Content-Type': 'application/json',
  },
},
  );
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
