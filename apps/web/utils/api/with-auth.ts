// API Route Authentication HOF

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/generated/database';
import { type AuthenticatedUser, createClientWithToken } from '../auth/server';
import {
  type StandardSuccessResponse,
  type StandardErrorResponse,
  type StandardResponse,
  type ErrorCode,
  getStatusCode,
} from './types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { classifyRoute, RouteSecurityLevel } from './route-security-classifier';
import { withCORSHeaders } from './cors';

export type AuthMode = 'required' | 'optional';
export interface AuthenticatedContext {
  user: AuthenticatedUser | null;
  requestId: string;
  timestamp: string;
  isAuthenticated: boolean;
  supabase: SupabaseClient<Database>;
  isOAuth: boolean;
  oauthSession?: {
id: string;
clientId: string;
sessionId: string;
appName: string;
  };
}

export type AuthenticatedHandler<T = unknown> = (
  request: NextRequest,
  context: AuthenticatedContext,
) => Promise<StandardResponse<T>>;

export interface WithAuthOptions {
  authMode: AuthMode;
  onAuthError?: (
error: { code: string; message: string },
requestId: string,
  ) => StandardErrorResponse;
  enableLogging?: boolean;
}
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Higher-order function that wraps API route handlers with authentication
 */
export function withAuth<T = unknown>(
  handler: AuthenticatedHandler<T>,
  options: WithAuthOptions,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
const requestId = generateRequestId();
const timestamp = new Date().toISOString();

try {
  const authVerified =
request.headers.get('x-authentication-verified') === 'true';
  const userId = request.headers.get('x-authenticated-user-id') || '';

  const isOAuthAuth =
request.headers.get('x-oauth-authenticated') === 'true';
  const oauthSessionId = request.headers.get('x-oauth-session-id') || '';
  const oauthClientId = request.headers.get('x-oauth-client-id') || '';

  const userEmail = request.headers.get('x-authenticated-user-email') || '';
  const userProfileHeader = request.headers.get(
'x-authenticated-user-profile',
  );

  let user: AuthenticatedUser | null = null;
  let oauthSession = undefined;

  if (authVerified && userId) {
if (isOAuthAuth && oauthSessionId && oauthClientId) {
  let appName = oauthClientId;

  if (userEmail) {
user = buildInternalAuthContext(
  userId,
  userEmail,
  userProfileHeader,
);
if (
  user?.profile &&
  typeof user.profile === 'object' &&
  'app_name' in user.profile
) {
  appName =
(user.profile as { app_name?: string }).app_name ||
oauthClientId;
}
  } else {
const oauthContext = await buildOAuthAuthContext(
  userId,
  oauthSessionId,
  oauthClientId,
);
user = oauthContext.user;
appName = oauthContext.appName;
  }

  oauthSession = {
id: oauthSessionId,
clientId: oauthClientId,
sessionId: oauthSessionId,
appName,
  };
} else if (userEmail) {
  user = buildInternalAuthContext(userId, userEmail, userProfileHeader);
} else {
  user = {
id: userId,
email: '',
profile: undefined,
  };
}
  }

  if (options.authMode === 'required') {
if (!authVerified || !user) {
  const errorResponse = createErrorResponse(
'AUTHENTICATION_REQUIRED',
'Authentication required',
requestId,
undefined,
timestamp,
  );

  const finalError = options.onAuthError
? options.onAuthError(
{
  code: 'AUTHENTICATION_REQUIRED',
  message: 'Authentication required',
},
requestId,
  )
: errorResponse;

  console.error(
`Authentication failed [${requestId}]: ${finalError.error.code}`,
  );
  const securityLevel = classifyRoute(new URL(request.url).pathname);
  const errorHeaders = {
'Content-Type': 'application/json',
'X-Request-ID': requestId,
  };

  const headers =
securityLevel === RouteSecurityLevel.OAUTH_PUBLIC
  ? withCORSHeaders(errorHeaders)
  : errorHeaders;

  return NextResponse.json(finalError, {
status: 401,
headers,
  });
}
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : undefined;

  const authenticatedClient = await createClientWithToken(token);

  const context: AuthenticatedContext = {
user,
requestId,
timestamp,
isAuthenticated: authVerified && !!user,
supabase: authenticatedClient,
isOAuth: isOAuthAuth,
oauthSession,
  };

  const result = await handler(request, context);

  let statusCode = 200;
  if (!result.success) {
const errorResult = result as StandardErrorResponse;
statusCode = getStatusCode(errorResult.error.code as ErrorCode);
  }
  const securityLevel = classifyRoute(new URL(request.url).pathname);
  const baseHeaders = {
'Content-Type': 'application/json',
'Cache-Control': 'no-cache, no-store, must-revalidate',
'X-Request-ID': requestId,
  };

  const headers =
securityLevel === RouteSecurityLevel.OAUTH_PUBLIC
  ? withCORSHeaders(baseHeaders)
  : baseHeaders;

  return NextResponse.json(result, {
status: statusCode,
headers,
  });
} catch (error) {
  console.error(
`API Error [${requestId}]:`,
error instanceof Error ? error.message : 'Unknown error',
  );

  const errorResponse = createErrorResponse(
'INTERNAL_SERVER_ERROR',
'Internal server error occurred',
requestId,
process.env.NODE_ENV === 'development'
  ? {
  message: error instanceof Error ? error.message : 'Unknown error',
}
  : undefined,
timestamp,
  );
  const securityLevel = classifyRoute(new URL(request.url).pathname);
  const errorHeaders = {
'Content-Type': 'application/json',
'X-Request-ID': requestId,
  };

  const headers =
securityLevel === RouteSecurityLevel.OAUTH_PUBLIC
  ? withCORSHeaders(errorHeaders)
  : errorHeaders;

  return NextResponse.json(errorResponse, {
status: 500,
headers,
  });
}
  };
}

export function withRequiredAuth<T = unknown>(
  handler: AuthenticatedHandler<T>,
  options?: Omit<WithAuthOptions, 'authMode'>,
): (request: NextRequest) => Promise<NextResponse> {
  return withAuth(handler, { ...options, authMode: 'required' });
}

export function withOptionalAuth<T = unknown>(
  handler: AuthenticatedHandler<T>,
  options?: Omit<WithAuthOptions, 'authMode'>,
): (request: NextRequest) => Promise<NextResponse> {
  return withAuth(handler, { ...options, authMode: 'optional' });
}

export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  timestamp?: string,
): StandardSuccessResponse<T> {
  return {
success: true,
data,
requestId,
timestamp: timestamp || new Date().toISOString(),
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
  timestamp?: string,
): StandardErrorResponse {
  return {
success: false,
requestId,
timestamp: timestamp || new Date().toISOString(),
error: {
  code,
  message,
  details,
  requestId,
  timestamp: timestamp || new Date().toISOString(),
},
  };
}
export function handle_method_not_allowed(allowed_methods: string[]): Response {
  const request_id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const error_response = createErrorResponse(
'METHOD_NOT_ALLOWED',
`Method not allowed. Use ${allowed_methods.join(' or ')} for this endpoint.`,
request_id,
{ allowed_methods },
timestamp,
  );

  return new Response(JSON.stringify(error_response), {
status: 405,
headers: {
  'Allow': allowed_methods.join(', '),
  'Content-Type': 'application/json',
  'X-Request-ID': request_id,
},
  });
}

export function validate_uuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
id,
  );
}
async function buildOAuthAuthContext(
  userId: string,
  sessionId: string,
  clientId: string,
): Promise<{ user: AuthenticatedUser; appName: string }> {
  try {
const supabase = await import('../supabase/server').then((m) =>
  m.createClient(),
);

const { data: sessionData } = await supabase
  .from('oauth_sessions')
  .select(
`
id,
client_id,
oauth_client_registry!inner(
  client_id,
  app_name,
  display_name
)
  `,
  )
  .eq('id', sessionId)
  .eq('profile_id', userId)
  .single();

const user: AuthenticatedUser = {
  id: userId,
  email: '',
  profile: undefined,
};

const registry = sessionData?.oauth_client_registry;
const appName =
  registry && typeof registry === 'object' && 'display_name' in registry
? (registry as { display_name: string }).display_name
: clientId;

return { user, appName };
  } catch (error) {
console.warn('Failed to build OAuth context:', error);
return {
  user: {
id: userId,
email: '',
profile: undefined,
  },
  appName: clientId,
};
  }
}
function buildInternalAuthContext(
  userId: string,
  userEmail: string,
  profileHeader: string | null,
): AuthenticatedUser {
  let profile = undefined;
  if (profileHeader) {
try {
  profile = JSON.parse(profileHeader);
} catch (error) {
  console.warn(
'Failed to parse user profile from middleware header:',
error,
  );
}
  }

  return {
id: userId,
email: userEmail,
profile,
  };
}
