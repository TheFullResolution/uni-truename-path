// TrueNamePath: Context Assignments Endpoint
// GET /api/contexts/assignments - Retrieve context-app assignments for authenticated users
// Date: August 23, 2025
// Academic project context management - supports E2E testing and assignment tracking

import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedContext,
} from '@/utils/api/with-auth';
import { ErrorCodes, StandardResponse } from '@/utils/api/types';

interface ContextAssignment {
  id: string;
  profile_id: string;
  app_id: string;
  context_id: string;
  created_at: string;
  updated_at: string | null;
}

/**
 * GET /api/contexts/assignments
 *
 * Authenticated endpoint to retrieve context-app assignments for the current user.
 * Used for testing and assignment management.
 *
 * Returns:
 * - Array of user's context-app assignments
 * - Only returns assignments for the authenticated user
 * - Shows which contexts are assigned to which applications
 */
async function handleAssignmentsList(
  request: NextRequest,
  { user, supabase, requestId, timestamp }: AuthenticatedContext,
): Promise<StandardResponse<ContextAssignment[]>> {
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
// Query context assignments for the authenticated user
const { data: assignments, error } = await supabase
  .from('app_context_assignments')
  .select('*')
  .eq('profile_id', user.id)
  .order('created_at', { ascending: false }); // Most recent first

if (error) {
  console.error(
`[${requestId}] Database error fetching assignments:`,
error,
  );
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve context assignments',
requestId,
undefined,
timestamp,
  );
}

// Return empty array if no assignments found (not an error)
const userAssignments = assignments || [];

console.log(
  `[${requestId}] Retrieved ${userAssignments.length} context assignments for user ${user.id}`,
);

return createSuccessResponse(userAssignments, requestId, timestamp);
  } catch (error) {
console.error(`[${requestId}] Context assignments lookup error:`, error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to retrieve context assignments',
  requestId,
  undefined,
  timestamp,
);
  }
}

/**
 * GET /api/contexts/assignments
 * Authenticated endpoint wrapped with withRequiredAuth
 */
export const GET = withRequiredAuth(handleAssignmentsList);
