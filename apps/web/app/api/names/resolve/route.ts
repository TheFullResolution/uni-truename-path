// TrueNamePath: Name Resolution API Route
// POST /api/names/resolve - Core name resolution endpoint
// Date: August 11, 2025
// Academic project REST API with authentication and validation

// TrueNamePath: Name Resolution API Route - JSend Compliant
import { NextRequest } from 'next/server';
import {
  TrueNameContextEngine,
  type ResolutionSource,
} from '../../../../lib/context-engine/TrueNameContextEngine';
import {
  withOptionalAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../../lib/api/with-auth';
import { ErrorCodes } from '../../../../lib/api/types';
import { z } from 'zod';

/**
 * Input validation schema with comprehensive validation rules
 */
const ResolveNameRequestSchema = z
  .object({
targetUserId: z
  .string()
  .uuid('Target user ID must be a valid UUID')
  .min(1, 'Target user ID is required'),

requesterUserId: z
  .string()
  .uuid('Requester user ID must be a valid UUID')
  .optional()
  .nullable(),

contextName: z
  .string()
  .min(1, 'Context name cannot be empty')
  .max(100, 'Context name cannot exceed 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Context name contains invalid characters')
  .optional()
  .nullable(),
  })
  .refine(
(data) => {
  // Business rule: if requesterUserId is provided, it should be different from targetUserId
  if (data.requesterUserId && data.requesterUserId === data.targetUserId) {
return false;
  }
  return true;
},
{
  message: 'Requester user ID cannot be the same as target user ID',
  path: ['requesterUserId'],
},
  );

/**
 * Validated request type
 */
// type ResolveNameRequest = z.infer<typeof ResolveNameRequestSchema>;

/**
 * API Response interfaces for type safety and consistency
 */
interface ResolveNameData {
  name: string;
  resolvedAt: string;
  source: ResolutionSource;
  metadata: {
resolutionTimestamp: string;
contextId?: string;
contextName?: string;
nameId?: string;
consentId?: string;
fallbackReason?: string;
requestedContext?: string;
hadRequester?: boolean;
  };
}

/**
 * Core handler function implementing the name resolution logic
 * This is wrapped by the authentication HOF
 */
const handleResolveNameRequest: AuthenticatedHandler<ResolveNameData> = async (
  request: NextRequest,
  context,
) => {
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
  const validationResult = ResolveNameRequestSchema.safeParse(requestBody);

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

  // 3. Business logic execution
  const contextEngine = new TrueNameContextEngine();

  const nameResolution = await contextEngine.resolveName({
targetUserId: params.targetUserId,
requesterUserId: params.requesterUserId || undefined,
contextName: params.contextName || undefined,
  });

  // 4. Success response with comprehensive metadata
  const responseData: ResolveNameData = {
name: nameResolution.name,
resolvedAt: nameResolution.metadata.resolutionTimestamp,
source: nameResolution.source,
metadata: {
  ...nameResolution.metadata,
},
  };

  console.log(`API Request [${context.requestId}]:`, {
source: nameResolution.source,
targetUser: params.targetUserId.substring(0, 8) + '...',
contextRequested: params.contextName || 'none',
authenticated: context.isAuthenticated ? 'yes' : 'no',
requesterUser: params.requesterUserId
  ? params.requesterUserId.substring(0, 8) + '...'
  : 'none',
  });

  return createSuccessResponse(
responseData,
context.requestId,
context.timestamp,
  );
};

/**
 * POST /api/names/resolve
 *
 * Core name resolution endpoint implementing the 3-layer priority system:
 * 1. Consent-based resolution (highest priority)
 * 2. Context-specific resolution (medium priority)
 * 3. Preferred name fallback (lowest priority)
 *
 * Features:
 * - Optional JWT authentication (demo mode compatible)
 * - Comprehensive input validation with Zod
 * - Detailed error handling with proper HTTP status codes
 * - GDPR-compliant audit logging
 * - Academic-quality response metadata
 * - JSend format compliance
 */
export const POST = withOptionalAuth(handleResolveNameRequest, {
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
'Method not allowed. Use POST to resolve names.',
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
'Method not allowed. Use POST to resolve names.',
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
'Method not allowed. Use POST to resolve names.',
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
'Method not allowed. Use POST to resolve names.',
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
