// TrueNamePath: Context-Name Assignments API Route
// Consolidated REST API for managing context-name assignments
// Date: August 15, 2025
// Academic project REST API with authentication and validation

import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../lib/api';
import { ErrorCodes } from '../../../lib/api';
import { z } from 'zod';
// Import centralized API response types
import type {
  AssignmentsResponseData,
  AssignmentWithDetails,
  UnassignedContext,
  CreateAssignmentResponseData,
  UpdateAssignmentResponseData,
  DeleteAssignmentResponseData,
} from '../../../types/api-responses';

/**
 * Query parameter validation schema for GET endpoint
 */
const QueryParamsSchema = z.object({
  limit: z
.string()
.nullable()
.optional()
.transform((val) => (val ? parseInt(val, 10) : undefined))
.refine((val) => !val || (val > 0 && val <= 100), {
  message: 'Limit must be between 1 and 100',
}),

  contextId: z
.string()
.uuid('Context ID must be a valid UUID')
.nullable()
.optional(),
});

/**
 * Request body validation schema for assignment creation
 */
const CreateAssignmentSchema = z.object({
  contextId: z
.string()
.uuid('Context ID must be a valid UUID')
.min(1, 'Context ID is required'),

  nameId: z
.string()
.uuid('Name ID must be a valid UUID')
.min(1, 'Name ID is required'),
});

/**
 * Request body validation schema for assignment updates
 */
const UpdateAssignmentSchema = z
  .object({
assignmentId: z
  .string()
  .uuid('Assignment ID must be a valid UUID')
  .min(1, 'Assignment ID is required'),

contextId: z.string().uuid('Context ID must be a valid UUID').optional(),

nameId: z.string().uuid('Name ID must be a valid UUID').optional(),
  })
  .refine((data) => data.contextId || data.nameId, {
message:
  'At least one field (contextId or nameId) must be provided for update',
  });

/**
 * Request body validation schema for assignment deletion
 */
const DeleteAssignmentSchema = z.object({
  assignmentId: z
.string()
.uuid('Assignment ID must be a valid UUID')
.min(1, 'Assignment ID is required'),
});

// Type inference for schema validation
type QueryParams = z.infer<typeof QueryParamsSchema>;

/**
 * GET /api/assignments - Retrieve all context-name assignments for a profile
 * Returns assignments with context and name details, plus unassigned contexts
 */
const handleGET: AuthenticatedHandler<AssignmentsResponseData> = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  // 1. Query parameter validation
  const url = new URL(request.url);
  const queryParams = {
limit: url.searchParams.get('limit'),
contextId: url.searchParams.get('contextId'),
  };

  const queryValidationResult = QueryParamsSchema.safeParse(queryParams);

  if (!queryValidationResult.success) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid query parameters',
  requestId,
  queryValidationResult.error.issues.map((err) => ({
field: err.path.join('.'),
message: err.message,
code: err.code,
  })),
  timestamp,
);
  }

  const validatedQueryParams = queryValidationResult.data;
  const { limit, contextId } = validatedQueryParams;

  // 2. Check user exists
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

  // 3. Build query for assignments with context and name details
  let assignmentQuery = supabase
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
name_text,
name_type
  )
`,
)
.eq('user_id', authenticatedUserId)
.order('created_at', { ascending: false });

  // Apply optional filters
  if (contextId) {
assignmentQuery = assignmentQuery.eq('context_id', contextId);
  }

  if (limit) {
assignmentQuery = assignmentQuery.limit(limit);
  }

  const { data: assignmentData, error: assignmentError } =
await assignmentQuery;

  if (assignmentError) {
console.error(`Assignment Query Error [${requestId}]:`, {
  error: assignmentError.message,
  code: assignmentError.code,
  details: assignmentError.details,
  hint: assignmentError.hint,
});

return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Database query failed while retrieving assignments',
  requestId,
  process.env.NODE_ENV === 'development'
? assignmentError.message
: 'Unable to retrieve context assignments',
  timestamp,
);
  }

  // 4. Get all user contexts to identify unassigned ones
  const { data: allContexts, error: contextError } = await supabase
.from('user_contexts')
.select('id, context_name, description')
.eq('user_id', authenticatedUserId)
.order('context_name');

  if (contextError) {
console.error(`Context Query Error [${requestId}]:`, {
  error: contextError.message,
  code: contextError.code,
  details: contextError.details,
  hint: contextError.hint,
});

return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Database query failed while retrieving contexts',
  requestId,
  process.env.NODE_ENV === 'development'
? contextError.message
: 'Unable to retrieve user contexts',
  timestamp,
);
  }

  // 6. Transform database results to API format
  const assignments: AssignmentWithDetails[] = (assignmentData || []).map(
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
  names: { id: string; name_text: string; name_type: string };
}) => ({
  id: item.id,
  context_id: item.context_id,
  context_name: item.user_contexts.context_name,
  context_description: item.user_contexts.description,
  name_id: item.name_id,
  name_text: item.names.name_text,
  name_type: item.names.name_type as AssignmentWithDetails['name_type'],
  created_at: item.created_at,
}),
  );

  // 7. Identify unassigned contexts
  const assignedContextIds = new Set(assignments.map((a) => a.context_id));
  const unassigned_contexts: UnassignedContext[] = (allContexts || [])
.filter((context) => !assignedContextIds.has(context.id))
.map((context) => ({
  id: context.id,
  context_name: context.context_name,
  description: context.description,
}));

  // 5. Success response with comprehensive metadata
  const responseData: AssignmentsResponseData = {
assignments,
unassigned_contexts,
total_contexts: (allContexts || []).length,
assigned_contexts: assignments.length,
metadata: {
  retrievalTimestamp: timestamp,
  filterApplied: {
contextId: contextId || undefined,
limit: limit,
  },
  userId: authenticatedUserId,
},
  };

  console.log(`API Request [${requestId}]:`, {
endpoint: '/api/assignments',
method: 'GET',
userId: authenticatedUserId.substring(0, 8) + '...',
totalAssignments: assignments.length,
totalContexts: (allContexts || []).length,
unassignedContexts: unassigned_contexts.length,
filtersApplied: Object.keys(validatedQueryParams).filter(
  (key) => validatedQueryParams[key as keyof QueryParams] !== undefined,
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
const validatedData = CreateAssignmentSchema.parse(body);

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

const authenticatedUserId = user.id;

// Verify context exists and belongs to user
const { data: contextCheck, error: contextError } = await supabase
  .from('user_contexts')
  .select('id, context_name')
  .eq('id', validatedData.contextId)
  .eq('user_id', authenticatedUserId)
  .single();

if (contextError || !contextCheck) {
  return createErrorResponse(
ErrorCodes.CONTEXT_NOT_FOUND,
'Context not found or access denied',
requestId,
{ contextId: validatedData.contextId },
timestamp,
  );
}

// Verify name exists and belongs to user
const { data: nameCheck, error: nameError } = await supabase
  .from('names')
  .select('id, name_text, name_type')
  .eq('id', validatedData.nameId)
  .eq('user_id', authenticatedUserId)
  .single();

if (nameError || !nameCheck) {
  return createErrorResponse(
ErrorCodes.NAME_NOT_FOUND,
'Name not found or access denied',
requestId,
{ nameId: validatedData.nameId },
timestamp,
  );
}

// Check if context already has an assignment (one name per context rule)
const { data: existingAssignment, error: existingError } = await supabase
  .from('context_name_assignments')
  .select('id')
  .eq('context_id', validatedData.contextId)
  .eq('user_id', authenticatedUserId)
  .maybeSingle();

if (existingError) {
  console.error('Error checking existing assignment:', existingError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to check existing assignments',
requestId,
{ error: existingError.message },
timestamp,
  );
}

if (existingAssignment) {
  return createErrorResponse(
ErrorCodes.CONFLICT,
'Context already has a name assignment',
requestId,
{
  contextId: validatedData.contextId,
  existingAssignmentId: existingAssignment.id,
},
timestamp,
  );
}

// Create the new assignment
const { data: newAssignment, error: createError } = await supabase
  .from('context_name_assignments')
  .insert({
user_id: authenticatedUserId,
context_id: validatedData.contextId,
name_id: validatedData.nameId,
created_at: new Date().toISOString(),
  })
  .select('*')
  .single();

if (createError || !newAssignment) {
  console.error('Error creating assignment:', createError);
  return createErrorResponse(
ErrorCodes.NAME_ASSIGNMENT_FAILED,
'Failed to create context-name assignment',
requestId,
{ error: createError?.message },
timestamp,
  );
}

const assignmentResponse: CreateAssignmentResponseData = {
  message: 'Context-name assignment created successfully',
  assignment: {
id: newAssignment.id,
context_id: newAssignment.context_id,
context_name: contextCheck.context_name,
context_description: null, // Not fetched in this endpoint
name_id: newAssignment.name_id,
name_text: nameCheck.name_text,
name_type: nameCheck.name_type,
created_at: newAssignment.created_at,
  },
};

return createSuccessResponse(assignmentResponse, requestId, timestamp);
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
const validatedData = UpdateAssignmentSchema.parse(body);

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
const { data: existingAssignment, error: fetchError } = await supabase
  .from('context_name_assignments')
  .select('id, context_id, name_id, user_id, created_at')
  .eq('id', validatedData.assignmentId)
  .eq('user_id', user.id)
  .single();

if (fetchError) {
  console.error('Assignment fetch failed:', fetchError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to fetch assignment',
requestId,
{ error: fetchError.message },
timestamp,
  );
}

if (!existingAssignment) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Assignment not found or access denied',
requestId,
undefined,
timestamp,
  );
}

// Validate context if being updated
if (validatedData.contextId) {
  const { data: contextCheck, error: contextError } = await supabase
.from('user_contexts')
.select('id, context_name')
.eq('id', validatedData.contextId)
.eq('user_id', user.id)
.single();

  if (contextError || !contextCheck) {
return createErrorResponse(
  ErrorCodes.CONTEXT_NOT_FOUND,
  'Context not found or access denied',
  requestId,
  { contextId: validatedData.contextId },
  timestamp,
);
  }

  // Check if the new context already has a different assignment
  if (validatedData.contextId !== existingAssignment.context_id) {
const { data: conflictCheck, error: conflictError } = await supabase
  .from('context_name_assignments')
  .select('id')
  .eq('context_id', validatedData.contextId)
  .eq('user_id', user.id)
  .neq('id', validatedData.assignmentId)
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
  contextId: validatedData.contextId,
  conflictingAssignmentId: conflictCheck.id,
},
timestamp,
  );
}
  }
}

// Validate name if being updated
if (validatedData.nameId) {
  const { data: nameCheck, error: nameError } = await supabase
.from('names')
.select('id, name_text, name_type')
.eq('id', validatedData.nameId)
.eq('user_id', user.id)
.single();

  if (nameError || !nameCheck) {
return createErrorResponse(
  ErrorCodes.NAME_NOT_FOUND,
  'Name not found or access denied',
  requestId,
  { nameId: validatedData.nameId },
  timestamp,
);
  }
}

// Build update object
const updateData: Partial<{
  context_id: string;
  name_id: string;
}> = {};

if (validatedData.contextId) {
  updateData.context_id = validatedData.contextId;
}

if (validatedData.nameId) {
  updateData.name_id = validatedData.nameId;
}

// Update the assignment
const { data: updatedAssignment, error: updateError } = await supabase
  .from('context_name_assignments')
  .update(updateData)
  .eq('id', validatedData.assignmentId)
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

const updateResponse: UpdateAssignmentResponseData = {
  message: 'Context-name assignment updated successfully',
  assignment: updatedAssignment,
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
const validatedData = DeleteAssignmentSchema.parse(body);

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
const { data: existingAssignment, error: fetchError } = await supabase
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
  .eq('id', validatedData.assignmentId)
  .eq('user_id', user.id)
  .single();

if (fetchError) {
  console.error('Assignment fetch failed:', fetchError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to fetch assignment',
requestId,
{ error: fetchError.message },
timestamp,
  );
}

if (!existingAssignment) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Assignment not found or access denied',
requestId,
undefined,
timestamp,
  );
}

// Delete the assignment
const { error: deleteError } = await supabase
  .from('context_name_assignments')
  .delete()
  .eq('id', validatedData.assignmentId)
  .eq('user_id', user.id);

if (deleteError) {
  console.error('Assignment deletion failed:', deleteError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to delete assignment',
requestId,
{ error: deleteError.message },
timestamp,
  );
}

const deleteResponse: DeleteAssignmentResponseData = {
  message: 'Context-name assignment deleted successfully',
  deleted_assignment_id: validatedData.assignmentId,
  context_id: existingAssignment.context_id,
  context_name: existingAssignment.user_contexts.context_name,
  deleted_at: new Date().toISOString(),
};

return createSuccessResponse(deleteResponse, requestId, timestamp);
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
export const GET = withRequiredAuth(handleGET, { enableLogging: true });
export const POST = withRequiredAuth(handlePOST);
export const PUT = withRequiredAuth(handlePUT);
export const DELETE = withRequiredAuth(handleDELETE);
