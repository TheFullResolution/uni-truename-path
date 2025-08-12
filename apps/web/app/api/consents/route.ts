// TrueNamePath: Consent Management API Route
// POST /api/consents - Comprehensive consent lifecycle endpoint
// Date: August 12, 2025
// Academic project REST API with authentication and validation

import { NextRequest } from 'next/server';
import {
  apiAuth,
  createServerSupabaseClient,
} from '@uni-final-project/database';
import { z } from 'zod';

/**
 * Input validation schemas with comprehensive validation rules
 */
const RequestConsentSchema = z.object({
  action: z.literal('request'),
  granterUserId: z
.string()
.uuid('Granter user ID must be a valid UUID')
.min(1, 'Granter user ID is required'),
  requesterUserId: z
.string()
.uuid('Requester user ID must be a valid UUID')
.min(1, 'Requester user ID is required'),
  contextName: z
.string()
.min(1, 'Context name cannot be empty')
.max(100, 'Context name cannot exceed 100 characters')
.regex(/^[a-zA-Z0-9\s\-_]+$/, 'Context name contains invalid characters'),
  expiresAt: z
.string()
.datetime('Expires at must be a valid ISO datetime')
.optional()
.nullable(),
});

const GrantConsentSchema = z.object({
  action: z.literal('grant'),
  granterUserId: z
.string()
.uuid('Granter user ID must be a valid UUID')
.min(1, 'Granter user ID is required'),
  requesterUserId: z
.string()
.uuid('Requester user ID must be a valid UUID')
.min(1, 'Requester user ID is required'),
});

const RevokeConsentSchema = z.object({
  action: z.literal('revoke'),
  granterUserId: z
.string()
.uuid('Granter user ID must be a valid UUID')
.min(1, 'Granter user ID is required'),
  requesterUserId: z
.string()
.uuid('Requester user ID must be a valid UUID')
.min(1, 'Requester user ID is required'),
});

const ConsentRequestSchema = z.discriminatedUnion('action', [
  RequestConsentSchema,
  GrantConsentSchema,
  RevokeConsentSchema,
]);

/**
 * Validated request types
 */
type RequestConsentRequest = z.infer<typeof RequestConsentSchema>;
type GrantConsentRequest = z.infer<typeof GrantConsentSchema>;
type RevokeConsentRequest = z.infer<typeof RevokeConsentSchema>;

/**
 * API Response interfaces for type safety and consistency
 */
interface RequestConsentResponse {
  success: true;
  data: {
consentId: string;
status: 'PENDING';
granterUserId: string;
requesterUserId: string;
contextName: string;
expiresAt?: string;
createdAt: string;
  };
  message: string;
}

interface GrantConsentResponse {
  success: true;
  data: {
granted: boolean;
granterUserId: string;
requesterUserId: string;
grantedAt: string;
  };
  message: string;
}

interface RevokeConsentResponse {
  success: true;
  data: {
revoked: boolean;
granterUserId: string;
requesterUserId: string;
revokedAt: string;
  };
  message: string;
}

interface ErrorResponse {
  success: false;
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
 * POST /api/consents
 *
 * Comprehensive consent lifecycle endpoint handling three actions:
 * 1. Request consent - Create pending consent requests
 * 2. Grant consent - Approve pending consent requests
 * 3. Revoke consent - Revoke active consent grants
 *
 * Features:
 * - JWT authentication via existing auth system
 * - Comprehensive input validation with Zod discriminated unions
 * - Detailed error handling with proper HTTP status codes
 * - GDPR-compliant audit logging via database functions
 * - Academic-quality response metadata
 */
export async function POST(request: NextRequest): Promise<Response> {
  const requestId = generateRequestId();

  try {
// 1. Authentication - require authenticated requests for consent management
const authResult = await apiAuth.authenticateRequest(request.headers);

if (authResult.error || !authResult.user) {
  return Response.json(
{
  success: false,
  error: 'Authentication required for consent management',
  code: 'AUTHENTICATION_REQUIRED',
  details: authResult.error || 'No authenticated user found',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 401 },
  );
}

// 2. Request body parsing with error handling
let requestBody: unknown;
try {
  requestBody = await request.json();
} catch {
  return Response.json(
{
  success: false,
  error: 'Invalid JSON in request body',
  code: 'INVALID_JSON',
  details: 'Request body must be valid JSON',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 400 },
  );
}

// 3. Input validation with comprehensive Zod schema
const validationResult = ConsentRequestSchema.safeParse(requestBody);

if (!validationResult.success) {
  return Response.json(
{
  success: false,
  error: 'Invalid request parameters',
  code: 'VALIDATION_ERROR',
  details: validationResult.error.issues.map((err) => ({
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

const params = validationResult.data;

// 4. Business rule validation - ensure user authorization
const isAuthorizedUser =
  params.granterUserId === authResult.user.id ||
  params.requesterUserId === authResult.user.id;

if (!isAuthorizedUser) {
  return Response.json(
{
  success: false,
  error: 'Unauthorized to manage consent for specified users',
  code: 'AUTHORIZATION_ERROR',
  details: 'User can only manage consents they are involved in',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 403 },
  );
}

// 5. Business logic execution based on action
const supabase = createServerSupabaseClient();

switch (params.action) {
  case 'request': {
const requestParams = params as RequestConsentRequest;

// Additional business rule validation
if (requestParams.granterUserId === requestParams.requesterUserId) {
  return Response.json(
{
  success: false,
  error: 'Cannot request consent from yourself',
  code: 'INVALID_REQUEST',
  details: 'Granter and requester cannot be the same user',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 400 },
  );
}

const { data: consentId, error } = await supabase.rpc(
  'request_consent',
  {
p_granter_user_id: requestParams.granterUserId,
p_requester_user_id: requestParams.requesterUserId,
p_context_name: requestParams.contextName,
p_expires_at: requestParams.expiresAt || undefined,
  },
);

if (error) {
  console.error(`Consent request error [${requestId}]:`, error);

  // Handle specific database errors
  let errorMessage = 'Failed to create consent request';
  let statusCode = 500;

  if (
error.message.includes('Context') &&
error.message.includes('not found')
  ) {
errorMessage = `Context "${requestParams.contextName}" not found for granter user`;
statusCode = 404;
  } else if (error.message.includes('cannot be NULL')) {
errorMessage = 'Invalid user identifiers provided';
statusCode = 400;
  }

  return Response.json(
{
  success: false,
  error: errorMessage,
  code: 'CONSENT_REQUEST_FAILED',
  details:
process.env.NODE_ENV === 'development'
  ? error.message
  : undefined,
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: statusCode },
  );
}

const response: RequestConsentResponse = {
  success: true,
  data: {
consentId: consentId as string,
status: 'PENDING',
granterUserId: requestParams.granterUserId,
requesterUserId: requestParams.requesterUserId,
contextName: requestParams.contextName,
expiresAt: requestParams.expiresAt || undefined,
createdAt: new Date().toISOString(),
  },
  message: 'Consent request created successfully',
};

console.log(`API Request [${requestId}] - Consent Request:`, {
  action: 'request',
  consentId: consentId,
  granter: requestParams.granterUserId.substring(0, 8) + '...',
  requester: requestParams.requesterUserId.substring(0, 8) + '...',
  context: requestParams.contextName,
});

return Response.json(response, {
  status: 201,
  headers: {
'Content-Type': 'application/json',
'Cache-Control': 'no-cache, no-store, must-revalidate',
'X-Request-ID': requestId,
  },
});
  }

  case 'grant': {
const grantParams = params as GrantConsentRequest;

const { data: granted, error } = await supabase.rpc('grant_consent', {
  p_granter_user_id: grantParams.granterUserId,
  p_requester_user_id: grantParams.requesterUserId,
});

if (error) {
  console.error(`Consent grant error [${requestId}]:`, error);

  return Response.json(
{
  success: false,
  error: 'Failed to grant consent',
  code: 'CONSENT_GRANT_FAILED',
  details:
process.env.NODE_ENV === 'development'
  ? error.message
  : undefined,
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 500 },
  );
}

if (!granted) {
  return Response.json(
{
  success: false,
  error: 'No pending consent request found to grant',
  code: 'CONSENT_NOT_FOUND',
  details:
'No pending or revoked consent found between specified users',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 404 },
  );
}

const response: GrantConsentResponse = {
  success: true,
  data: {
granted: true,
granterUserId: grantParams.granterUserId,
requesterUserId: grantParams.requesterUserId,
grantedAt: new Date().toISOString(),
  },
  message: 'Consent granted successfully',
};

console.log(`API Request [${requestId}] - Consent Grant:`, {
  action: 'grant',
  granted: true,
  granter: grantParams.granterUserId.substring(0, 8) + '...',
  requester: grantParams.requesterUserId.substring(0, 8) + '...',
});

return Response.json(response, {
  status: 200,
  headers: {
'Content-Type': 'application/json',
'Cache-Control': 'no-cache, no-store, must-revalidate',
'X-Request-ID': requestId,
  },
});
  }

  case 'revoke': {
const revokeParams = params as RevokeConsentRequest;

const { data: revoked, error } = await supabase.rpc('revoke_consent', {
  p_granter_user_id: revokeParams.granterUserId,
  p_requester_user_id: revokeParams.requesterUserId,
});

if (error) {
  console.error(`Consent revoke error [${requestId}]:`, error);

  return Response.json(
{
  success: false,
  error: 'Failed to revoke consent',
  code: 'CONSENT_REVOKE_FAILED',
  details:
process.env.NODE_ENV === 'development'
  ? error.message
  : undefined,
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 500 },
  );
}

if (!revoked) {
  return Response.json(
{
  success: false,
  error: 'No active consent found to revoke',
  code: 'CONSENT_NOT_FOUND',
  details: 'No granted consent found between specified users',
  timestamp: new Date().toISOString(),
  requestId,
} as ErrorResponse,
{ status: 404 },
  );
}

const response: RevokeConsentResponse = {
  success: true,
  data: {
revoked: true,
granterUserId: revokeParams.granterUserId,
requesterUserId: revokeParams.requesterUserId,
revokedAt: new Date().toISOString(),
  },
  message: 'Consent revoked successfully',
};

console.log(`API Request [${requestId}] - Consent Revoke:`, {
  action: 'revoke',
  revoked: true,
  granter: revokeParams.granterUserId.substring(0, 8) + '...',
  requester: revokeParams.requesterUserId.substring(0, 8) + '...',
});

return Response.json(response, {
  status: 200,
  headers: {
'Content-Type': 'application/json',
'Cache-Control': 'no-cache, no-store, must-revalidate',
'X-Request-ID': requestId,
  },
});
  }

  default: {
// TypeScript should prevent this, but include for completeness
return Response.json(
  {
success: false,
error: 'Invalid action specified',
code: 'INVALID_ACTION',
details: 'Action must be one of: request, grant, revoke',
timestamp: new Date().toISOString(),
requestId,
  } as ErrorResponse,
  { status: 400 },
);
  }
}
  } catch (error) {
// Comprehensive error logging for debugging
console.error(`API Route Error [${requestId}]:`, {
  error: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
  endpoint: '/api/consents',
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
  }
}

return Response.json(
  {
success: false,
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
export async function GET(): Promise<Response> {
  return Response.json(
{
  success: false,
  error: 'Method not allowed. Use POST to manage consents.',
  code: 'METHOD_NOT_ALLOWED',
  timestamp: new Date().toISOString(),
  allowedMethods: ['POST'],
} as ErrorResponse,
{
  status: 405,
  headers: {
'Allow': 'POST',
'Content-Type': 'application/json',
  },
},
  );
}

export async function PUT(): Promise<Response> {
  return Response.json(
{
  success: false,
  error: 'Method not allowed. Use POST to manage consents.',
  code: 'METHOD_NOT_ALLOWED',
  timestamp: new Date().toISOString(),
  allowedMethods: ['POST'],
} as ErrorResponse,
{
  status: 405,
  headers: {
'Allow': 'POST',
'Content-Type': 'application/json',
  },
},
  );
}

export async function DELETE(): Promise<Response> {
  return Response.json(
{
  success: false,
  error: 'Method not allowed. Use POST to manage consents.',
  code: 'METHOD_NOT_ALLOWED',
  timestamp: new Date().toISOString(),
  allowedMethods: ['POST'],
} as ErrorResponse,
{
  status: 405,
  headers: {
'Allow': 'POST',
'Content-Type': 'application/json',
  },
},
  );
}

export async function PATCH(): Promise<Response> {
  return Response.json(
{
  success: false,
  error: 'Method not allowed. Use POST to manage consents.',
  code: 'METHOD_NOT_ALLOWED',
  timestamp: new Date().toISOString(),
  allowedMethods: ['POST'],
} as ErrorResponse,
{
  status: 405,
  headers: {
'Allow': 'POST',
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
  'Allow': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
},
  });
}
