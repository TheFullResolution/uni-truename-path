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
} from '@/utils/api/with-auth';
import { ErrorCodes, StandardResponse } from '@/utils/api/types';
import { OAuthAuthorizeRequestSchema } from './schemas';
import { OAuthAuthorizeResponseData, AuthorizeErrorCodes } from './types';

/**
 * POST /api/oauth/authorize
 *
 * Generates OAuth session tokens with context assignment for external applications.
 * This is the core OAuth authorization endpoint that validates app/context access
 * and creates authenticated sessions for third-party integrations.
 *
 * Flow:
 * 1. Validate request body (app_id, context_id, return_url)
 * 2. Verify app exists and is active
 * 3. Verify user owns the context
 * 4. Assign context to app using database function
 * 5. Generate session token and create oauth_sessions record
 * 6. Return token with redirect URL
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

  // Parse and validate request body
  const body = await request.json().catch(() => null);
  const validation = OAuthAuthorizeRequestSchema.safeParse(body);

  if (!validation.success) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid authorization request parameters',
  requestId,
  validation.error.issues.map((err) => ({
field: err.path?.join?.('.') || 'unknown',
message: err.message || 'Validation error',
code: err.code || 'invalid_input',
  })),
  timestamp,
);
  }

  const { app_id, context_id, return_url } = validation.data;

  try {
// Step 1: Verify app exists and is active
const { data: app, error: appError } = await supabase
  .from('oauth_applications')
  .select('id, app_name, display_name, is_active')
  .eq('id', app_id)
  .eq('is_active', true)
  .single();

if (appError || !app) {
  return createErrorResponse(
AuthorizeErrorCodes.APP_NOT_FOUND,
'OAuth application not found or inactive',
requestId,
undefined,
timestamp,
  );
}

// Step 2: Verify user owns the context
const { data: context, error: contextError } = await supabase
  .from('user_contexts')
  .select('id, context_name, user_id')
  .eq('id', context_id)
  .eq('user_id', user.id)
  .single();

if (contextError || !context) {
  return createErrorResponse(
AuthorizeErrorCodes.CONTEXT_NOT_FOUND,
'Context not found or access denied',
requestId,
undefined,
timestamp,
  );
}

// Step 3: Assign default context to app
const { error: assignError } = await supabase.rpc(
  'assign_default_context_to_app',
  {
p_profile_id: user.id,
p_app_id: app_id,
  },
);

if (assignError) {
  console.error('Context assignment failed:', assignError);
  return createErrorResponse(
ErrorCodes.INTERNAL_ERROR,
'Failed to assign context to application',
requestId,
undefined,
timestamp,
  );
}

// Step 4: Generate session token
const { data: tokenData, error: tokenError } = await supabase
  .rpc('generate_oauth_token')
  .single();

if (tokenError || !tokenData) {
  console.error('Token generation failed:', tokenError);
  return createErrorResponse(
AuthorizeErrorCodes.TOKEN_GENERATION_FAILED,
'Failed to generate session token',
requestId,
undefined,
timestamp,
  );
}

// Step 5: Create OAuth session record
const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
const { error: sessionError } = await supabase
  .from('oauth_sessions')
  .insert({
profile_id: user.id,
app_id: app_id,
session_token: tokenData,
expires_at: expiresAt,
return_url: return_url,
  });

if (sessionError) {
  console.error('Session creation failed:', sessionError);
  return createErrorResponse(
AuthorizeErrorCodes.SESSION_CREATION_FAILED,
'Failed to create OAuth session',
requestId,
undefined,
timestamp,
  );
}

// Step 6: Build redirect URL with token
const redirectUrl = `${return_url}${return_url.includes('?') ? '&' : '?'}token=${tokenData}`;

const responseData: OAuthAuthorizeResponseData = {
  session_token: tokenData,
  expires_at: expiresAt,
  redirect_url: redirectUrl,
  app: {
id: app.id,
display_name: app.display_name,
  },
  context: {
id: context.id,
context_name: context.context_name,
  },
};

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
