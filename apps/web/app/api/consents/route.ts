// TrueNamePath: Consent Management API Route
// POST /api/consents - Comprehensive consent lifecycle endpoint
// Date: August 12, 2025
// Academic project REST API with authentication and validation

// TrueNamePath: Consent Management API Route - JSend Compliant
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@uni-final-project/database';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../lib/api/with-auth';
import { ErrorCodes } from '../../../lib/api/types';
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
 * API Response data interfaces for type safety and consistency
 * Note: Following JSend specification without message field in success responses
 */
interface RequestConsentData {
  consentId: string;
  status: 'PENDING';
  granterUserId: string;
  requesterUserId: string;
  contextName: string;
  expiresAt?: string;
  createdAt: string;
  message: string; // Business message moved to data payload
}

interface GrantConsentData {
  granted: boolean;
  granterUserId: string;
  requesterUserId: string;
  grantedAt: string;
  message: string; // Business message moved to data payload
}

interface RevokeConsentData {
  revoked: boolean;
  granterUserId: string;
  requesterUserId: string;
  revokedAt: string;
  message: string; // Business message moved to data payload
}

/**
 * Core handler function implementing the consent management logic
 * This is wrapped by the required authentication HOF
 */
const handleConsentRequest: AuthenticatedHandler<
  RequestConsentData | GrantConsentData | RevokeConsentData
> = async (request: NextRequest, context) => {
  // 1. Request body parsing with error handling
  let requestBody: unknown;
  try {
requestBody = await request.json();
  } catch {
return createErrorResponse(
  ErrorCodes.INVALID_JSON,
  'Invalid JSON in request body',
  context.requestId,
  'Request body must be valid JSON',
  context.timestamp,
);
  }

  // 2. Input validation with comprehensive Zod schema
  const validationResult = ConsentRequestSchema.safeParse(requestBody);

  if (!validationResult.success) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid request parameters',
  context.requestId,
  validationResult.error.issues.map((err) => ({
field: err.path.join('.'),
message: err.message,
code: err.code,
  })),
  context.timestamp,
);
  }

  const params = validationResult.data;

  // 3. Business rule validation - ensure user authorization
  if (!context.user) {
return createErrorResponse(
  ErrorCodes.AUTHENTICATION_FAILED,
  'User authentication required',
  context.requestId,
  'No authenticated user found',
  context.timestamp,
);
  }

  const isAuthorizedUser =
params.granterUserId === context.user.id ||
params.requesterUserId === context.user.id;

  if (!isAuthorizedUser) {
return createErrorResponse(
  ErrorCodes.AUTHORIZATION_FAILED,
  'Unauthorized to manage consent for specified users',
  context.requestId,
  'User can only manage consents they are involved in',
  context.timestamp,
);
  }

  // 4. Business logic execution based on action
  const supabase = createServerSupabaseClient();

  switch (params.action) {
case 'request': {
  const requestParams = params as RequestConsentRequest;

  // Additional business rule validation
  if (requestParams.granterUserId === requestParams.requesterUserId) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Cannot request consent from yourself',
  context.requestId,
  'Granter and requester cannot be the same user',
  context.timestamp,
);
  }

  const { data: consentId, error } = await supabase.rpc('request_consent', {
p_granter_user_id: requestParams.granterUserId,
p_requester_user_id: requestParams.requesterUserId,
p_context_name: requestParams.contextName,
p_expires_at: requestParams.expiresAt || undefined,
  });

  if (error) {
console.error(`Consent request error [${context.requestId}]:`, error);

// Handle specific database errors
let errorMessage = 'Failed to create consent request';
let errorCode: string = ErrorCodes.CONSENT_REQUEST_FAILED;

if (
  error.message.includes('Context') &&
  error.message.includes('not found')
) {
  errorMessage = `Context "${requestParams.contextName}" not found for granter user`;
  errorCode = ErrorCodes.CONTEXT_NOT_FOUND;
} else if (error.message.includes('cannot be NULL')) {
  errorMessage = 'Invalid user identifiers provided';
  errorCode = ErrorCodes.VALIDATION_ERROR;
}

return createErrorResponse(
  errorCode,
  errorMessage,
  context.requestId,
  process.env.NODE_ENV === 'development' ? error.message : undefined,
  context.timestamp,
);
  }

  const responseData: RequestConsentData = {
consentId: consentId as string,
status: 'PENDING',
granterUserId: requestParams.granterUserId,
requesterUserId: requestParams.requesterUserId,
contextName: requestParams.contextName,
expiresAt: requestParams.expiresAt || undefined,
createdAt: context.timestamp,
message: 'Consent request created successfully',
  };

  console.log(`API Request [${context.requestId}] - Consent Request:`, {
action: 'request',
consentId: consentId,
granter: requestParams.granterUserId.substring(0, 8) + '...',
requester: requestParams.requesterUserId.substring(0, 8) + '...',
context: requestParams.contextName,
  });

  // Return success response - status will be set by HOF wrapper to 201
  // Note: The HOF wrapper handles status code mapping, but we can override for 201
  const successResponse = createSuccessResponse(
responseData,
context.requestId,
context.timestamp,
  );

  // For 201 status, we need to handle this specially in the HOF or return a special response
  // For now, return the success response and let the HOF handle it
  return successResponse;
}

case 'grant': {
  const grantParams = params as GrantConsentRequest;

  const { data: granted, error } = await supabase.rpc('grant_consent', {
p_granter_user_id: grantParams.granterUserId,
p_requester_user_id: grantParams.requesterUserId,
  });

  if (error) {
console.error(`Consent grant error [${context.requestId}]:`, error);

return createErrorResponse(
  ErrorCodes.CONSENT_GRANT_FAILED,
  'Failed to grant consent',
  context.requestId,
  process.env.NODE_ENV === 'development' ? error.message : undefined,
  context.timestamp,
);
  }

  if (!granted) {
return createErrorResponse(
  ErrorCodes.CONSENT_NOT_FOUND,
  'No pending consent request found to grant',
  context.requestId,
  'No pending or revoked consent found between specified users',
  context.timestamp,
);
  }

  const responseData: GrantConsentData = {
granted: true,
granterUserId: grantParams.granterUserId,
requesterUserId: grantParams.requesterUserId,
grantedAt: context.timestamp,
message: 'Consent granted successfully',
  };

  console.log(`API Request [${context.requestId}] - Consent Grant:`, {
action: 'grant',
granted: true,
granter: grantParams.granterUserId.substring(0, 8) + '...',
requester: grantParams.requesterUserId.substring(0, 8) + '...',
  });

  return createSuccessResponse(
responseData,
context.requestId,
context.timestamp,
  );
}

case 'revoke': {
  const revokeParams = params as RevokeConsentRequest;

  const { data: revoked, error } = await supabase.rpc('revoke_consent', {
p_granter_user_id: revokeParams.granterUserId,
p_requester_user_id: revokeParams.requesterUserId,
  });

  if (error) {
console.error(`Consent revoke error [${context.requestId}]:`, error);

return createErrorResponse(
  ErrorCodes.CONSENT_REVOKE_FAILED,
  'Failed to revoke consent',
  context.requestId,
  process.env.NODE_ENV === 'development' ? error.message : undefined,
  context.timestamp,
);
  }

  if (!revoked) {
return createErrorResponse(
  ErrorCodes.CONSENT_NOT_FOUND,
  'No active consent found to revoke',
  context.requestId,
  'No granted consent found between specified users',
  context.timestamp,
);
  }

  const responseData: RevokeConsentData = {
revoked: true,
granterUserId: revokeParams.granterUserId,
requesterUserId: revokeParams.requesterUserId,
revokedAt: context.timestamp,
message: 'Consent revoked successfully',
  };

  console.log(`API Request [${context.requestId}] - Consent Revoke:`, {
action: 'revoke',
revoked: true,
granter: revokeParams.granterUserId.substring(0, 8) + '...',
requester: revokeParams.requesterUserId.substring(0, 8) + '...',
  });

  return createSuccessResponse(
responseData,
context.requestId,
context.timestamp,
  );
}

default: {
  // TypeScript should prevent this, but include for completeness
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid action specified',
context.requestId,
'Action must be one of: request, grant, revoke',
context.timestamp,
  );
}
  }
};

/**
 * POST /api/consents
 *
 * Comprehensive consent lifecycle endpoint handling three actions:
 * 1. Request consent - Create pending consent requests
 * 2. Grant consent - Approve pending consent requests
 * 3. Revoke consent - Revoke active consent grants
 *
 * Features:
 * - JWT authentication via HOF wrapper
 * - Comprehensive input validation with Zod discriminated unions
 * - Detailed error handling with proper HTTP status codes
 * - GDPR-compliant audit logging via database functions
 * - Academic-quality response metadata
 * - JSend format compliance
 */
export const POST = withRequiredAuth(handleConsentRequest, {
  enableLogging: true,
});

/**
 * Handle unsupported HTTP methods with proper JSend error responses
 */
export async function GET(): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const errorResponse = createErrorResponse(
ErrorCodes.METHOD_NOT_ALLOWED,
'Method not allowed. Use POST to manage consents.',
requestId,
{ allowedMethods: ['POST'] },
timestamp,
  );

  return new Response(JSON.stringify(errorResponse), {
status: 405,
headers: {
  'Allow': 'POST',
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
'Method not allowed. Use POST to manage consents.',
requestId,
{ allowedMethods: ['POST'] },
timestamp,
  );

  return new Response(JSON.stringify(errorResponse), {
status: 405,
headers: {
  'Allow': 'POST',
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
'Method not allowed. Use POST to manage consents.',
requestId,
{ allowedMethods: ['POST'] },
timestamp,
  );

  return new Response(JSON.stringify(errorResponse), {
status: 405,
headers: {
  'Allow': 'POST',
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
'Method not allowed. Use POST to manage consents.',
requestId,
{ allowedMethods: ['POST'] },
timestamp,
  );

  return new Response(JSON.stringify(errorResponse), {
status: 405,
headers: {
  'Allow': 'POST',
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
  'Allow': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
},
  });
}
