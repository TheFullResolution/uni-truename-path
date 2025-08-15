// TrueNamePath: Batch Name Resolution API Route
// GET /api/names/resolve/batch/[userId] - Batch name resolution endpoint
// Date: August 15, 2025
// Academic project REST API with authentication and validation

import { NextRequest } from 'next/server';
import {
  TrueNameContextEngine,
  type ResolutionSource,
} from '../../../../../../lib/context-engine/TrueNameContextEngine';
import {
  withOptionalAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../../../../lib/api/with-auth';
import { ErrorCodes } from '../../../../../../lib/api/types';
import { z } from 'zod';

/**
 * Query validation schema for batch resolution
 */
const BatchResolveQuerySchema = z.object({
  contexts: z
.string()
.min(1, 'Contexts parameter is required')
.transform((str) => str.split(',').filter(Boolean))
.refine((arr) => arr.length > 0, 'At least one context is required'),
});

/**
 * Single resolution result interface
 */
interface BatchResolutionItem {
  context: string;
  resolvedName: string;
  source: ResolutionSource;
  responseTimeMs: number;
  error?: string;
}

/**
 * Batch resolution response interface
 */
interface BatchResolutionData {
  userId: string;
  resolutions: BatchResolutionItem[];
  totalContexts: number;
  successfulResolutions: number;
  batchTimeMs: number;
  timestamp: string;
}

/**
 * Core handler function implementing batch name resolution logic
 */
const handleBatchResolveRequest: AuthenticatedHandler<
  BatchResolutionData
> = async (request: NextRequest, context) => {
  const { pathname } = new URL(request.url);
  const userId = pathname.split('/').pop();

  if (!userId) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'User ID is required',
  context.requestId,
  'User ID must be provided in the URL path',
  context.timestamp,
);
  }

  // Validate UUID format
  const uuidRegex =
/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid user ID format',
  context.requestId,
  'User ID must be a valid UUID',
  context.timestamp,
);
  }

  // Parse query parameters
  const url = new URL(request.url);
  const queryParams = {
contexts: url.searchParams.get('contexts'),
  };

  // Validate query parameters
  const validationResult = BatchResolveQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid query parameters',
  context.requestId,
  validationResult.error.issues.map((err) => ({
field: err.path.join('.'),
message: err.message,
code: err.code,
  })),
  context.timestamp,
);
  }

  const { contexts } = validationResult.data;
  const batchStartTime = Date.now();

  // Initialize context engine
  const contextEngine = new TrueNameContextEngine();

  // Process each context resolution
  const resolutions: BatchResolutionItem[] = [];
  let successfulResolutions = 0;

  for (const contextName of contexts) {
const resolutionStartTime = Date.now();

try {
  const nameResolution = await contextEngine.resolveName({
targetUserId: userId,
requesterUserId: context.user?.id || undefined,
contextName: contextName.trim(),
  });

  const responseTimeMs = Date.now() - resolutionStartTime;

  resolutions.push({
context: contextName.trim(),
resolvedName: nameResolution.name,
source: nameResolution.source,
responseTimeMs,
  });

  successfulResolutions++;
} catch (error) {
  const responseTimeMs = Date.now() - resolutionStartTime;
  const errorMessage =
error instanceof Error ? error.message : 'Unknown error';

  resolutions.push({
context: contextName.trim(),
resolvedName: 'Error resolving name',
source: 'error_fallback',
responseTimeMs,
error: errorMessage,
  });
}
  }

  const batchTimeMs = Date.now() - batchStartTime;

  // Success response with comprehensive batch metadata
  const responseData: BatchResolutionData = {
userId,
resolutions,
totalContexts: contexts.length,
successfulResolutions,
batchTimeMs,
timestamp: new Date().toISOString(),
  };

  console.log(`Batch Resolution [${context.requestId}]:`, {
userId: userId.substring(0, 8) + '...',
contexts: contexts.length,
successful: successfulResolutions,
batchTimeMs,
authenticated: context.isAuthenticated ? 'yes' : 'no',
  });

  return createSuccessResponse(
responseData,
context.requestId,
context.timestamp,
  );
};

/**
 * GET /api/names/resolve/batch/[userId]
 *
 * Batch name resolution endpoint for multiple contexts at once.
 * Optimized for dashboard preview components that need to show
 * name resolution across multiple contexts simultaneously.
 *
 * Query Parameters:
 * - contexts: Comma-separated list of context names to resolve
 *
 * Features:
 * - Optional JWT authentication (demo mode compatible)
 * - Comprehensive input validation with Zod
 * - Individual resolution timing and error handling
 * - Batch performance metrics
 * - Academic-quality response metadata
 * - JSend format compliance
 */
export const GET = withOptionalAuth(handleBatchResolveRequest, {
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
'Method not allowed. Use GET for batch name resolution.',
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
'Method not allowed. Use GET for batch name resolution.',
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
'Method not allowed. Use GET for batch name resolution.',
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
'Method not allowed. Use GET for batch name resolution.',
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
