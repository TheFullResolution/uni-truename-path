import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedContext,
} from '@/utils/api/with-auth';
import { ErrorCodes, StandardResponse } from '@/utils/api/types';
import { OAuthAuthorizeRequestSchema, OAuthAuthorizeRequest } from './schemas';
import { OAuthAuthorizeResponseData, AuthorizeErrorCodes } from './types';
import { createCORSOptionsResponse } from '@/utils/api/cors';
import { trackOAuthAuthorization } from '@/utils/analytics';

interface ClientData {
  client_id: string;
  app_name: string;
  display_name: string;
  publisher_domain: string;
}

interface ContextData {
  id: string;
  context_name: string;
  user_id: string;
}

async function validateAuthorizationRequest(
  request: NextRequest,
): Promise<
  | { success: true; data: OAuthAuthorizeRequest }
  | { success: false; error: unknown }
> {
  const body = await request.json().catch(() => null);
  const validation = OAuthAuthorizeRequestSchema.safeParse(body);

  if (!validation.success) {
return { success: false, error: validation.error };
  }

  return { success: true, data: validation.data };
}

async function verifyClientRegistry(
  supabase: AuthenticatedContext['supabase'],
  clientId: string,
): Promise<
  { success: true; client: ClientData } | { success: false; error: string }
> {
  const { data: client, error } = await supabase
.from('oauth_client_registry')
.select('client_id, app_name, display_name, publisher_domain')
.eq('client_id', clientId)
.single();

  if (error || !client) {
return { success: false, error: 'OAuth client not found in registry' };
  }

  return { success: true, client };
}

async function verifyUserContext(
  supabase: AuthenticatedContext['supabase'],
  contextId: string,
  userId: string,
): Promise<
  { success: true; context: ContextData } | { success: false; error: string }
> {
  const { data: context, error } = await supabase
.from('user_contexts')
.select('id, context_name, user_id')
.eq('id', contextId)
.eq('user_id', userId)
.single();

  if (error || !context) {
return { success: false, error: 'Context not found or access denied' };
  }

  return { success: true, context };
}
async function generateSessionToken(
  supabase: AuthenticatedContext['supabase'],
): Promise<
  { success: true; token: string } | { success: false; error: string }
> {
  const { data: tokenData, error } = await supabase
.rpc('generate_oauth_token')
.single();

  if (error || !tokenData) {
console.error('Token generation failed:', error);
return { success: false, error: 'Failed to generate session token' };
  }

  return { success: true, token: tokenData };
}

async function createSessionRecord(
  supabase: AuthenticatedContext['supabase'],
  userId: string,
  clientId: string,
  sessionToken: string,
  expiresAt: string,
  returnUrl: string,
  state?: string,
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  const sessionData = {
profile_id: userId,
client_id: clientId,
session_token: sessionToken,
expires_at: expiresAt,
return_url: returnUrl,
state,
  };

  const { data, error } = await supabase
.from('oauth_sessions')
.insert(sessionData)
.select('id')
.single();

  if (error || !data) {
console.error('Failed to create OAuth session:', error);
return { success: false, error: 'Failed to create OAuth session' };
  }

  return { success: true, sessionId: data.id };
}

async function createAuthorizationSession(
  supabase: AuthenticatedContext['supabase'],
  userId: string,
  clientId: string,
  contextId: string,
  returnUrl: string,
  state?: string,
): Promise<
  | {
  success: true;
  sessionToken: string;
  sessionId: string;
  expiresAt: string;
}
  | { success: false; error: string }
> {
  const { error: assignError } = await supabase
.from('app_context_assignments')
.upsert(
  {
profile_id: userId,
client_id: clientId,
context_id: contextId,
updated_at: new Date().toISOString(),
  },
  { onConflict: 'profile_id,client_id' },
);

  if (assignError) {
console.error('Context assignment failed:', assignError);
return { success: false, error: 'Failed to assign context to client' };
  }

  const tokenResult = await generateSessionToken(supabase);
  if (!tokenResult.success) return { success: false, error: tokenResult.error };

  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const recordResult = await createSessionRecord(
supabase,
userId,
clientId,
tokenResult.token,
expiresAt,
returnUrl,
state,
  );
  if (!recordResult.success || !recordResult.sessionId)
return { success: false, error: recordResult.error! };

  return {
success: true,
sessionToken: tokenResult.token,
sessionId: recordResult.sessionId,
expiresAt,
  };
}

function buildAuthorizationResponse(
  sessionToken: string,
  expiresAt: string,
  returnUrl: string,
  client: ClientData,
  context: ContextData,
  state?: string,
): OAuthAuthorizeResponseData {
  let redirectUrl = `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}token=${sessionToken}`;
  if (state) redirectUrl += `&state=${encodeURIComponent(state)}`;

  return {
session_token: sessionToken,
expires_at: expiresAt,
redirect_url: redirectUrl,
client: {
  client_id: client.client_id,
  display_name: client.display_name,
  publisher_domain: client.publisher_domain,
},
context: {
  id: context.id,
  context_name: context.context_name,
},
  };
}

/**
 * POST /api/oauth/authorize - OAuth session token generation
 */
async function handleAuthorize(
  request: NextRequest,
  { user, supabase, requestId, timestamp }: AuthenticatedContext,
): Promise<StandardResponse<OAuthAuthorizeResponseData>> {
  if (!user?.id) {
return createErrorResponse(
  ErrorCodes.AUTHENTICATION_REQUIRED,
  'User authentication required',
  requestId,
  undefined,
  timestamp,
);
  }

  try {
const validationResult = await validateAuthorizationRequest(request);
if (!validationResult.success) {
  const validationError = validationResult.error as {
issues: Array<{
  path?: (string | number)[];
  message?: string;
  code?: string;
}>;
  };
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid authorization request parameters',
requestId,
validationError.issues.map((err) => ({
  field: err.path?.join?.('.') || 'unknown',
  message: err.message || 'Validation error',
  code: err.code || 'invalid_input',
})),
timestamp,
  );
}

const { client_id, context_id, return_url, state } = validationResult.data;

const clientResult = await verifyClientRegistry(supabase, client_id);
if (!clientResult.success) {
  return createErrorResponse(
AuthorizeErrorCodes.CLIENT_NOT_FOUND,
clientResult.error,
requestId,
undefined,
timestamp,
  );
}

const contextResult = await verifyUserContext(
  supabase,
  context_id,
  user.id,
);
if (!contextResult.success) {
  return createErrorResponse(
AuthorizeErrorCodes.CONTEXT_NOT_FOUND,
contextResult.error,
requestId,
undefined,
timestamp,
  );
}

const sessionResult = await createAuthorizationSession(
  supabase,
  user.id,
  client_id,
  context_id,
  return_url,
  state,
);
if (!sessionResult.success) {
  return createErrorResponse(
ErrorCodes.INTERNAL_ERROR,
sessionResult.error,
requestId,
undefined,
timestamp,
  );
}

const startTime = Date.now();
await trackOAuthAuthorization(
  supabase,
  user.id,
  client_id,
  context_id,
  sessionResult.sessionId,
  Date.now() - startTime,
);

const responseData = buildAuthorizationResponse(
  sessionResult.sessionToken,
  sessionResult.expiresAt,
  return_url,
  clientResult.client,
  contextResult.context,
  state,
);

return createSuccessResponse(responseData, requestId, timestamp);
  } catch (error) {
console.error('OAuth authorization failed:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'OAuth authorization failed',
  requestId,
  undefined,
  timestamp,
);
  }
}

export const POST = withRequiredAuth(handleAuthorize);

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(): Promise<Response> {
  return createCORSOptionsResponse('POST, OPTIONS');
}
