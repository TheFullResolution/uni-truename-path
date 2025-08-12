// TrueNamePath: Names Retrieval API Route
// GET /api/names/[profileId] - Retrieve all names for a specific profile
// Date: August 12, 2025
// Academic project REST API with authentication and validation

import { NextRequest } from 'next/server';
import {
  verifyAndGetUser,
  extractTokenFromHeader,
  createServerSupabaseClient,
  type Database,
} from '@uni-final-project/database';
import { z } from 'zod';

/**
 * URL parameter validation schema with comprehensive validation rules
 */
const ProfileIdParamsSchema = z.object({
  profileId: z
.string()
.uuid('Profile ID must be a valid UUID')
.min(1, 'Profile ID is required'),
});

/**
 * Query parameter validation schema for filtering and pagination
 */
const QueryParamsSchema = z.object({
  limit: z
.string()
.nullable()
.optional()
.transform((val) => (val ? parseInt(val, 10) : undefined))
.refine((val) => !val || (val > 0 && val <= 100), {
  message: 'Limit must be between 1 and 100',
}),

  nameType: z
.enum(['LEGAL', 'PREFERRED', 'NICKNAME', 'ALIAS'])
.nullable()
.optional(),

  includeUnverified: z
.string()
.nullable()
.optional()
.transform((val) => val === 'true')
.pipe(z.boolean())
.default(false),
});

/**
 * Validated parameter types
 */
type QueryParams = z.infer<typeof QueryParamsSchema>;

/**
 * Name variant interface based on database schema
 */
interface NameVariant {
  id: string;
  nameText: string;
  nameType: Database['public']['Enums']['name_category'];
  isPreferred: boolean;
  verified: boolean | null;
  source: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * API Response interfaces for type safety and consistency
 */
interface NamesResponse {
  names: NameVariant[];
  total: number;
  profileId: string;
  metadata: {
retrievalTimestamp: string;
filterApplied?: {
  nameType?: string;
  includeUnverified?: boolean;
  limit?: number;
};
userId: string;
isOwner: boolean;
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
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * GET /api/names/[profileId]
 *
 * Retrieve all name variants for a specific user profile with authentication
 *
 * Features:
 * - JWT authentication via existing auth system
 * - Profile ownership validation (users can only access their own names)
 * - Optional filtering by name type and verification status
 * - Comprehensive input validation with Zod
 * - Detailed error handling with proper HTTP status codes
 * - GDPR-compliant access logging
 * - Performance-optimized database queries
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> },
): Promise<Response> {
  const requestId = generateRequestId();

  try {
// 1. URL parameter validation - await params for Next.js 15 compatibility
const params = await context.params;
const paramValidationResult = ProfileIdParamsSchema.safeParse(params);

if (!paramValidationResult.success) {
  return Response.json(
{
  error: 'Invalid profile ID parameter',
  code: 'VALIDATION_ERROR',
  details: paramValidationResult.error.issues.map((err) => ({
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

const { profileId } = paramValidationResult.data;

// 2. Query parameter validation
const url = new URL(request.url);
const queryParams = {
  limit: url.searchParams.get('limit'),
  nameType: url.searchParams.get('nameType'),
  includeUnverified: url.searchParams.get('includeUnverified'),
};

const queryValidationResult = QueryParamsSchema.safeParse(queryParams);

if (!queryValidationResult.success) {
  return Response.json(
{
  error: 'Invalid query parameters',
  code: 'VALIDATION_ERROR',
  details: queryValidationResult.error.issues.map((err) => ({
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

const validatedQueryParams = queryValidationResult.data;

// 3. JWT Authentication - Required for this endpoint
const authHeader = request.headers.get('authorization');
const token = extractTokenFromHeader(authHeader);

if (!token) {
  return Response.json(
{
  error: 'Missing authorization token',
  code: 'UNAUTHORIZED',
  details: 'Authorization header with Bearer token is required',
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
  error: 'Invalid or expired token',
  code: 'UNAUTHORIZED',
  details: authResult.error || 'Authentication failed',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 401 },
  );
}

const authenticatedUserId = authResult.user.id;

// 4. Profile ownership validation
if (authenticatedUserId !== profileId) {
  return Response.json(
{
  error: 'Access denied',
  code: 'FORBIDDEN',
  details: 'You can only access your own name variants',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 403 },
  );
}

// 5. Database query with optional filtering
const supabase = createServerSupabaseClient();

let query = supabase.from('names').select('*').eq('user_id', profileId);

// Apply optional filters
if (validatedQueryParams.nameType) {
  query = query.eq('name_type', validatedQueryParams.nameType);
}

if (!validatedQueryParams.includeUnverified) {
  query = query.eq('verified', true);
}

if (validatedQueryParams.limit) {
  query = query.limit(validatedQueryParams.limit);
}

// Order by creation date (newest first) and preferred status
query = query
  .order('is_preferred', { ascending: false })
  .order('created_at', { ascending: false });

const { data: namesData, error: queryError } = await query;

if (queryError) {
  console.error(`Database Query Error [${requestId}]:`, {
error: queryError.message,
code: queryError.code,
details: queryError.details,
hint: queryError.hint,
  });

  return Response.json(
{
  error: 'Database query failed',
  code: 'DATABASE_ERROR',
  details:
process.env.NODE_ENV === 'development'
  ? queryError.message
  : 'Unable to retrieve name variants',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 500 },
  );
}

// 6. Transform database results to API format
const nameVariants: NameVariant[] = (namesData || []).map((name) => ({
  id: name.id,
  nameText: name.name_text,
  nameType: name.name_type,
  isPreferred: name.is_preferred,
  verified: name.verified,
  source: name.source,
  createdAt: name.created_at,
  updatedAt: name.updated_at,
}));

// 7. Success response with comprehensive metadata
const response: NamesResponse = {
  names: nameVariants,
  total: nameVariants.length,
  profileId,
  metadata: {
retrievalTimestamp: new Date().toISOString(),
filterApplied: {
  nameType: validatedQueryParams.nameType || undefined,
  includeUnverified: validatedQueryParams.includeUnverified,
  limit: validatedQueryParams.limit,
},
userId: authenticatedUserId,
isOwner: true,
  },
};

console.log(`API Request [${requestId}]:`, {
  endpoint: '/api/names/[profileId]',
  method: 'GET',
  profileId: profileId.substring(0, 8) + '...',
  authenticatedUserId: authenticatedUserId.substring(0, 8) + '...',
  totalNames: nameVariants.length,
  filtersApplied: Object.keys(validatedQueryParams).filter(
(key) => validatedQueryParams[key as keyof QueryParams] !== undefined,
  ).length,
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
console.error(`API Route Error [${requestId}]:`, {
  error: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
  endpoint: '/api/names/[profileId]',
  method: 'GET',
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
errorCode = 'AUTHENTICATION_ERROR';
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
  error: 'Method not allowed. Use GET to retrieve names.',
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
  error: 'Method not allowed. Use GET to retrieve names.',
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
  error: 'Method not allowed. Use GET to retrieve names.',
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
  error: 'Method not allowed. Use GET to retrieve names.',
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
