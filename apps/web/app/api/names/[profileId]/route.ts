// TrueNamePath: Names Retrieval API Route
// GET /api/names/[profileId] - Retrieve all names for a specific profile
// Date: August 12, 2025
// Academic project REST API with authentication and validation

// TrueNamePath: Names Retrieval API Route - JSend Compliant
import { NextRequest } from 'next/server';
import type { Database } from '../../../../lib/types/database';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../../lib/api/with-auth';
import { ErrorCodes } from '../../../../lib/api/types';
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
interface NamesResponseData {
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

/**
 * Core handler function implementing the names retrieval logic
 * This is wrapped by the required authentication HOF
 */
const handleGetNamesRequest: AuthenticatedHandler<NamesResponseData> = async (
  request: NextRequest,
  context,
) => {
  // 1. URL parameter validation - await the profileId from the context
  // Note: context is passed differently in the HOF pattern
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const profileId = pathSegments[pathSegments.length - 1];

  const paramValidationResult = ProfileIdParamsSchema.safeParse({ profileId });

  if (!paramValidationResult.success) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid profile ID parameter',
  context.requestId,
  paramValidationResult.error.issues.map((err) => ({
field: err.path.join('.'),
message: err.message,
code: err.code,
  })),
  context.timestamp,
);
  }

  const validatedProfileId = paramValidationResult.data.profileId;

  // 2. Query parameter validation
  const queryParams = {
limit: url.searchParams.get('limit'),
nameType: url.searchParams.get('nameType'),
includeUnverified: url.searchParams.get('includeUnverified'),
  };

  const queryValidationResult = QueryParamsSchema.safeParse(queryParams);

  if (!queryValidationResult.success) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid query parameters',
  context.requestId,
  queryValidationResult.error.issues.map((err) => ({
field: err.path.join('.'),
message: err.message,
code: err.code,
  })),
  context.timestamp,
);
  }

  const validatedQueryParams = queryValidationResult.data;

  // 3. Profile ownership validation (authentication is handled by HOF)
  if (!context.user || context.user.id !== validatedProfileId) {
return createErrorResponse(
  ErrorCodes.AUTHORIZATION_FAILED,
  'Access denied',
  context.requestId,
  'You can only access your own name variants',
  context.timestamp,
);
  }

  const authenticatedUserId = context.user.id;

  // 4. Database query with authenticated client from context
  const supabase = context.supabase;

  let query = supabase
.from('names')
.select('*')
.eq('user_id', validatedProfileId);

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
console.error(`Database Query Error [${context.requestId}]:`, {
  error: queryError.message,
  code: queryError.code,
  details: queryError.details,
  hint: queryError.hint,
});

return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Database query failed',
  context.requestId,
  process.env.NODE_ENV === 'development'
? queryError.message
: 'Unable to retrieve name variants',
  context.timestamp,
);
  }

  // 5. Transform database results to API format
  const nameVariants: NameVariant[] = (namesData || []).map(
(name: Database['public']['Tables']['names']['Row']) => ({
  id: name.id,
  nameText: name.name_text,
  nameType: name.name_type,
  isPreferred: name.is_preferred,
  verified: name.verified,
  source: name.source,
  createdAt: name.created_at,
  updatedAt: name.updated_at,
}),
  );

  // 6. Success response with comprehensive metadata
  const responseData: NamesResponseData = {
names: nameVariants,
total: nameVariants.length,
profileId: validatedProfileId,
metadata: {
  retrievalTimestamp: context.timestamp,
  filterApplied: {
nameType: validatedQueryParams.nameType || undefined,
includeUnverified: validatedQueryParams.includeUnverified,
limit: validatedQueryParams.limit,
  },
  userId: authenticatedUserId,
  isOwner: true,
},
  };

  console.log(`API Request [${context.requestId}]:`, {
endpoint: '/api/names/[profileId]',
method: 'GET',
profileId: validatedProfileId.substring(0, 8) + '...',
authenticatedUserId: authenticatedUserId.substring(0, 8) + '...',
totalNames: nameVariants.length,
filtersApplied: Object.keys(validatedQueryParams).filter(
  (key) => validatedQueryParams[key as keyof QueryParams] !== undefined,
).length,
  });

  return createSuccessResponse(
responseData,
context.requestId,
context.timestamp,
  );
};

/**
 * GET /api/names/[profileId]
 *
 * Retrieve all name variants for a specific user profile with authentication
 *
 * Features:
 * - JWT authentication via HOF wrapper
 * - Profile ownership validation (users can only access their own names)
 * - Optional filtering by name type and verification status
 * - Comprehensive input validation with Zod
 * - Detailed error handling with proper HTTP status codes
 * - GDPR-compliant access logging
 * - Performance-optimized database queries
 * - JSend format compliance
 */
export const GET = withRequiredAuth(handleGetNamesRequest, {
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
'Method not allowed. Use GET to retrieve names.',
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
'Method not allowed. Use GET to retrieve names.',
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
'Method not allowed. Use GET to retrieve names.',
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
'Method not allowed. Use GET to retrieve names.',
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
