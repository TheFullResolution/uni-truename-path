import { z } from 'zod';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  type AuthenticatedHandler,
} from '@/utils/api';

// =============================================================================
// Single Name Resolution Endpoint (Simplified)
// =============================================================================
// Implements simple context-aware name resolution
// Uses the resolve_name() PostgreSQL function
// Returns the resolved name text for the given context

// Request validation schema
const resolveRequestSchema = z.object({
  target_user_id: z.string().uuid('Invalid target user ID'),
  requester_user_id: z.string().uuid('Invalid requester user ID').optional(),
  context_name: z.string().min(1).max(100).optional(),
});

// Simple response interface
interface SimpleResolveResponseData {
  target_user_id: string;
  resolved_name: string;
  context_name?: string;
  metadata: {
request_id: string;
timestamp: string;
processing_time_ms: number;
  };
}

// Main handler function
const handlePOST: AuthenticatedHandler<SimpleResolveResponseData> = async (
  request,
  context,
) => {
  const processing_start = Date.now();

  try {
// Parse and validate request body
const body = await request.json();
const validatedData = resolveRequestSchema.parse(body);

const { target_user_id, requester_user_id, context_name } = validatedData;

// Use authenticated Supabase client from context
const { supabase } = context;

// Validate target user exists
const { data: targetUser, error: targetUserError } = await supabase
  .from('profiles')
  .select('id, email')
  .eq('id', target_user_id)
  .single();

if (targetUserError || !targetUser) {
  return createErrorResponse(
ErrorCodes.USER_NOT_FOUND,
'Target user not found',
context.requestId,
{ target_user_id, error: targetUserError?.message },
context.timestamp,
  );
}

// Call simplified PostgreSQL function
const { data: resolvedName, error: resolveError } = await supabase.rpc(
  'resolve_name',
  {
p_target_user_id: target_user_id,
p_requester_user_id: requester_user_id || context.user?.id,
p_context_name: context_name,
  },
);

if (resolveError) {
  console.error('Name resolution error:', resolveError);
  return createErrorResponse(
ErrorCodes.NAME_RESOLUTION_FAILED,
'Failed to resolve name',
context.requestId,
{ error: resolveError.message },
context.timestamp,
  );
}

if (!resolvedName) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'No name data found for user',
context.requestId,
{ target_user_id },
context.timestamp,
  );
}

// Build simple response
const processing_time_ms = Date.now() - processing_start;
const responseData: SimpleResolveResponseData = {
  target_user_id,
  resolved_name: resolvedName,
  context_name,
  metadata: {
request_id: context.requestId,
timestamp: new Date().toISOString(),
processing_time_ms,
  },
};

return createSuccessResponse(
  responseData,
  context.requestId,
  context.timestamp,
);
  } catch (error) {
console.error('Name resolve error:', error);

if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request data',
context.requestId,
{ validationErrors: error.issues },
context.timestamp,
  );
}

return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Internal server error during name resolution',
  context.requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  context.timestamp,
);
  }
};

// Export with authentication wrapper
export const POST = withRequiredAuth(handlePOST, {
  enableLogging: true,
});

// Export response type for frontend usage
export type { SimpleResolveResponseData };
