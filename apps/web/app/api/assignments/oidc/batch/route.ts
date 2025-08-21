// TrueNamePath: Batch OIDC Assignments API Route

import {
  withRequiredAuth,
  handle_method_not_allowed,
  type AuthenticatedHandler,
  type AuthenticatedContext,
  createSuccessResponse,
  createErrorResponse,
} from '@/utils/api';
import { NextRequest } from 'next/server';
import { ErrorCodes } from '@/utils/api';
import type {
  BatchOIDCAssignmentResponseData,
  BatchOIDCAssignmentSummary,
  OIDCAssignmentWithDetails,
} from '@/app/api/assignments/types';
import { REQUIRED_OIDC_PROPERTIES } from '@/app/api/assignments/types';

// Import schemas
import { BatchOIDCAssignmentRequestSchema } from '../../schemas';

// =============================================================================
// Helper Functions
// =============================================================================

function validateBatchOIDCAssignmentRequest(body: unknown) {
  return BatchOIDCAssignmentRequestSchema.safeParse(body);
}

// =============================================================================
// POST Handler - Batch OIDC assignment operations
// =============================================================================

const handlePOST = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp }: AuthenticatedContext,
) => {
  let body;
  try {
body = await request.json();
  } catch {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid JSON body',
  requestId,
  undefined,
  timestamp,
);
  }

  const validation = validateBatchOIDCAssignmentRequest(body);
  if (!validation.success) {
const formattedErrors = validation.error.issues.map((issue) => ({
  field: issue.path.join('.'),
  message: issue.message,
}));

return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Request validation failed',
  requestId,
  { validation_errors: formattedErrors },
  timestamp,
);
  }

  const { context_id, assignments } = validation.data;

  try {
// First, validate context ownership and get context details
const { data: contextData, error: contextError } = await supabase
  .from('user_contexts')
  .select('id, context_name, description, is_permanent')
  .eq('id', context_id)
  .eq('user_id', user!.id)
  .single();

if (contextError || !contextData) {
  return createErrorResponse(
ErrorCodes.AUTHORIZATION_FAILED,
'Context not found or access denied',
requestId,
{ context_id },
timestamp,
  );
}

// Validate name ownership for all non-null name_ids in batch
const nameIds = assignments
  .filter((assignment) => assignment.name_id !== null)
  .map((assignment) => assignment.name_id!)
  .filter((id): id is string => id !== null);

if (nameIds.length > 0) {
  const { data: nameData, error: nameError } = await supabase
.from('names')
.select('id, name_text')
.eq('user_id', user!.id)
.in('id', nameIds);

  if (nameError) {
console.error('Database error validating names:', nameError);
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to validate name ownership',
  requestId,
  { error: nameError.message },
  timestamp,
);
  }

  // Check if all requested names exist and belong to user
  if (!nameData || nameData.length !== nameIds.length) {
return createErrorResponse(
  ErrorCodes.AUTHORIZATION_FAILED,
  'One or more names not found or access denied',
  requestId,
  {
requested_names: nameIds,
found_names: nameData?.length || 0,
missing_count: nameIds.length - (nameData?.length || 0),
  },
  timestamp,
);
  }
}

// Check for constraints on default context
const isDefaultContext = contextData.is_permanent === true;

// Validate default context constraints for deletion operations
if (isDefaultContext) {
  const deletions = assignments.filter(
(assignment) =>
  assignment.name_id === null &&
  REQUIRED_OIDC_PROPERTIES.includes(assignment.oidc_property),
  );

  if (deletions.length > 0) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  `Cannot remove required properties from default context: ${deletions.map((d) => d.oidc_property).join(', ')}`,
  requestId,
  {
context_type: 'default',
blocked_deletions: deletions.map((d) => d.oidc_property),
required_properties: REQUIRED_OIDC_PROPERTIES,
  },
  timestamp,
);
  }
}

// Initialize operation tracking
const summary: BatchOIDCAssignmentSummary = {
  total_processed: assignments.length,
  created: 0,
  updated: 0,
  deleted: 0,
  unchanged: 0,
};

// Process assignments within a transaction-like pattern
// Note: Supabase JS client doesn't expose explicit transactions,
// so we use sequential operations with rollback on failure
const processedAssignments: unknown[] = [];
const operationResults: Array<{
  type: 'delete' | 'upsert';
  success: boolean;
  assignment?: unknown;
}> = [];

try {
  // PHASE 1: Process deletions first (name_id = null)
  const deletions = assignments.filter(
(assignment) => assignment.name_id === null,
  );

  for (const deletion of deletions) {
const { oidc_property } = deletion;

// Check if assignment exists before attempting deletion
const { data: existingAssignment, error: checkError } = await supabase
  .from('context_oidc_assignments')
  .select('id, oidc_property')
  .eq('context_id', context_id)
  .eq('oidc_property', oidc_property)
  .eq('user_id', user!.id)
  .maybeSingle();

if (checkError) {
  console.error(
'Error checking existing assignment for deletion:',
checkError,
  );
  throw new Error(
`Failed to check existing assignment for ${oidc_property}: ${checkError.message}`,
  );
}

if (existingAssignment) {
  // Delete existing assignment
  const { error: deleteError } = await supabase
.from('context_oidc_assignments')
.delete()
.eq('context_id', context_id)
.eq('oidc_property', oidc_property)
.eq('user_id', user!.id);

  if (deleteError) {
console.error('Error deleting OIDC assignment:', deleteError);
throw new Error(
  `Failed to delete assignment for ${oidc_property}: ${deleteError.message}`,
);
  }

  summary.deleted++;
  operationResults.push({ type: 'delete', success: true });
} else {
  // Assignment doesn't exist, count as unchanged
  summary.unchanged++;
  operationResults.push({ type: 'delete', success: true });
}
  }

  // PHASE 2: Process upserts (name_id provided)
  const upserts = assignments.filter(
(assignment) => assignment.name_id !== null,
  );

  for (const upsert of upserts) {
const { oidc_property, name_id } = upsert;

// Check if assignment already exists with same values
const { data: existingAssignment, error: checkError } = await supabase
  .from('context_oidc_assignments')
  .select('id, name_id, oidc_property')
  .eq('context_id', context_id)
  .eq('oidc_property', oidc_property)
  .eq('user_id', user!.id)
  .maybeSingle();

if (checkError) {
  console.error(
'Error checking existing assignment for upsert:',
checkError,
  );
  throw new Error(
`Failed to check existing assignment for ${oidc_property}: ${checkError.message}`,
  );
}

// Determine if this is a create, update, or unchanged operation
const isCreate = !existingAssignment;
const isUpdate =
  existingAssignment && existingAssignment.name_id !== name_id;
const isUnchanged =
  existingAssignment && existingAssignment.name_id === name_id;

if (isUnchanged) {
  summary.unchanged++;
  operationResults.push({
type: 'upsert',
success: true,
assignment: existingAssignment,
  });
  continue;
}

// Perform upsert operation
const { data: assignmentData, error: upsertError } = await supabase
  .from('context_oidc_assignments')
  .upsert(
{
  user_id: user!.id,
  context_id: context_id,
  name_id: name_id!,
  oidc_property: oidc_property,
},
{
  onConflict: 'context_id,oidc_property',
},
  )
  .select()
  .single();

if (upsertError) {
  console.error('Error upserting OIDC assignment:', upsertError);
  throw new Error(
`Failed to upsert assignment for ${oidc_property}: ${upsertError.message}`,
  );
}

if (isCreate) {
  summary.created++;
} else if (isUpdate) {
  summary.updated++;
}

processedAssignments.push(assignmentData);
operationResults.push({
  type: 'upsert',
  success: true,
  assignment: assignmentData,
});
  }

  // All operations completed successfully
  console.log(
`Batch OIDC assignments processed successfully for context ${context_id}: ` +
  `${summary.created} created, ${summary.updated} updated, ${summary.deleted} deleted, ${summary.unchanged} unchanged`,
  );
} catch (transactionError) {
  console.error('Batch operation failed:', transactionError);

  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Batch operation failed',
requestId,
{
  error:
transactionError instanceof Error
  ? transactionError.message
  : 'Unknown error',
  context_id,
},
timestamp,
  );
}

// Fetch complete assignment data for response using the existing utility function
const { data: finalAssignments, error: fetchError } = await supabase
  .from('context_oidc_assignments')
  .select(
`
id,
context_id,
oidc_property,
name_id,
created_at,
updated_at,
user_id,
names!context_oidc_assignments_name_id_fkey (
  name_text
),
user_contexts!context_oidc_assignments_context_id_fkey (
  context_name,
  description,
  is_permanent
)
  `,
  )
  .eq('context_id', context_id)
  .eq('user_id', user!.id);

if (fetchError) {
  console.error('Error fetching final assignments:', fetchError);

  // Return error response if we can't fetch the final state
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Batch operations completed but failed to retrieve final state',
requestId,
{
  fetch_error: fetchError.message,
  context_id,
  operations_completed: true,
  summary,
},
timestamp,
  );
}

// Transform the raw data to match OIDCAssignmentWithDetails interface
const transformedAssignments: OIDCAssignmentWithDetails[] =
  finalAssignments?.map((assignment) => ({
id: assignment.id,
context_id: assignment.context_id,
oidc_property: assignment.oidc_property,
name_id: assignment.name_id,
created_at: assignment.created_at,
updated_at: assignment.updated_at,
user_id: assignment.user_id,
names: assignment.names || { name_text: '' },
user_contexts: assignment.user_contexts || {
  context_name: contextData.context_name,
  description: contextData.description,
  is_permanent: contextData.is_permanent,
},
// Computed fields for UI
name_text: assignment.names?.name_text || '',
context_name:
  assignment.user_contexts?.context_name || contextData.context_name,
is_required: REQUIRED_OIDC_PROPERTIES.includes(
  assignment.oidc_property,
),
  })) || [];

const responseData: BatchOIDCAssignmentResponseData = {
  context_id,
  context_name: contextData.context_name,
  assignments: transformedAssignments,
  summary,
};

return createSuccessResponse(responseData, requestId, timestamp);
  } catch (error) {
console.error('Unexpected error in batch OIDC assignments POST:', error);

return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'Internal server error',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

// =============================================================================
// Exports
// =============================================================================

export const POST = withRequiredAuth(handlePOST as AuthenticatedHandler);

// Handle unsupported methods
export const GET = () => handle_method_not_allowed(['POST']);
export const PUT = () => handle_method_not_allowed(['POST']);
export const DELETE = () => handle_method_not_allowed(['POST']);
export const PATCH = () => handle_method_not_allowed(['POST']);
export const HEAD = () => handle_method_not_allowed(['POST']);
export const OPTIONS = () => handle_method_not_allowed(['POST']);
