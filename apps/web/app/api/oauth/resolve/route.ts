// OAuth Resolve Endpoint

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
// NOTE: OAuth resolve tracking is now handled by database triggers

async function handleResolve(request: NextRequest) {
  // Start performance measurement (trigger-based logging will handle correlation)
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

// NOTE: OAuth resolve events are now automatically logged via database trigger
// when oauth_sessions.used_at is updated from NULL to timestamp. No manual logging needed.

const claims = claimsResult as unknown as OIDCClaims;

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

export const POST = handleResolve;

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
 */
export async function OPTIONS(): Promise<Response> {
  return createCORSOptionsResponse('POST, OPTIONS');
}
