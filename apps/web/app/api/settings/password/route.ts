import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  type AuthenticatedHandler,
  ErrorCodes,
} from '@/utils/api';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/generated/database';

import { newPasswordOnlySchema } from '@/utils/validation/password';

// Constants
const SYSTEM_CLIENT_ID = 'tnp_system_settings';
const ACTION_PASSWORD_CHANGE = 'password_change';

// Helper function to log audit events
const logPasswordChangeAttempt = async (
  supabase: SupabaseClient<Database>,
  profileId: string,
  success: boolean,
  responseTimeMs: number,
) => {
  await supabase.rpc('log_app_usage', {
p_profile_id: profileId,
p_client_id: SYSTEM_CLIENT_ID,
p_action: ACTION_PASSWORD_CHANGE,
p_session_id: undefined,
p_response_time_ms: responseTimeMs,
p_success: success,
  });
};

const handlePost: AuthenticatedHandler = async (request, context) => {
  const startTime = performance.now();
  let validationSuccess = false;

  try {
// Parse and validate request body
const body = newPasswordOnlySchema.parse(await request.json());
validationSuccess = true;

// Update password directly (user is already authenticated)
const { error: updateError } = await context.supabase.auth.updateUser({
  password: body.new_password,
});

if (updateError) {
  const responseTime = Math.round(performance.now() - startTime);
  await logPasswordChangeAttempt(
context.supabase,
context.user!.id,
false,
responseTime,
  );

  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to update password',
context.requestId,
'Please try again or contact support if the problem persists',
context.timestamp,
  );
}

// Log successful password change
const responseTime = Math.round(performance.now() - startTime);
await logPasswordChangeAttempt(
  context.supabase,
  context.user!.id,
  true,
  responseTime,
);

return createSuccessResponse(
  { message: 'Password updated successfully' },
  context.requestId,
  context.timestamp,
);
  } catch (error) {
const responseTime = Math.round(performance.now() - startTime);

// Determine appropriate error code based on what failed
let errorCode: string;
let message: string;
let details: string | undefined;

if (!validationSuccess && error instanceof z.ZodError) {
  errorCode = ErrorCodes.VALIDATION_ERROR;
  message = 'Password requirements not met';
  details = error.issues
.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
.join(', ');
} else {
  errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
  message = 'An unexpected error occurred';
  details = error instanceof Error ? error.message : String(error);
}

// Log failed password change attempt
await logPasswordChangeAttempt(
  context.supabase,
  context.user!.id,
  false,
  responseTime,
);

return createErrorResponse(
  errorCode,
  message,
  context.requestId,
  details,
  context.timestamp,
);
  }
};

export const POST = withRequiredAuth(handlePost);
export const GET = () => handle_method_not_allowed(['POST']);
export const PUT = () => handle_method_not_allowed(['POST']);
export const DELETE = () => handle_method_not_allowed(['POST']);
export const PATCH = () => handle_method_not_allowed(['POST']);
