// TrueNamePath: Name Resolution API Route
// POST /api/names/resolve - Core name resolution endpoint
// Date: August 11, 2025
// Academic project REST API with authentication and validation

// TrueNamePath: Name Resolution API Route - JSend Compliant
import { NextRequest } from 'next/server';
import { TrueNameContextEngine } from '@/utils/context-engine/TrueNameContextEngine';
import type { ResolveNameData } from '../types';
import {
  withOptionalAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  type AuthenticatedHandler,
} from '@/utils/api';
import { ErrorCodes } from '@/utils/api';
import { z } from 'zod';

/**
 * Input validation schema with comprehensive validation rules
 */
const ResolveNameRequestSchema = z.object({
  target_user_id: z
.string()
.uuid('Target user ID must be a valid UUID')
.min(1, 'Target user ID is required'),

  requester_user_id: z
.string()
.uuid('Requester user ID must be a valid UUID')
.optional()
.nullable(),

  context_name: z
.string()
.min(1, 'Context name cannot be empty')
.max(100, 'Context name cannot exceed 100 characters')
.regex(/^[a-zA-Z0-9\s\-_]+$/, 'Context name contains invalid characters')
.optional()
.nullable(),
});

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
target_user_id: params.target_user_id,
requester_user_id: params.requester_user_id || undefined,
context_name: params.context_name || undefined,
  });

  // 4. Success response with comprehensive metadata
  const responseData: ResolveNameData = {
resolved_name: nameResolution.name,
source: nameResolution.source,
metadata: {
  context_id: nameResolution.metadata.context_id,
  context_name: nameResolution.metadata.context_name,
  consent_id: nameResolution.metadata.consent_id,
  processing_time_ms: nameResolution.metadata.response_time_ms,
},
  };

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
 * - Optional cookie-based session authentication (demo mode compatible)
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
 * Handle unsupported HTTP methods - shared utility eliminates boilerplate
 */
export const GET = () => handle_method_not_allowed(['POST']);
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;

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
