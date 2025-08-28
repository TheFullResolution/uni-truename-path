/**
 * OAuth Resolve Endpoint - Bearer Token to OIDC Claims Resolution
 * University Final Project - TrueNamePath
 *
 * @route POST /api/oauth/resolve
 * @description Exchanges OAuth Bearer tokens for full OIDC claims objects with context-aware name resolution
 * @authentication Bearer token required (Authorization: Bearer tnp_xxx)
 * @performance <3ms average response time
 * @analytics Database triggers handle all usage logging automatically
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Call resolve_oauth_oidc_claims database function
 * 3. Handle success/error responses (analytics logged via database triggers)
 * 4. Return OIDC-compliant claims object with resolved names
 *
 * @example
 * ```typescript
 * POST /api/oauth/resolve
 * Authorization: Bearer tnp_abc123...
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 * "claims": {
 *   "sub": "user-id",
 *   "name": "Professional Name",
 *   "given_name": "John",
 *   "family_name": "Smith",
 *   "nickname": "Johnny",
 *   "iss": "https://api.truename.app",
 *   "aud": "my-app",
 *   "iat": 1692801330,
 *   "context_name": "Work Colleagues",
 *   "app_name": "my-app"
 * },
 * "resolved_at": "2025-08-23T10:15:30.123Z"
 *   }
 * }
 * ```
 *
 * Academic constraint: Handler ≤50 lines
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/utils/api/with-auth';
import { extractBearerToken } from '@/utils/api/oauth-helpers';
import { ErrorCodes } from '@/utils/api/types';
import { ResolveErrorCodes, OIDCClaims } from './types';
import { measurePerformance } from './helpers';
import { createCORSOptionsResponse, withCORSHeaders } from '@/utils/api/cors';

async function handleResolve(request: NextRequest) {
  const perf = measurePerformance();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  const timestamp = new Date().toISOString();
  const supabase = await createClient();

  const sessionToken = extractBearerToken(request.headers.get('authorization'));
  if (!sessionToken) {
return NextResponse.json(
  createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'Valid Bearer token required (Authorization: Bearer tnp_xxx)',
requestId,
undefined,
timestamp,
  ),
  {
status: 401,
headers: withCORSHeaders(),
  },
);
  }

  try {
const { data: claimsResult, error } = await supabase
  .rpc('resolve_oauth_oidc_claims', { p_session_token: sessionToken })
  .single();

if (error || !claimsResult) {
  return NextResponse.json(
createErrorResponse(
  ResolveErrorCodes.RESOLUTION_FAILED,
  'Failed to resolve OIDC claims',
  requestId,
  { database_error: error?.message },
  timestamp,
),
{
  status: 500,
  headers: withCORSHeaders(),
},
  );
}

if (typeof claimsResult === 'object' && 'error' in claimsResult) {
  const errorResult = claimsResult as { error: string; message?: string };
  const errorCode =
errorResult.error === 'invalid_token'
  ? ResolveErrorCodes.INVALID_TOKEN
  : errorResult.error === 'no_context_assigned'
? ResolveErrorCodes.NO_CONTEXT_ASSIGNED
: ResolveErrorCodes.RESOLUTION_FAILED;
  return NextResponse.json(
createErrorResponse(
  errorCode,
  errorResult.message || 'Token resolution failed',
  requestId,
  undefined,
  timestamp,
),
{
  status: errorCode === ResolveErrorCodes.INVALID_TOKEN ? 401 : 400,
  headers: withCORSHeaders(),
},
  );
}

const responseTime = perf.getElapsed();
return NextResponse.json(
  createSuccessResponse(
{
  claims: claimsResult as unknown as OIDCClaims,
  resolved_at: timestamp,
  performance: { response_time_ms: responseTime },
},
requestId,
timestamp,
  ),
  {
status: 200,
headers: withCORSHeaders(),
  },
);
  } catch {
return NextResponse.json(
  createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'OIDC resolution failed',
requestId,
undefined,
timestamp,
  ),
  {
status: 500,
headers: withCORSHeaders(),
  },
);
  }
}

// Export POST handler directly (handles custom OAuth token authentication)
export const POST = handleResolve;

// Handle unsupported HTTP methods
export const GET = () =>
  new Response(JSON.stringify({ error: 'Method not allowed' }), {
status: 405,
headers: withCORSHeaders(),
  });
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;

/**
 * OPTIONS handler for CORS preflight requests
 * Required for cross-origin requests from demo-hr app
 */
export async function OPTIONS(): Promise<Response> {
  return createCORSOptionsResponse('POST, OPTIONS');
}
