/**
 * OAuth Resolve Endpoint - Bearer Token to OIDC Claims Resolution
 * University Final Project - TrueNamePath
 *
 * @route POST /api/oauth/resolve
 * @description Exchanges OAuth Bearer tokens for full OIDC claims objects with context-aware name resolution
 * @authentication Bearer token required (Authorization: Bearer tnp_xxx)
 * @performance <3ms average response time
 * @analytics Logs all requests to app_usage_log table
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Call resolve_oauth_oidc_claims database function
 * 3. Handle success/error responses with appropriate analytics
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

import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/utils/api/with-auth';
import {
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedContext,
} from '@/utils/api/with-auth';
import { extractBearerToken } from '@/utils/api/oauth-helpers';
import { ErrorCodes } from '@/utils/api/types';
import { ResolveErrorCodes, OIDCClaims } from './types';
import {
  measurePerformance,
  extractSessionDataFromClaims,
  logOAuthUsage,
  mapErrorToAnalyticsType,
} from './helpers';

async function handleResolve(
  request: NextRequest,
  { supabase, requestId, timestamp }: AuthenticatedContext,
) {
  const perf = measurePerformance();
  const sessionToken = extractBearerToken(request.headers.get('authorization'));
  if (!sessionToken) {
return createErrorResponse(
  ErrorCodes.AUTHENTICATION_REQUIRED,
  'Valid Bearer token required (Authorization: Bearer tnp_xxx)',
  requestId,
  undefined,
  timestamp,
);
  }

  try {
const { data: claimsResult, error } = await supabase
  .rpc('resolve_oauth_oidc_claims', { p_session_token: sessionToken })
  .single();

if (error || !claimsResult) {
  await logOAuthUsage(
supabase,
null,
sessionToken,
false,
perf.getElapsed(),
'server_error',
  );
  return createErrorResponse(
ResolveErrorCodes.RESOLUTION_FAILED,
'Failed to resolve OIDC claims',
requestId,
{ database_error: error?.message },
timestamp,
  );
}

if (
  typeof claimsResult === 'object' &&
  claimsResult !== null &&
  'error' in claimsResult
) {
  const errorResult = claimsResult as { error: string; message?: string };
  const errorCode =
errorResult.error === 'invalid_token'
  ? ResolveErrorCodes.INVALID_TOKEN
  : errorResult.error === 'no_context_assigned'
? ResolveErrorCodes.NO_CONTEXT_ASSIGNED
: ResolveErrorCodes.RESOLUTION_FAILED;
  await logOAuthUsage(
supabase,
null,
sessionToken,
false,
perf.getElapsed(),
mapErrorToAnalyticsType(errorResult),
  );
  return createErrorResponse(
errorCode,
errorResult.message || 'Token resolution failed',
requestId,
undefined,
timestamp,
  );
}

const sessionData = extractSessionDataFromClaims(
  claimsResult,
  sessionToken,
);
const responseTime = perf.getElapsed();
await logOAuthUsage(
  supabase,
  sessionData,
  sessionToken,
  true,
  responseTime,
);

return createSuccessResponse(
  {
claims: claimsResult as unknown as OIDCClaims,
resolved_at: timestamp,
performance: { response_time_ms: responseTime },
  },
  requestId,
  timestamp,
);
  } catch {
await logOAuthUsage(
  supabase,
  null,
  sessionToken,
  false,
  perf.getElapsed(),
  'server_error',
);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'OIDC resolution failed',
  requestId,
  undefined,
  timestamp,
);
  }
}

// Export POST handler with optional auth for OAUTH_PUBLIC security level
export const POST = withOptionalAuth(handleResolve);
