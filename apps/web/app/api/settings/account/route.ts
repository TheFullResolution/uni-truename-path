import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  type AuthenticatedHandler,
  ErrorCodes,
} from '@/utils/api';
import { z } from 'zod';

// Validation schema - require email confirmation
const deleteAccountSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

const handleDelete: AuthenticatedHandler = async (request, context) => {
  let validationSuccess = false;

  try {
// Parse and validate request body
const body = deleteAccountSchema.parse(await request.json());
validationSuccess = true;

// Call the database function to delete the user account
const { data, error } = await context.supabase.rpc('delete_user_account', {
  p_user_id: context.user!.id,
  p_email_confirmation: body.email,
});

if (error) {
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to delete account',
context.requestId,
'Please try again or contact support if the problem persists',
context.timestamp,
  );
}

// Parse the JSON response from the database function
const result = data as {
  success: boolean;
  error?: string;
  message: string;
  deleted_user_id?: string;
  deleted_email?: string;
  deleted_at?: string;
};

if (!result.success) {
  // Map database function errors to appropriate API responses
  let errorCode: string;
  let details: string | undefined;

  switch (result.error) {
case 'email_verification_failed':
  errorCode = ErrorCodes.VALIDATION_ERROR;
  details =
'Please enter your current email address to confirm account deletion';
  break;
case 'user_not_found':
  errorCode = ErrorCodes.NOT_FOUND;
  details = 'User account not found';
  break;
default:
  errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
  details = result.message;
  }

  return createErrorResponse(
errorCode,
result.message,
context.requestId,
details,
context.timestamp,
  );
}

// Account deletion successful - clear user session
await context.supabase.auth.signOut();

return createSuccessResponse(
  {
message: result.message,
deleted_at: result.deleted_at,
  },
  context.requestId,
  context.timestamp,
);
  } catch (error) {
// Determine appropriate error code based on what failed
let errorCode: string;
let message: string;
let details: string | undefined;

if (!validationSuccess && error instanceof z.ZodError) {
  errorCode = ErrorCodes.VALIDATION_ERROR;
  message = 'Email confirmation required';
  details = error.issues
.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
.join(', ');
} else {
  errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
  message = 'An unexpected error occurred during account deletion';
  details = error instanceof Error ? error.message : String(error);
}

return createErrorResponse(
  errorCode,
  message,
  context.requestId,
  details,
  context.timestamp,
);
  }
};

export const DELETE = withRequiredAuth(handleDelete);
export const GET = () => handle_method_not_allowed(['DELETE']);
export const PUT = () => handle_method_not_allowed(['DELETE']);
export const POST = () => handle_method_not_allowed(['DELETE']);
export const PATCH = () => handle_method_not_allowed(['DELETE']);
