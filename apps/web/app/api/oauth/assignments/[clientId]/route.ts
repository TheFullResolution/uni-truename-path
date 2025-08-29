// TrueNamePath: OAuth Assignment Update Endpoint Handler
// PUT /api/oauth/assignments/[clientId] - Update OAuth context assignments
// Date: August 28, 2025
// Academic project - OAuth context assignment management

import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedContext,
  handle_method_not_allowed,
} from '@/utils/api/with-auth';
import { ErrorCodes, StandardResponse } from '@/utils/api/types';
import { createCORSOptionsResponse } from '@/utils/api/cors';
import { UpdateAssignmentRequestSchema } from './schemas';
import {
  UpdateAssignmentResponseData,
  AssignmentUpdateErrorCodes,
} from './types';

// =============================================================================
// Helper Functions (Academic Compliance: ≤15 lines each)
// =============================================================================

/**
 * Parse and validate request body using schemas
 */
async function validateUpdateRequest(
  request: NextRequest,
): Promise<
  | { success: true; data: { context_id: string }; clientId: string }
  | { success: false; error: unknown }
> {
  try {
const url = new URL(request.url);
const pathSegments = url.pathname.split('/');
const clientId = pathSegments[pathSegments.indexOf('assignments') + 1];
if (!clientId) return { success: false, error: 'Client ID required' };

const body = await request.json();
const validation = UpdateAssignmentRequestSchema.safeParse(body);
if (!validation.success) return { success: false, error: validation.error };

return { success: true, data: validation.data, clientId };
  } catch {
return { success: false, error: 'Invalid request' };
  }
}

/**
 * Check user owns the client assignment in app_context_assignments
 */
async function verifyClientOwnership(
  supabase: AuthenticatedContext['supabase'],
  userId: string,
  clientId: string,
): Promise<
  | { success: true; oldContextId: string }
  | { success: false; error: string; code: string }
> {
  const { data: assignment, error } = await supabase
.from('app_context_assignments')
.select('context_id')
.eq('profile_id', userId)
.eq('client_id', clientId)
.single();

  if (error || !assignment) {
return {
  success: false,
  error: 'Assignment not found or access denied',
  code: AssignmentUpdateErrorCodes.ASSIGNMENT_NOT_FOUND,
};
  }
  return { success: true, oldContextId: assignment.context_id };
}

/**
 * Check user owns the target context in user_contexts
 */
async function verifyContextOwnership(
  supabase: AuthenticatedContext['supabase'],
  userId: string,
  contextId: string,
): Promise<
  | { success: true; contextName: string }
  | { success: false; error: string; code: string }
> {
  const { data: context, error } = await supabase
.from('user_contexts')
.select('context_name')
.eq('id', contextId)
.eq('user_id', userId)
.single();

  if (error || !context) {
return {
  success: false,
  error: 'Context not found or access denied',
  code: AssignmentUpdateErrorCodes.CONTEXT_NOT_FOUND,
};
  }
  return { success: true, contextName: context.context_name };
}

/**
 * Perform the database UPSERT operation
 */
async function updateContextAssignment(
  supabase: AuthenticatedContext['supabase'],
  userId: string,
  clientId: string,
  contextId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('app_context_assignments').upsert(
{
  profile_id: userId,
  client_id: clientId,
  context_id: contextId,
  updated_at: new Date().toISOString(),
},
{ onConflict: 'profile_id,client_id' },
  );

  if (error) {
console.error('Assignment update failed:', error);
return { success: false, error: 'Failed to update assignment' };
  }
  return { success: true };
}

/**
 * Format the success response
 */
function buildUpdateResponse(
  clientId: string,
  oldContextId: string,
  newContextId: string,
  contextName: string,
  timestamp: string,
): UpdateAssignmentResponseData {
  return {
assignment_id: `${clientId}-assignment`,
client_id: clientId,
context_id: newContextId,
context_name: contextName,
updated_at: timestamp,
status: 'active' as const,
  };
}

/**
 * PUT /api/oauth/assignments/[clientId] (Academic Compliance: ≤50 lines)
 * Updates OAuth context assignment for external applications
 */
async function handlePutAssignment(
  request: NextRequest,
  { user, supabase, requestId, timestamp }: AuthenticatedContext,
): Promise<StandardResponse<UpdateAssignmentResponseData>> {
  if (!user?.id) {
return createErrorResponse(
  ErrorCodes.AUTHENTICATION_REQUIRED,
  'User authentication required',
  requestId,
  undefined,
  timestamp,
);
  }

  // Step 1: Parse and validate request
  const validateResult = await validateUpdateRequest(request);
  if (!validateResult.success) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid request',
  requestId,
  validateResult.error,
  timestamp,
);
  }

  // Step 2: Verify client assignment ownership
  const clientResult = await verifyClientOwnership(
supabase,
user.id,
validateResult.clientId,
  );
  if (!clientResult.success) {
return createErrorResponse(
  clientResult.code,
  clientResult.error,
  requestId,
  undefined,
  timestamp,
);
  }

  // Step 3: Verify target context ownership
  const contextResult = await verifyContextOwnership(
supabase,
user.id,
validateResult.data.context_id,
  );
  if (!contextResult.success) {
return createErrorResponse(
  contextResult.code,
  contextResult.error,
  requestId,
  undefined,
  timestamp,
);
  }

  // Step 4: Update assignment in database
  const updateResult = await updateContextAssignment(
supabase,
user.id,
validateResult.clientId,
validateResult.data.context_id,
  );
  if (!updateResult.success) {
return createErrorResponse(
  AssignmentUpdateErrorCodes.ASSIGNMENT_UPDATE_FAILED,
  updateResult.error!,
  requestId,
  undefined,
  timestamp,
);
  }

  // Step 5: Format and return success response
  const responseData = buildUpdateResponse(
validateResult.clientId,
clientResult.oldContextId,
validateResult.data.context_id,
contextResult.contextName,
timestamp,
  );

  return createSuccessResponse(responseData, requestId, timestamp);
}

export const PUT = withRequiredAuth(handlePutAssignment, {
  enableLogging: true,
});

// Handle unsupported HTTP methods
export const GET = () => handle_method_not_allowed(['PUT']);
export const POST = () => handle_method_not_allowed(['PUT']);
export const DELETE = () => handle_method_not_allowed(['PUT']);
export const PATCH = () => handle_method_not_allowed(['PUT']);

/**
 * OPTIONS handler for CORS preflight requests
 * Required for cross-origin requests from demo applications
 */
export async function OPTIONS(): Promise<Response> {
  return createCORSOptionsResponse('PUT, OPTIONS');
}
