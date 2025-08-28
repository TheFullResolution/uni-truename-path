// TrueNamePath: OAuth Authorization Endpoint Handler
// POST /api/oauth/authorize - Generate OAuth session tokens with context assignment
// Date: August 23, 2025
// Academic project - Core OAuth authorization flow implementation

import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedContext,
  handle_method_not_allowed,
} from '@/utils/api/with-auth';
import { ErrorCodes, StandardResponse } from '@/utils/api/types';
import { OAuthAuthorizeRequestSchema, OAuthAuthorizeRequest } from './schemas';
import { OAuthAuthorizeResponseData, AuthorizeErrorCodes } from './types';
import { createCORSOptionsResponse } from '@/utils/api/cors';

// =============================================================================
// Helper Function Types
// =============================================================================

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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse and validate authorization request body
 */
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

/**
 * Verify client exists in OAuth client registry
 */
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

/**
 * Verify user owns the specified context
 */
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

/**
 * Assign default context to client
 */
async function assignContextToClient(
  supabase: AuthenticatedContext['supabase'],
  userId: string,
  clientId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('assign_default_context_to_app', {
p_profile_id: userId,
p_client_id: clientId,
  });

  if (error) {
// Check if the error is due to missing default context
if (
  error.code === '23503' &&
  error.message?.includes('No default context found')
) {
  // Try to create a default context for the user
  const { error: createError } = await supabase
.from('user_contexts')
.insert({
  user_id: userId,
  context_name: 'Default',
  description: 'Default identity context created for OAuth integration',
  is_permanent: true,
  visibility: 'public',
});

  if (createError) {
console.error('Failed to create default context:', createError);
return {
  success: false,
  error: 'Failed to create default context for OAuth integration',
};
  }

  // Retry the context assignment with the newly created default context
  const { error: retryError } = await supabase.rpc(
'assign_default_context_to_app',
{
  p_profile_id: userId,
  p_client_id: clientId,
},
  );

  if (retryError) {
console.error('Context assignment retry failed:', retryError);
return {
  success: false,
  error:
'Failed to assign context to client after creating default context',
};
  }

  return { success: true };
}

return { success: false, error: 'Failed to assign context to client' };
  }

  return { success: true };
}

/**
 * Generate OAuth session token
 */
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

/**
 * Create OAuth session database record
 */
async function createSessionRecord(
  supabase: AuthenticatedContext['supabase'],
  userId: string,
  clientId: string,
  sessionToken: string,
  expiresAt: string,
  returnUrl: string,
  state?: string,
): Promise<{ success: boolean; error?: string }> {
  const sessionData = {
profile_id: userId,
client_id: clientId,
session_token: sessionToken,
expires_at: expiresAt,
return_url: returnUrl,
state,
  };

  const { error } = await supabase.from('oauth_sessions').insert(sessionData);

  if (error) {
console.error('Failed to create OAuth session:', error);
return { success: false, error: 'Failed to create OAuth session' };
  }

  return { success: true };
}

/**
 * Create complete OAuth authorization session
 */
async function createAuthorizationSession(
  supabase: AuthenticatedContext['supabase'],
  userId: string,
  clientId: string,
  returnUrl: string,
  state?: string,
): Promise<
  | { success: true; sessionToken: string; expiresAt: string }
  | { success: false; error: string }
> {
  const assignResult = await assignContextToClient(supabase, userId, clientId);
  if (!assignResult.success)
return { success: false, error: assignResult.error! };

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
  if (!recordResult.success)
return { success: false, error: recordResult.error! };

  return { success: true, sessionToken: tokenResult.token, expiresAt };
}

/**
 * Build final authorization response with redirect URL
 */
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
 * Create validation error response
 */
function createValidationError(
  validationError: {
issues: Array<{
  path?: (string | number)[];
  message?: string;
  code?: string;
}>;
  },
  requestId: string,
  timestamp: string,
): StandardResponse<OAuthAuthorizeResponseData> {
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

/**
 * Determine appropriate error code for session creation failures
 */
function getSessionErrorCode(error: string): string {
  return error.includes('assign')
? ErrorCodes.INTERNAL_ERROR
: error.includes('generate')
  ? AuthorizeErrorCodes.TOKEN_GENERATION_FAILED
  : AuthorizeErrorCodes.SESSION_CREATION_FAILED;
}

/**
 * POST /api/oauth/authorize
 *
 * Generates OAuth session tokens with context assignment for external applications.
 * Orchestrates helper functions for academic-compliant code organization.
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
// Step 1: Validate request
const validationResult = await validateAuthorizationRequest(request);
if (!validationResult.success) {
  return createValidationError(
validationResult.error as {
  issues: Array<{
path?: (string | number)[];
message?: string;
code?: string;
  }>;
},
requestId,
timestamp,
  );
}

const { client_id, context_id, return_url, state } = validationResult.data;

// Step 2: Verify client
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

// Step 3: Verify context
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

// Step 4: Create session
const sessionResult = await createAuthorizationSession(
  supabase,
  user.id,
  client_id,
  return_url,
  state,
);
if (!sessionResult.success) {
  return createErrorResponse(
getSessionErrorCode(sessionResult.error),
sessionResult.error,
requestId,
undefined,
timestamp,
  );
}

// Step 5: Build response
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

// Handle unsupported HTTP methods
export const GET = () => handle_method_not_allowed(['POST']);
export const PUT = () => handle_method_not_allowed(['POST']);
export const DELETE = () => handle_method_not_allowed(['POST']);
export const PATCH = () => handle_method_not_allowed(['POST']);

/**
 * OPTIONS handler for CORS preflight requests
 * Required for cross-origin requests from demo-hr app
 */
export async function OPTIONS(): Promise<Response> {
  return createCORSOptionsResponse('POST, OPTIONS');
}
