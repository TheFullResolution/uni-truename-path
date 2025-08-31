// TrueNamePath: Name Context Assignments API Route - Step 18
// GET endpoint to fetch context assignments for a specific name
// Date: August 2025 - Enhanced name management functionality

import {
  type AuthenticatedHandler,
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  withRequiredAuth,
} from '@/utils/api';
import { type NameAssignmentsResponse } from '@/types/database';
import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Route parameters validation schema
 */
const ParamsSchema = z.object({
  nameId: z.string().uuid('Name ID must be a valid UUID'),
});

/**
 * Response interface for name assignments endpoint
 */
interface NameAssignmentsResponseData extends NameAssignmentsResponse {
  metadata: {
name_id: string;
user_id: string;
retrieval_timestamp: string;
  };
}

/**
 * GET /api/names/[nameId]/assignments - Fetch context assignments for a specific name
 * Returns all contexts where this name is assigned with context details
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
  .select('id, name_text, user_id')
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

// 4. Fetch context assignments for this name
const { data: assignments, error: assignmentsError } = await supabase
  .from('context_oidc_assignments')
  .select(
`
context_id,
oidc_property,
user_contexts!inner (
  id,
  context_name,
  is_permanent
)
  `,
  )
  .eq('name_id', paramsValidationResult.data.nameId)
  .eq('user_id', authenticatedUserId);

if (assignmentsError) {
  console.error('Error fetching context assignments:', assignmentsError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to fetch context assignments',
requestId,
{ error: assignmentsError.message },
timestamp,
  );
}

// 5. Transform the data to match the expected response structure
const transformedAssignments = (assignments || []).map((assignment) => ({
  context_id: assignment.context_id,
  context_name: assignment.user_contexts.context_name,
  is_permanent: assignment.user_contexts.is_permanent ?? false,
  oidc_property: assignment.oidc_property,
}));

// 6. Prepare response data
const responseData: NameAssignmentsResponseData = {
  assignments: transformedAssignments,
  total: transformedAssignments.length,
  metadata: {
name_id: paramsValidationResult.data.nameId,
user_id: authenticatedUserId,
retrieval_timestamp: timestamp,
  },
};

console.log(`API Request [${requestId}]:`, {
  endpoint: '/api/names/[nameId]/assignments',
  method: 'GET',
  authenticatedUserId: authenticatedUserId.substring(0, 8) + '...',
  nameId: paramsValidationResult.data.nameId.substring(0, 8) + '...',
  nameText: existingName.name_text.substring(0, 20) + '...',
  assignmentsCount: transformedAssignments.length,
  contexts: transformedAssignments.map((a) => a.context_name),
});

return createSuccessResponse(responseData, requestId, timestamp);
  } catch (error) {
console.error('Name assignments fetch error:', error);

return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'An unexpected error occurred while fetching name assignments',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

// Export the handler with authentication wrapper
export const GET = withRequiredAuth(handleGET);
