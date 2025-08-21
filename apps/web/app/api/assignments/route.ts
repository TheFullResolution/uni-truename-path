// TrueNamePath: Context-Name Assignments API Route
// Consolidated REST API for managing context-name assignments
// Date: August 15, 2025
// Academic project REST API with authentication and validation

// TrueNamePath: Context-Name Assignments API Route
// Consolidated REST API for managing context-name assignments
// Date: August 20, 2025
// Academic project REST API with authentication and validation

import { NextRequest } from 'next/server';
import type {
  AssignmentWithDetails,
  AssignmentsResponseData,
  UnassignedContext,
  CreateAssignmentResponseData,
  UpdateAssignmentResponseData,
  DeleteAssignmentResponseData,
} from './types';
import {
  ListQueryParamsSchema,
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema,
  DeleteAssignmentRequestSchema,
  type ListQueryParams,
  createValidationErrorResponse as sharedCreateValidationErrorResponse,
} from './schemas';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  type AuthenticatedHandler,
  type AuthenticatedContext,
  validate_authenticated_user,
  handle_database_error,
} from '@/utils/api';
import { ErrorCodes } from '@/utils/api';
import { z } from 'zod';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validates query parameters using shared schema
 */
function validateQueryParams(request: NextRequest) {
  const url = new URL(request.url);
  const query_params = {
limit: url.searchParams.get('limit'),
context_id: url.searchParams.get('context_id'),
  };

  return ListQueryParamsSchema.safeParse(query_params);
}

/**
 * Creates standardized validation error response using shared helper
 */
function createValidationErrorResponse(
  result: z.ZodSafeParseResult<unknown>,
  requestId: string,
  timestamp: string,
) {
  return sharedCreateValidationErrorResponse(
result,
requestId,
timestamp,
createErrorResponse,
ErrorCodes,
  );
}

/**
 * GET /api/assignments - Retrieve all context-name assignments for a profile
 * Returns assignments with context and name details, plus unassigned contexts
 */
const handleGET = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp }: AuthenticatedContext,
) => {
  // 1. Query parameter validation
  const query_validation_result = validateQueryParams(request);

  if (!query_validation_result.success) {
return createValidationErrorResponse(
  query_validation_result,
  requestId,
  timestamp,
);
  }

  const validated_query_params = query_validation_result.data;
  const { limit, context_id } = validated_query_params;

  // 2. Validate user authentication
  const user_validation = validate_authenticated_user(
user,
requestId,
timestamp,
  );
  if ('error' in user_validation) {
return user_validation.error;
  }

  const { authenticated_user_id } = user_validation;

  // 3. Build query for assignments with context and name details
  let assignment_query = supabase
.from('context_name_assignments')
.select(
  `
  id,
  context_id,
  name_id,
  created_at,
  user_contexts!inner(
id,
context_name,
description
  ),
  names!inner(
id,
name_text
  )
`,
)
.eq('user_id', authenticated_user_id)
.order('created_at', { ascending: false });

  // Apply optional filters
  if (context_id) {
assignment_query = assignment_query.eq('context_id', context_id);
  }

  if (limit) {
assignment_query = assignment_query.limit(limit);
  }

  const { data: assignment_data, error: assignment_error } =
await assignment_query;

  if (assignment_error) {
return handle_database_error(
  assignment_error,
  'Assignment query',
  requestId,
  timestamp,
  'Unable to retrieve context assignments',
);
  }

  // 4. Get all user contexts to identify unassigned ones
  const { data: all_contexts, error: context_error } = await supabase
.from('user_contexts')
.select('id, context_name, description')
.eq('user_id', authenticated_user_id)
.order('context_name');

  if (context_error) {
return handle_database_error(
  context_error,
  'Context query',
  requestId,
  timestamp,
  'Unable to retrieve user contexts',
);
  }

  // 6. Transform database results to API format
  const assignments: AssignmentWithDetails[] = (assignment_data || []).map(
(item: {
  id: string;
  context_id: string;
  name_id: string;
  created_at: string;
  user_contexts: {
id: string;
context_name: string;
description: string | null;
  };
  names: {
id: string;
name_text: string;
  };
}) => ({
  id: item.id,
  context_id: item.context_id,
  context_name: item.user_contexts.context_name,
  context_description: item.user_contexts.description,
  name_id: item.name_id,
  name_text: item.names.name_text,
  created_at: item.created_at,
}),
  );

  // 7. Identify unassigned contexts
  const assigned_context_ids = new Set(assignments.map((a) => a.context_id));
  const unassigned_contexts: UnassignedContext[] = (all_contexts || [])
.filter((context) => !assigned_context_ids.has(context.id))
.map((context) => ({
  id: context.id,
  context_name: context.context_name,
  description: context.description,
}));

  // 5. Success response with comprehensive metadata
  const responseData: AssignmentsResponseData = {
assignments,
unassigned_contexts,
total_contexts: (all_contexts || []).length,
assigned_contexts: assignments.length,
metadata: {
  retrieval_timestamp: timestamp,
  filter_applied: {
context_id: context_id || undefined,
limit: limit,
  },
  user_id: authenticated_user_id,
},
  };

  console.log(`API Request [${requestId}]:`, {
endpoint: '/api/assignments',
method: 'GET',
userId: authenticated_user_id.substring(0, 8) + '...',
totalAssignments: assignments.length,
totalContexts: (all_contexts || []).length,
unassignedContexts: unassigned_contexts.length,
filtersApplied: Object.keys(validated_query_params).filter(
  (key) =>
validated_query_params[key as keyof ListQueryParams] !== undefined,
).length,
  });

  return createSuccessResponse(responseData, requestId, timestamp);
};

/**
 * POST /api/assignments - Create a new context-name assignment
 * Creates a new assignment between a context and a name for the authenticated user
 */
const handlePOST: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// Parse and validate request body
const body = await request.json();
const validated_data = CreateAssignmentRequestSchema.parse(body);

// Check user exists
if (!user) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User authentication required',
requestId,
{},
timestamp,
  );
}

const authenticated_user_id = user.id;

// Verify context exists and belongs to user
const { data: context_check, error: context_error } = await supabase
  .from('user_contexts')
  .select('id, context_name')
  .eq('id', validated_data.context_id)
  .eq('user_id', authenticated_user_id)
  .single();

if (context_error || !context_check) {
  return createErrorResponse(
ErrorCodes.CONTEXT_NOT_FOUND,
'Context not found or access denied',
requestId,
{ context_id: validated_data.context_id },
timestamp,
  );
}

// Verify name exists and belongs to user
const { data: name_check, error: name_error } = await supabase
  .from('names')
  .select('id, name_text')
  .eq('id', validated_data.name_id)
  .eq('user_id', authenticated_user_id)
  .single();

if (name_error || !name_check) {
  return createErrorResponse(
ErrorCodes.NAME_NOT_FOUND,
'Name not found or access denied',
requestId,
{ name_id: validated_data.name_id },
timestamp,
  );
}

// Check if context already has an assignment (one name per context rule)
const { data: existing_assignment, error: existing_error } = await supabase
  .from('context_name_assignments')
  .select('id')
  .eq('context_id', validated_data.context_id)
  .eq('user_id', authenticated_user_id)
  .maybeSingle();

if (existing_error) {
  console.error('Error checking existing assignment:', existing_error);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to check existing assignments',
requestId,
{ error: existing_error.message },
timestamp,
  );
}

if (existing_assignment) {
  return createErrorResponse(
ErrorCodes.CONFLICT,
'Context already has a name assignment',
requestId,
{
  context_id: validated_data.context_id,
  existing_assignment_id: existing_assignment.id,
},
timestamp,
  );
}

// Create the new assignment
const { data: new_assignment, error: create_error } = await supabase
  .from('context_name_assignments')
  .insert({
user_id: authenticated_user_id,
context_id: validated_data.context_id,
name_id: validated_data.name_id,
created_at: new Date().toISOString(),
  })
  .select('*')
  .single();

if (create_error || !new_assignment) {
  console.error('Error creating assignment:', create_error);
  return createErrorResponse(
ErrorCodes.NAME_ASSIGNMENT_FAILED,
'Failed to create context-name assignment',
requestId,
{ error: create_error?.message },
timestamp,
  );
}

const assignment_response: CreateAssignmentResponseData = {
  message: 'Context-name assignment created successfully',
  assignment: {
id: new_assignment.id,
context_id: new_assignment.context_id,
context_name: context_check.context_name,
context_description: null, // Not fetched in this endpoint
name_id: new_assignment.name_id,
name_text: name_check.name_text,
created_at: new_assignment.created_at,
  },
};

return createSuccessResponse(assignment_response, requestId, timestamp);
  } catch (error) {
console.error('Assignment creation error:', error);

if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request data',
requestId,
{ validationErrors: error.issues },
timestamp,
  );
}

return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'An unexpected error occurred while creating the assignment',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

/**
 * PUT /api/assignments - Update an existing context-name assignment
 * Updates either the context or name (or both) for an existing assignment
 */
const handlePUT: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// Parse and validate request body
const body = await request.json();
const validated_data = UpdateAssignmentRequestSchema.parse(body);

// Check user exists
if (!user) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User authentication required',
requestId,
{},
timestamp,
  );
}

// Check if the assignment exists and belongs to the user
const { data: existing_assignment, error: fetch_error } = await supabase
  .from('context_name_assignments')
  .select('id, context_id, name_id, user_id, created_at')
  .eq('id', validated_data.assignment_id)
  .eq('user_id', user.id)
  .single();

if (fetch_error) {
  console.error('Assignment fetch failed:', fetch_error);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to fetch assignment',
requestId,
{ error: fetch_error.message },
timestamp,
  );
}

if (!existing_assignment) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Assignment not found or access denied',
requestId,
undefined,
timestamp,
  );
}

// Declare variables for context and name checks
let context_check: { id: string; context_name: string } | null = null;
let name_check: {
  id: string;
  name_text: string;
} | null = null;

// Validate context if being updated
if (validated_data.context_id) {
  const { data: context_data, error: context_error } = await supabase
.from('user_contexts')
.select('id, context_name')
.eq('id', validated_data.context_id)
.eq('user_id', user.id)
.single();

  if (context_error || !context_data) {
return createErrorResponse(
  ErrorCodes.CONTEXT_NOT_FOUND,
  'Context not found or access denied',
  requestId,
  { context_id: validated_data.context_id },
  timestamp,
);
  }

  context_check = context_data;

  // Check if the new context already has a different assignment
  if (validated_data.context_id !== existing_assignment.context_id) {
const { data: conflictCheck, error: conflictError } = await supabase
  .from('context_name_assignments')
  .select('id')
  .eq('context_id', validated_data.context_id)
  .eq('user_id', user.id)
  .neq('id', validated_data.assignment_id)
  .maybeSingle();

if (conflictError) {
  console.error('Error checking context conflict:', conflictError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to validate context assignment',
requestId,
{ error: conflictError.message },
timestamp,
  );
}

if (conflictCheck) {
  return createErrorResponse(
ErrorCodes.CONFLICT,
'Target context already has a name assignment',
requestId,
{
  contextId: validated_data.context_id,
  conflictingAssignmentId: conflictCheck.id,
},
timestamp,
  );
}
  }
}

// Validate name if being updated
if (validated_data.name_id) {
  const { data: name_data, error: name_error } = await supabase
.from('names')
.select('id, name_text')
.eq('id', validated_data.name_id)
.eq('user_id', user.id)
.single();

  if (name_error || !name_data) {
return createErrorResponse(
  ErrorCodes.NAME_NOT_FOUND,
  'Name not found or access denied',
  requestId,
  { nameId: validated_data.name_id },
  timestamp,
);
  }

  name_check = name_data;
}

// Build update object
const updateData: Partial<{
  context_id: string;
  name_id: string;
}> = {};

if (validated_data.context_id) {
  updateData.context_id = validated_data.context_id;
}

if (validated_data.name_id) {
  updateData.name_id = validated_data.name_id;
}

// Update the assignment
const { data: updatedAssignment, error: updateError } = await supabase
  .from('context_name_assignments')
  .update(updateData)
  .eq('id', validated_data.assignment_id)
  .eq('user_id', user.id)
  .select('id, context_id, name_id, user_id, created_at')
  .single();

if (updateError) {
  console.error('Assignment update failed:', updateError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to update assignment',
requestId,
{ error: updateError.message },
timestamp,
  );
}

// Get context information if not already fetched
if (!context_check) {
  const { data: context_data, error: context_error } = await supabase
.from('user_contexts')
.select('id, context_name')
.eq('id', updatedAssignment.context_id)
.eq('user_id', user.id)
.single();

  if (context_data && !context_error) {
context_check = context_data;
  }
}

// Get name information if not already fetched
if (!name_check) {
  const { data: name_data, error: name_error } = await supabase
.from('names')
.select('id, name_text')
.eq('id', updatedAssignment.name_id)
.eq('user_id', user.id)
.single();

  if (name_data && !name_error) {
name_check = name_data;
  }
}

// Construct the full assignment response
const assignmentResponse: AssignmentWithDetails = {
  id: updatedAssignment.id,
  context_id: updatedAssignment.context_id,
  context_name: context_check?.context_name || 'Unknown Context',
  context_description: null, // Not fetched in this endpoint
  name_id: updatedAssignment.name_id,
  name_text: name_check?.name_text || 'Unknown Name',
  created_at: updatedAssignment.created_at,
};

const updateResponse: UpdateAssignmentResponseData = {
  message: 'Context-name assignment updated successfully',
  assignment: assignmentResponse,
};

return createSuccessResponse(updateResponse, requestId, timestamp);
  } catch (error) {
console.error('Assignment update error:', error);

if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request data',
requestId,
{ validationErrors: error.issues },
timestamp,
  );
}

return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'An unexpected error occurred while updating the assignment',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

/**
 * DELETE /api/assignments - Delete a context-name assignment
 * Removes a specific context-name assignment for the authenticated user
 */
const handleDELETE: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// Parse and validate request body
const body = await request.json();
const validated_data = DeleteAssignmentRequestSchema.parse(body);

// Check user exists
if (!user) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User authentication required',
requestId,
{},
timestamp,
  );
}

// Check if the assignment exists and belongs to the user
const { data: existing_assignment, error: fetch_error } = await supabase
  .from('context_name_assignments')
  .select(
`
id,
context_id,
name_id,
created_at,
user_contexts!inner(
  context_name
)
  `,
  )
  .eq('id', validated_data.assignment_id)
  .eq('user_id', user.id)
  .single();

if (fetch_error) {
  console.error('Assignment fetch failed:', fetch_error);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to fetch assignment',
requestId,
{ error: fetch_error.message },
timestamp,
  );
}

if (!existing_assignment) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Assignment not found or access denied',
requestId,
undefined,
timestamp,
  );
}

// Delete the assignment
const { error: delete_error } = await supabase
  .from('context_name_assignments')
  .delete()
  .eq('id', validated_data.assignment_id)
  .eq('user_id', user.id);

if (delete_error) {
  console.error('Assignment deletion failed:', delete_error);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to delete assignment',
requestId,
{ error: delete_error.message },
timestamp,
  );
}

const delete_response: DeleteAssignmentResponseData = {
  message: 'Context-name assignment deleted successfully',
  deleted_assignment_id: validated_data.assignment_id,
  context_id: existing_assignment.context_id,
  context_name: (
existing_assignment.user_contexts as { context_name: string }
  ).context_name,
  deleted_at: new Date().toISOString(),
};

return createSuccessResponse(delete_response, requestId, timestamp);
  } catch (error) {
console.error('Assignment deletion error:', error);

if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request data',
requestId,
{ validationErrors: error.issues },
timestamp,
  );
}

return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'An unexpected error occurred while deleting the assignment',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

// Export the handlers with authentication wrapper
export const GET = withRequiredAuth(handleGET as AuthenticatedHandler, {
  enableLogging: true,
});
export const POST = withRequiredAuth(handlePOST);
export const PUT = withRequiredAuth(handlePUT);
export const DELETE = withRequiredAuth(handleDELETE);

// Method not allowed handlers
export const PATCH = () =>
  handle_method_not_allowed(['GET', 'POST', 'PUT', 'DELETE']);
