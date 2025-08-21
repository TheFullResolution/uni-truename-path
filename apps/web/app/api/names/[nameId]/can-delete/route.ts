// TrueNamePath: Name Deletion Validation API Route - Step 15.3
// GET endpoint to check if a name can be deleted using new can_delete_name RPC
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

// Import generated database types - removed unused import

/**
 * Route parameters validation schema
 */
const ParamsSchema = z.object({
  nameId: z.string().uuid('Name ID must be a valid UUID'),
});

/**
 * Response interface for can-delete endpoint
 */
interface CanDeleteResponseData {
  can_delete: boolean;
  reason?: string;
  action_required?: string;
  metadata: {
name_id: string;
user_id: string;
check_timestamp: string;
  };
}

/**
 * GET /api/names/[nameId]/can-delete - Check if a name variant can be deleted
 * Uses the new can_delete_name RPC function from Step 15.3 migration
 */
const handleGET: AuthenticatedHandler = async (
  request: NextRequest,
  { user, requestId, timestamp },
) => {
  // Extract nameId from URL path
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const nameIdIndex = pathSegments.indexOf('names') + 1;
  const nameId = pathSegments[nameIdIndex];

  // Import this dynamically to avoid issues
  const { createClient } = await import('@/utils/supabase/server');
  const supabase = await createClient();
  try {
// 1. Validate route parameters
const paramsValidationResult = ParamsSchema.safeParse({ nameId });

if (!paramsValidationResult.success) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid route parameters',
requestId,
paramsValidationResult.error.issues.map((err) => ({
  field: err.path.join('.'),
  message: err.message,
  code: err.code,
})),
timestamp,
  );
}

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

// 3. Verify the name exists and belongs to the user
const { data: existingName, error: fetchError } = await supabase
  .from('names')
  .select('id, name_text, is_preferred, user_id')
  .eq('id', paramsValidationResult.data.nameId)
  .eq('user_id', authenticatedUserId)
  .maybeSingle();

if (fetchError) {
  console.error('Name fetch failed:', fetchError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to fetch name',
requestId,
{ error: fetchError.message },
timestamp,
  );
}

if (!existingName) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Name variant not found',
requestId,
undefined,
timestamp,
  );
}

// 4. Use the can_delete_name RPC function to check deletion eligibility
const { data: deletionCheck, error: checkError } = await supabase.rpc(
  'can_delete_name',
  {
p_user_id: authenticatedUserId,
p_name_id: paramsValidationResult.data.nameId,
  },
);

if (checkError) {
  console.error('Error checking name deletion permissions:', checkError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to validate deletion',
requestId,
{ error: checkError.message },
timestamp,
  );
}

// 5. Prepare response data
const checkData = deletionCheck as {
  can_delete: boolean;
  reason?: string;
  action_required?: string;
};
const responseData: CanDeleteResponseData = {
  can_delete: checkData?.can_delete || false,
  reason: checkData?.reason || undefined,
  action_required: checkData?.action_required || undefined,
  metadata: {
name_id: paramsValidationResult.data.nameId,
user_id: authenticatedUserId,
check_timestamp: timestamp,
  },
};

console.log(`API Request [${requestId}]:`, {
  endpoint: '/api/names/[nameId]/can-delete',
  method: 'GET',
  authenticatedUserId: authenticatedUserId.substring(0, 8) + '...',
  nameId: paramsValidationResult.data.nameId.substring(0, 8) + '...',
  canDelete: responseData.can_delete,
  reason: responseData.reason,
});

return createSuccessResponse(responseData, requestId, timestamp);
  } catch (error) {
console.error('Name deletion check error:', error);

return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'An unexpected error occurred while checking name deletion permissions',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

// Export the handler with authentication wrapper
export const GET = withRequiredAuth(handleGET);
