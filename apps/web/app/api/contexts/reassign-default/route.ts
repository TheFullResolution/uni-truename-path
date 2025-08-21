// TrueNamePath: Context Default Reassignment API Route - Step 15.3
// POST endpoint to reassign default context using reassign_default_context RPC
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
 * Request body validation schema
 */
const ReassignDefaultSchema = z.object({
  new_default_context_id: z
.string()
.uuid('New default context ID must be a valid UUID'),
});

/**
 * Response interface for reassign-default endpoint
 */
interface ReassignDefaultResponseData {
  message: string;
  old_default_context_id: string | null;
  new_default_context_id: string;
  metadata: {
user_id: string;
reassignment_timestamp: string;
  };
}

/**
 * POST /api/contexts/reassign-default - Reassign the default context for a user
 * Uses the new reassign_default_context RPC function from Step 15.3 migration
 */
const handlePOST: AuthenticatedHandler<ReassignDefaultResponseData> = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// 1. Parse and validate request body
const body = await request.json();
const validatedData = ReassignDefaultSchema.parse(body);

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

// 3. Verify the new default context exists and belongs to the user
const { data: existingContext, error: fetchError } = await supabase
  .from('user_contexts')
  .select('id, context_name')
  .eq('id', validatedData.new_default_context_id)
  .eq('user_id', authenticatedUserId)
  .maybeSingle();

if (fetchError) {
  console.error('Context fetch failed:', fetchError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to fetch context',
requestId,
{ error: fetchError.message },
timestamp,
  );
}

if (!existingContext) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Context not found or does not belong to user',
requestId,
undefined,
timestamp,
  );
}

// 4. Note: Default context functionality has been simplified
// This endpoint now serves as a context validation endpoint

// 5. No current default context in simplified schema
// The default context concept has been removed

// 6. Note: reassign_default_context RPC function no longer exists
// This is now a no-op since there's no default context concept

// 7. Prepare success response
const responseData: ReassignDefaultResponseData = {
  message:
'Context validated successfully (default context functionality removed)',
  old_default_context_id: null, // No default context concept anymore
  new_default_context_id: validatedData.new_default_context_id,
  metadata: {
user_id: authenticatedUserId,
reassignment_timestamp: timestamp,
  },
};

console.log(`API Request [${requestId}]:`, {
  endpoint: '/api/contexts/reassign-default',
  method: 'POST',
  authenticatedUserId: authenticatedUserId.substring(0, 8) + '...',
  contextId: validatedData.new_default_context_id.substring(0, 8) + '...',
});

return createSuccessResponse(responseData, requestId, timestamp);
  } catch (error) {
console.error('Default context reassignment error:', error);

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
  'An unexpected error occurred while reassigning default context',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

// Export the handler with authentication wrapper
export const POST = withRequiredAuth(handlePOST, { enableLogging: true });
