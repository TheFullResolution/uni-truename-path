// TrueNamePath: Individual Context Management API Route
// PUT /api/contexts/[id] - Update context name/description
// DELETE /api/contexts/[id] - Delete context with safeguards
// Date: August 14, 2025
// Academic project REST API with authentication and validation

// NextRequest is implicitly used by the AuthenticatedHandler type
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../../lib/api/with-auth';
import { ErrorCodes } from '../../../../lib/api/types';
import { z } from 'zod';

/**
 * Input validation schema for updating a context
 */
const UpdateContextSchema = z.object({
  contextName: z
.string()
.min(1, 'Context name cannot be empty')
.max(100, 'Context name cannot exceed 100 characters')
.regex(/^[a-zA-Z0-9\s\-_]+$/, 'Context name contains invalid characters')
.transform((str) => str.trim())
.optional(),
  description: z
.string()
.max(500, 'Description cannot exceed 500 characters')
.nullable()
.transform((str) => str?.trim() || null)
.optional(),
});

/**
 * Context response type
 */
interface ContextResponse {
  id: string;
  context_name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Deletion safeguards response type
 */
interface DeletionSafeguards {
  name_assignments_count: number;
  active_consents_count: number;
  can_delete: boolean;
  deletion_impacts: string[];
}

/**
 * PUT /api/contexts/[id] - Update context name and/or description
 */
const handlePut: AuthenticatedHandler<{ context: ContextResponse }> = async (
  request,
  context,
) => {
  try {
// Extract context ID from URL path
const url = new URL(request.url);
const pathSegments = url.pathname.split('/');
const contextId = pathSegments[pathSegments.length - 1];

// Validate UUID format
if (
  !contextId.match(
/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )
) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid context ID format',
context.requestId,
undefined,
context.timestamp,
  );
}

// Parse and validate request body
const body = await request.json();
const validatedData = UpdateContextSchema.parse(body);

// Check if no updates were provided
if (!validatedData.contextName && validatedData.description === undefined) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'At least one field (contextName or description) must be provided for update',
context.requestId,
undefined,
context.timestamp,
  );
}

// Check if the context exists and belongs to the user
const { data: existingContext, error: fetchError } = await context.supabase
  .from('user_contexts')
  .select('id, context_name, description')
  .eq('id', contextId)
  .eq('user_id', context.user!.id)
  .maybeSingle();

if (fetchError) {
  console.error('Context fetch failed:', fetchError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to fetch context',
context.requestId,
{ error: fetchError.message },
context.timestamp,
  );
}

if (!existingContext) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Context not found or access denied',
context.requestId,
undefined,
context.timestamp,
  );
}

// If updating context name, check for duplicates
if (
  validatedData.contextName &&
  validatedData.contextName !== existingContext.context_name
) {
  const { data: duplicateContext, error: duplicateError } =
await context.supabase
  .from('user_contexts')
  .select('id')
  .eq('user_id', context.user!.id)
  .eq('context_name', validatedData.contextName)
  .neq('id', contextId)
  .maybeSingle();

  if (duplicateError) {
console.error('Duplicate context check failed:', duplicateError);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to check for duplicate context names',
  context.requestId,
  { error: duplicateError.message },
  context.timestamp,
);
  }

  if (duplicateContext) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Context name already exists',
  context.requestId,
  { contextName: validatedData.contextName },
  context.timestamp,
);
  }
}

// Build update object
const updateData: Partial<{
  context_name: string;
  description: string | null;
  updated_at: string;
}> = {
  updated_at: new Date().toISOString(),
};

if (validatedData.contextName) {
  updateData.context_name = validatedData.contextName;
}

if (validatedData.description !== undefined) {
  updateData.description = validatedData.description;
}

// Update the context
const { data: updatedContext, error: updateError } = await context.supabase
  .from('user_contexts')
  .update(updateData)
  .eq('id', contextId)
  .eq('user_id', context.user!.id)
  .select('id, context_name, description, created_at, updated_at')
  .single();

if (updateError) {
  console.error('Context update failed:', updateError);

  // Handle specific constraint violations
  if (updateError.code === '23505') {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Context name already exists',
  context.requestId,
  { contextName: validatedData.contextName },
  context.timestamp,
);
  }

  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to update context',
context.requestId,
{ error: updateError.message },
context.timestamp,
  );
}

return createSuccessResponse(
  { context: updatedContext },
  context.requestId,
  context.timestamp,
);
  } catch (error) {
// Handle Zod validation errors
if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request data',
context.requestId,
{ validation_errors: error.issues },
context.timestamp,
  );
}

// Handle JSON parsing errors
if (error instanceof SyntaxError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid JSON in request body',
context.requestId,
undefined,
context.timestamp,
  );
}

console.error('Unexpected error in PUT /api/contexts/[id]:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'An unexpected error occurred',
  context.requestId,
  undefined,
  context.timestamp,
);
  }
};

/**
 * DELETE /api/contexts/[id] - Delete context with comprehensive safeguards
 */
const handleDelete: AuthenticatedHandler<{
  context: ContextResponse;
  safeguards: DeletionSafeguards;
}> = async (request, context) => {
  try {
// Extract context ID from URL path
const url = new URL(request.url);
const pathSegments = url.pathname.split('/');
const contextId = pathSegments[pathSegments.length - 1];

// Validate UUID format
if (
  !contextId.match(
/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )
) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid context ID format',
context.requestId,
undefined,
context.timestamp,
  );
}

// Check if the context exists and belongs to the user
const { data: existingContext, error: fetchError } = await context.supabase
  .from('user_contexts')
  .select('id, context_name, description, created_at, updated_at')
  .eq('id', contextId)
  .eq('user_id', context.user!.id)
  .maybeSingle();

if (fetchError) {
  console.error('Context fetch failed:', fetchError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to fetch context',
context.requestId,
{ error: fetchError.message },
context.timestamp,
  );
}

if (!existingContext) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Context not found or access denied',
context.requestId,
undefined,
context.timestamp,
  );
}

// Check deletion safeguards
// 1. Count name assignments
const { count: assignmentsCount, error: assignmentsError } =
  await context.supabase
.from('context_name_assignments')
.select('*', { count: 'exact', head: true })
.eq('context_id', contextId);

if (assignmentsError) {
  console.error('Failed to count name assignments:', assignmentsError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to check name assignments',
context.requestId,
{ error: assignmentsError.message },
context.timestamp,
  );
}

// 2. Count active consents
const { count: activeConsentsCount, error: consentsError } =
  await context.supabase
.from('consents')
.select('*', { count: 'exact', head: true })
.eq('context_id', contextId)
.eq('status', 'GRANTED');

if (consentsError) {
  console.error('Failed to count active consents:', consentsError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to check active consents',
context.requestId,
{ error: consentsError.message },
context.timestamp,
  );
}

// Build deletion impacts list
const deletionImpacts: string[] = [];
if ((assignmentsCount || 0) > 0) {
  deletionImpacts.push(
`${assignmentsCount} name assignment(s) will be removed`,
  );
}
if ((activeConsentsCount || 0) > 0) {
  deletionImpacts.push(
`${activeConsentsCount} active consent(s) will be revoked`,
  );
}

const safeguards: DeletionSafeguards = {
  name_assignments_count: assignmentsCount || 0,
  active_consents_count: activeConsentsCount || 0,
  can_delete: true, // Always allow deletion with cascade
  deletion_impacts: deletionImpacts,
};

// Check if force deletion is required (query parameter)
const forceDelete = url.searchParams.get('force') === 'true';

// If there are impacts and force is not specified, return safeguards info
if (deletionImpacts.length > 0 && !forceDelete) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Context has dependencies that will be affected by deletion',
context.requestId,
{
  safeguards,
  message: 'Use ?force=true query parameter to proceed with deletion',
},
context.timestamp,
  );
}

// Proceed with deletion
// The database foreign key constraints with CASCADE will handle related data
const { error: deleteError } = await context.supabase
  .from('user_contexts')
  .delete()
  .eq('id', contextId)
  .eq('user_id', context.user!.id);

if (deleteError) {
  console.error('Context deletion failed:', deleteError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to delete context',
context.requestId,
{ error: deleteError.message },
context.timestamp,
  );
}

return createSuccessResponse(
  {
context: existingContext,
safeguards,
  },
  context.requestId,
  context.timestamp,
);
  } catch (error) {
console.error('Unexpected error in DELETE /api/contexts/[id]:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'An unexpected error occurred',
  context.requestId,
  undefined,
  context.timestamp,
);
  }
};

// Export the handlers wrapped with authentication
export const PUT = withRequiredAuth(handlePut);
export const DELETE = withRequiredAuth(handleDelete);
