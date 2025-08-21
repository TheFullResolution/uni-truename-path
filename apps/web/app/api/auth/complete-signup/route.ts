// TrueNamePath: Complete Signup API Route - Step 15.3
// POST endpoint for two-step signup completion using complete_signup_with_oidc RPC
// Date: August 2025 - Step 15.3 Complete Cleanup Implementation

import {
  type AuthenticatedHandler,
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  withRequiredAuth,
} from '@/utils/api';
import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Request body validation schema for signup completion
 */
const CompleteSignupSchema = z.object({
  given_name: z
.string()
.trim()
.min(1, 'Given name is required')
.max(100, 'Given name cannot exceed 100 characters'),

  family_name: z
.string()
.trim()
.min(1, 'Family name is required')
.max(100, 'Family name cannot exceed 100 characters'),

  display_name: z.preprocess(
(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
z
  .string()
  .trim()
  .min(1)
  .max(200, 'Display name cannot exceed 200 characters')
  .optional(),
  ),

  nickname: z.preprocess(
(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
z
  .string()
  .trim()
  .min(1)
  .max(100, 'Nickname cannot exceed 100 characters')
  .optional(),
  ),

  preferred_username: z.preprocess(
(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
z
  .string()
  .trim()
  .min(1)
  .max(100, 'Preferred username cannot exceed 100 characters')
  .optional(),
  ),
});

/**
 * Response interface for signup completion
 */
interface CompleteSignupResponseData {
  message: string;
  user_id: string;
  created_names: Array<{
id: string;
name_text: string;
  }>;
  default_context: {
id: string;
context_name: string;
  };
  metadata: {
completion_timestamp: string;
names_created_count: number;
  };
}

/**
 * POST /api/auth/complete-signup - Complete the two-step signup process
 * Uses the complete_signup_with_oidc RPC function from Step 15.3 migration
 */
const handlePOST: AuthenticatedHandler<CompleteSignupResponseData> = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// 1. Parse and validate request body
const body = await request.json();
const validatedData = CompleteSignupSchema.parse(body);

// 2. Check user authentication
if (!user) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User authentication required',
requestId,
{},
timestamp,
  );
}

const authenticatedUserId = user.id;

// 3. Check if user has already completed signup (has names)
const { data: existingNames, error: namesCheckError } = await supabase
  .from('names')
  .select('id')
  .eq('user_id', authenticatedUserId)
  .limit(1);

if (namesCheckError) {
  console.error('Error checking existing names:', namesCheckError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to check signup status',
requestId,
{ error: namesCheckError.message },
timestamp,
  );
}

if (existingNames && existingNames.length > 0) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Signup already completed for this user',
requestId,
{
  existing_names_count: existingNames.length,
  suggestion: 'Use the names API to manage name variants',
},
timestamp,
  );
}

// 4. Use the complete_signup_with_oidc RPC function
const { error: signupError } = await supabase.rpc(
  'complete_signup_with_oidc',
  {
p_user_id: authenticatedUserId,
p_given_name: validatedData.given_name,
p_family_name: validatedData.family_name,
p_display_name: validatedData.display_name || undefined,
p_nickname: validatedData.nickname || undefined,
p_preferred_username: validatedData.preferred_username || undefined,
  },
);

if (signupError) {
  console.error('Error completing signup:', signupError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to complete signup',
requestId,
{ error: signupError.message },
timestamp,
  );
}

// 5. Fetch the created names and default context for response
const [{ data: createdNames }, { data: defaultContext }] =
  await Promise.all([
supabase
  .from('names')
  .select('id, name_text')
  .eq('user_id', authenticatedUserId)
  .order('created_at', { ascending: true }),
supabase
  .from('user_contexts')
  .select('id, context_name')
  .eq('user_id', authenticatedUserId)
  .limit(1)
  .maybeSingle(),
  ]);

// 6. Prepare success response
const responseData: CompleteSignupResponseData = {
  message: 'Signup completed successfully',
  user_id: authenticatedUserId,
  created_names: (createdNames || []).map((name) => ({
id: name.id,
name_text: name.name_text,
  })),
  default_context: defaultContext
? {
id: defaultContext.id,
context_name: defaultContext.context_name,
  }
: {
id: '',
context_name: 'Professional',
  },
  metadata: {
completion_timestamp: timestamp,
names_created_count: createdNames?.length || 0,
  },
};

console.log(`API Request [${requestId}]:`, {
  endpoint: '/api/auth/complete-signup',
  method: 'POST',
  authenticatedUserId: authenticatedUserId.substring(0, 8) + '...',
  namesCreated: responseData.created_names.length,
  defaultContextName: responseData.default_context.context_name,
});

return createSuccessResponse(responseData, requestId, timestamp);
  } catch (error) {
console.error('Signup completion error:', error);

if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request data',
requestId,
{ validationErrors: error.issues },
timestamp,
  );
}

// Handle JSON parsing errors
if (error instanceof SyntaxError && error.message.includes('JSON')) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid JSON in request body',
requestId,
{ error: 'Malformed JSON data' },
timestamp,
  );
}

return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'An unexpected error occurred while completing signup',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

// Export the handler with authentication wrapper
export const POST = withRequiredAuth(handlePOST, { enableLogging: true });
