// TrueNamePath: Context Name Assignment API Route - Step 15.4 OAuth Compatible
// POST endpoint for managing context name assignments with OIDC properties
// Date: August 2025 - Step 15.4 Complete OAuth-compatible structure

import {
  type AuthenticatedHandler,
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  withRequiredAuth,
} from '@/utils/api';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Import generated database types directly
import type { TablesInsert, TablesUpdate } from '@/generated/database';

// Import shared schema and types for OIDC properties
import { OIDC_PROPERTY_VALUES } from '@/app/api/assignments/schemas';

/**
 * Request body validation schema for creating/updating context name assignments
 */
const AssignNameSchema = z.object({
  context_id: z.string().uuid('Context ID must be a valid UUID'),
  name_id: z.string().uuid('Name ID must be a valid UUID'),
  oidc_property: z.enum(OIDC_PROPERTY_VALUES),
  is_primary: z.boolean().optional().default(false),
});

/**
 * Request body validation schema for updating assignments
 */
const UpdateAssignmentSchema = z.object({
  assignment_id: z.string().uuid('Assignment ID must be a valid UUID'),
  oidc_property: z.enum(OIDC_PROPERTY_VALUES).optional(),
  is_primary: z.boolean().optional(),
});

/**
 * POST /api/contexts/assign - Create or update context name assignment
 * Assigns a name to a context with specific OIDC property mapping
 */
const handlePOST: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// Parse and validate request body
const body = await request.json();
const validatedData = AssignNameSchema.parse(body);

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

// 1. Verify context ownership
const { data: contextData, error: contextError } = await supabase
  .from('user_contexts')
  .select('id, context_name')
  .eq('id', validatedData.context_id)
  .eq('user_id', authenticatedUserId)
  .maybeSingle();

if (contextError) {
  console.error('Context fetch failed:', contextError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to verify context ownership',
requestId,
{ error: contextError.message },
timestamp,
  );
}

if (!contextData) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Context not found or access denied',
requestId,
{ contextId: validatedData.context_id },
timestamp,
  );
}

// 2. Verify name ownership
const { data: nameData, error: nameError } = await supabase
  .from('names')
  .select('id, name_text')
  .eq('id', validatedData.name_id)
  .eq('user_id', authenticatedUserId)
  .maybeSingle();

if (nameError) {
  console.error('Name fetch failed:', nameError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to verify name ownership',
requestId,
{ error: nameError.message },
timestamp,
  );
}

if (!nameData) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Name not found or access denied',
requestId,
{ nameId: validatedData.name_id },
timestamp,
  );
}

// 3. Check if assignment already exists for this context
const { data: existingAssignment, error: assignmentCheckError } =
  await supabase
.from('context_name_assignments')
.select('id, oidc_property, is_primary')
.eq('context_id', validatedData.context_id)
.eq('user_id', authenticatedUserId)
.maybeSingle();

if (assignmentCheckError && assignmentCheckError.code !== 'PGRST116') {
  // PGRST116 is "no rows returned" which is expected if no assignment exists
  console.error('Assignment check failed:', assignmentCheckError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to check existing assignment',
requestId,
{ error: assignmentCheckError.message },
timestamp,
  );
}

let assignmentResult;

if (existingAssignment) {
  // 4. Update existing assignment
  const updateData: TablesUpdate<'context_name_assignments'> = {
name_id: validatedData.name_id,
oidc_property: validatedData.oidc_property,
is_primary: validatedData.is_primary,
  };

  const { data: updatedAssignment, error: updateError } = await supabase
.from('context_name_assignments')
.update(updateData)
.eq('id', existingAssignment.id)
.eq('user_id', authenticatedUserId)
.select('*')
.single();

  if (updateError) {
console.error('Assignment update failed:', updateError);
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to update context assignment',
  requestId,
  { error: updateError.message },
  timestamp,
);
  }

  assignmentResult = updatedAssignment;
} else {
  // 4. Create new assignment
  const assignmentData: TablesInsert<'context_name_assignments'> = {
context_id: validatedData.context_id,
name_id: validatedData.name_id,
user_id: authenticatedUserId,
oidc_property: validatedData.oidc_property,
is_primary: validatedData.is_primary,
  };

  const { data: newAssignment, error: createError } = await supabase
.from('context_name_assignments')
.insert(assignmentData)
.select('*')
.single();

  if (createError) {
console.error('Assignment creation failed:', createError);
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to create context assignment',
  requestId,
  { error: createError.message },
  timestamp,
);
  }

  assignmentResult = newAssignment;
}

// 5. If this is marked as primary, unmark other assignments for this context
if (validatedData.is_primary) {
  const { error: updateOthersError } = await supabase
.from('context_name_assignments')
.update({ is_primary: false })
.eq('context_id', validatedData.context_id)
.eq('user_id', authenticatedUserId)
.neq('id', assignmentResult.id);

  if (updateOthersError) {
console.warn(
  'Warning: Failed to update other assignments to non-primary:',
  updateOthersError,
);
// Don't fail the request, but log the warning
  }
}

return createSuccessResponse(
  {
message: existingAssignment
  ? 'Context assignment updated successfully'
  : 'Context assignment created successfully',
assignment: {
  id: assignmentResult.id,
  context_id: assignmentResult.context_id,
  name_id: assignmentResult.name_id,
  oidc_property: assignmentResult.oidc_property,
  is_primary: assignmentResult.is_primary,
  created_at: assignmentResult.created_at,
},
context: {
  id: contextData.id,
  name: contextData.context_name,
},
name: {
  id: nameData.id,
  text: nameData.name_text,
},
  },
  requestId,
  timestamp,
);
  } catch (error) {
console.error('Context assignment error:', error);

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
  'An unexpected error occurred while managing context assignment',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

/**
 * PUT /api/contexts/assign - Update existing context name assignment
 * Updates OIDC property and primary status of existing assignment
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

const authenticatedUserId = user.id;

// 1. Verify assignment exists and belongs to user
const { data: existingAssignment, error: fetchError } = await supabase
  .from('context_name_assignments')
  .select('id, context_id, name_id, oidc_property, is_primary')
  .eq('id', validatedData.assignment_id)
  .eq('user_id', authenticatedUserId)
  .maybeSingle();

if (fetchError) {
  console.error('Assignment fetch failed:', fetchError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
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
{ assignmentId: validatedData.assignment_id },
timestamp,
  );
}

// 2. Build update object
const updateData: TablesUpdate<'context_name_assignments'> = {};

if (validatedData.oidc_property) {
  updateData.oidc_property = validatedData.oidc_property;
}

if (validatedData.is_primary !== undefined) {
  updateData.is_primary = validatedData.is_primary;
}

// Only proceed if there are changes
if (Object.keys(updateData).length === 0) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'No update data provided',
requestId,
{},
timestamp,
  );
}

// 3. Update the assignment
const { data: updatedAssignment, error: updateError } = await supabase
  .from('context_name_assignments')
  .update(updateData)
  .eq('id', validatedData.assignment_id)
  .eq('user_id', authenticatedUserId)
  .select('*')
  .single();

if (updateError) {
  console.error('Assignment update failed:', updateError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to update assignment',
requestId,
{ error: updateError.message },
timestamp,
  );
}

// 4. If this is now marked as primary, unmark other assignments for this context
if (validatedData.is_primary) {
  const { error: updateOthersError } = await supabase
.from('context_name_assignments')
.update({ is_primary: false })
.eq('context_id', existingAssignment.context_id)
.eq('user_id', authenticatedUserId)
.neq('id', validatedData.assignment_id);

  if (updateOthersError) {
console.warn(
  'Warning: Failed to update other assignments to non-primary:',
  updateOthersError,
);
// Don't fail the request, but log the warning
  }
}

return createSuccessResponse(
  {
message: 'Assignment updated successfully',
assignment: updatedAssignment,
  },
  requestId,
  timestamp,
);
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
  'An unexpected error occurred while updating assignment',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

// Export the handlers with authentication wrapper
export const POST = withRequiredAuth(handlePOST);
export const PUT = withRequiredAuth(handlePUT);
