import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  ErrorCodes,
} from '@/utils/api';
import { createClient } from '@/utils/supabase/server';
import { generateRequestId } from '@/utils/api/with-auth';
import { passwordSchema } from '@/utils/validation/password';

// Validation schema for signup request (combining both steps)
const signupRequestSchema = z
  .object({
// Step 1 data
email: z.string().email({ message: 'Invalid email address' }),
password: passwordSchema,
confirmPassword: z.string(),
agreeToTerms: z.boolean().refine((val) => val === true, {
  message: 'You must agree to the Privacy Policy and Terms of Service',
}),
consentToProcessing: z.boolean().refine((val) => val === true, {
  message:
'Consent to context-aware name processing is required for core functionality',
}),
allowMarketing: z.boolean().optional(),

// Step 2 data (OIDC properties)
given_name: z
  .string()
  .trim()
  .min(1, { message: 'Given name is required' })
  .max(100, { message: 'Given name must be less than 100 characters' }),

family_name: z
  .string()
  .trim()
  .min(1, { message: 'Family name is required' })
  .max(100, { message: 'Family name must be less than 100 characters' }),

display_name: z
  .string()
  .trim()
  .max(200, { message: 'Display name must be less than 200 characters' })
  .optional()
  .transform((val) => (val === '' ? undefined : val)),

nickname: z
  .string()
  .trim()
  .max(100, { message: 'Nickname must be less than 100 characters' })
  .optional()
  .transform((val) => (val === '' ? undefined : val)),

preferred_username: z
  .string()
  .trim()
  .max(50, { message: 'Username must be less than 50 characters' })
  .optional()
  .transform((val) => (val === '' ? undefined : val)),
  })
  .refine((data) => data.password === data.confirmPassword, {
message: 'Passwords do not match',
path: ['confirmPassword'],
  });

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export interface SignupResponse {
  user: {
id: string;
email: string;
  };
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  try {
// Parse and validate request body
const body = await request.json();
const validation = signupRequestSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid signup data provided',
  requestId,
  {
errors: validation.error.issues.map((issue) => ({
  field: issue.path.join('.'),
  message: issue.message,
})),
  },
  timestamp,
),
{ status: 400 },
  );
}

const signupData = validation.data;

// Create Supabase client
const supabase = await createClient();

// Create the account with metadata for database trigger processing
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: signupData.email,
  password: signupData.password,
  options: {
data: {
  // Store consent data in user metadata
  agreeToTerms: signupData.agreeToTerms,
  consentToProcessing: signupData.consentToProcessing,
  allowMarketing: signupData.allowMarketing || false,
  // Store OIDC name properties for database trigger processing
  given_name: signupData.given_name,
  family_name: signupData.family_name,
  display_name: signupData.display_name,
  nickname: signupData.nickname,
  preferred_username: signupData.preferred_username,
},
  },
});

if (authError) {
  // Handle specific Supabase auth errors
  let errorCode: string = ErrorCodes.AUTHENTICATION_FAILED;
  let message = 'Account creation failed';
  let details = authError.message;

  if (authError.message.includes('already registered')) {
errorCode = ErrorCodes.VALIDATION_ERROR;
message = 'Email address is already registered';
details = 'Please use a different email address or try logging in';
  } else if (authError.message.includes('Password')) {
errorCode = ErrorCodes.VALIDATION_ERROR;
message = 'Password does not meet requirements';
  } else if (authError.message.includes('Email')) {
errorCode = ErrorCodes.VALIDATION_ERROR;
message = 'Invalid email address';
  }

  return NextResponse.json(
createErrorResponse(errorCode, message, requestId, details, timestamp),
{ status: 400 },
  );
}

if (!authData.user) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.AUTHENTICATION_FAILED,
  'Account creation succeeded but user data not available',
  requestId,
  'This may be due to email confirmation requirements',
  timestamp,
),
{ status: 500 },
  );
}

// Success! The database trigger handles profile and name creation automatically
// Return user data for client-side session establishment
const responseData: SignupResponse = {
  user: {
id: authData.user.id,
email: authData.user.email!,
  },
  message: 'Account created successfully with your name variants',
};

return NextResponse.json(
  createSuccessResponse(responseData, requestId, timestamp),
  { status: 201 },
);
  } catch (error) {
// Handle unexpected errors
const errorMessage =
  error instanceof Error ? error.message : 'An unexpected error occurred';

return NextResponse.json(
  createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to create account',
requestId,
errorMessage,
timestamp,
  ),
  { status: 500 },
);
  }
}

// Handle unsupported HTTP methods
export const GET = () => handle_method_not_allowed(['POST']);
export const PUT = () => handle_method_not_allowed(['POST']);
export const DELETE = () => handle_method_not_allowed(['POST']);
export const PATCH = () => handle_method_not_allowed(['POST']);
