// TrueNamePath: Bulk Context Assignments API Route
// POST /api/assignments/bulk - Bulk update context-name assignments
// Date: August 14, 2025
// Academic project REST API with authentication and validation

import { NextRequest } from 'next/server';
// Removed unused Database import
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../../lib/api/with-auth';
import { ErrorCodes } from '../../../../lib/api/types';
import { z } from 'zod';
// Import centralized API response types
import type {
  BulkAssignmentResponseData,
  AssignmentWithDetails,
} from '../../../../types/api-responses';

/**
 * Request body validation schema for bulk assignment operations
 */
const BulkAssignmentSchema = z.object({
  assignments: z
.array(
  z.object({
context_id: z.string().uuid('Context ID must be a valid UUID'),
name_id: z.string().uuid('Name ID must be a valid UUID').nullable(),
  }),
)
.min(1, 'At least one assignment is required')
.max(50, 'Maximum 50 assignments per request'),
});

/**
 * Type definitions for request and response data - now using centralized types
 */

/**
 * POST handler implementation for bulk assignment operations
 */
const bulkUpdateAssignments: AuthenticatedHandler<
  BulkAssignmentResponseData
> = async (request: NextRequest, context) => {
  const { supabase, user, requestId, timestamp } = context;
  try {
// Parse and validate request body
const body = await request.json();
const bodyResult = BulkAssignmentSchema.safeParse(body);

if (!bodyResult.success) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request body format',
requestId,
bodyResult.error.format(),
timestamp,
  );
}

const { assignments } = bodyResult.data;

// Get user ID from authenticated user
if (!user) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User not authenticated',
requestId,
undefined,
timestamp,
  );
}

const userId = user.id;

// Validate all context_ids belong to the user
const contextIds = assignments.map((a) => a.context_id);
const { data: userContexts, error: contextError } = await supabase
  .from('user_contexts')
  .select('id')
  .eq('user_id', userId)
  .in('id', contextIds);

if (contextError) {
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to validate user contexts',
requestId,
{ error: contextError.message },
timestamp,
  );
}

const validContextIds = new Set(userContexts.map((c) => c.id));
const invalidContexts = contextIds.filter((id) => !validContextIds.has(id));

if (invalidContexts.length > 0) {
  return createErrorResponse(
ErrorCodes.FORBIDDEN,
'Some contexts do not belong to the user',
requestId,
{ invalid_context_ids: invalidContexts },
timestamp,
  );
}

// Validate all name_ids belong to the user (when not null)
const nameIds = assignments
  .map((a) => a.name_id)
  .filter((id): id is string => id !== null);

if (nameIds.length > 0) {
  const { data: userNames, error: nameError } = await supabase
.from('names')
.select('id')
.eq('user_id', userId)
.in('id', nameIds);

  if (nameError) {
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to validate user names',
  requestId,
  { error: nameError.message },
  timestamp,
);
  }

  const validNameIds = new Set(userNames.map((n) => n.id));
  const invalidNames = nameIds.filter((id) => !validNameIds.has(id));

  if (invalidNames.length > 0) {
return createErrorResponse(
  ErrorCodes.FORBIDDEN,
  'Some names do not belong to the user',
  requestId,
  { invalid_name_ids: invalidNames },
  timestamp,
);
  }
}

// Pre-filter assignments to identify only those that represent actual changes
console.log(
  `[${requestId}] Starting pre-filtering of ${assignments.length} assignments`,
);

const { data: existingAssignments, error: existingError } = await supabase
  .from('context_name_assignments')
  .select('context_id, name_id')
  .eq('user_id', userId)
  .in('context_id', contextIds);

if (existingError) {
  console.error('Error fetching existing assignments:', existingError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to fetch existing assignments',
requestId,
{ error: existingError.message },
timestamp,
  );
}

// Create a map of existing assignments for quick lookup
const existingAssignmentMap = new Map<string, string | null>();
existingAssignments.forEach((existing) => {
  existingAssignmentMap.set(existing.context_id, existing.name_id);
});

// Filter assignments to process only those that represent actual changes
const assignmentsToProcess = assignments.filter((assignment) => {
  const { context_id, name_id } = assignment;
  const existingNameId = existingAssignmentMap.get(context_id);

  // Case 1: Deleting assignment (name_id = null)
  if (name_id === null) {
const shouldDelete = existingNameId !== undefined; // Assignment exists and should be deleted
if (!shouldDelete) {
  console.log(
`[${requestId}] Filtered out deletion for context ${context_id} - no existing assignment`,
  );
}
return shouldDelete;
  }

  // Case 2: Creating/updating assignment (name_id is not null)
  const shouldProcess = existingNameId !== name_id; // Different from existing or new assignment
  if (!shouldProcess) {
console.log(
  `[${requestId}] Filtered out assignment for context ${context_id} - name_id already set to ${name_id}`,
);
  }
  return shouldProcess;
});

console.log(
  `[${requestId}] Pre-filtering complete: ${assignmentsToProcess.length}/${assignments.length} assignments will be processed`,
);
console.log(
  `[${requestId}] Filtered assignments:`,
  assignmentsToProcess.map((a) => `${a.context_id}:${a.name_id}`),
);

// Process bulk assignment updates (only for filtered assignments)
let created = 0;
let updated = 0;
let deleted = 0;

for (const assignment of assignmentsToProcess) {
  const { context_id, name_id } = assignment;

  if (name_id === null) {
// Delete assignment (only processed if assignment actually exists)
console.log(
  `[${requestId}] Deleting assignment for context ${context_id}`,
);
const { error: deleteError } = await supabase
  .from('context_name_assignments')
  .delete()
  .eq('user_id', userId)
  .eq('context_id', context_id);

if (deleteError) {
  console.error(
`[${requestId}] Delete assignment error for context ${context_id}:`,
deleteError,
  );
  // Continue processing other assignments
} else {
  deleted++;
  console.log(
`[${requestId}] Successfully deleted assignment for context ${context_id}`,
  );
}
  } else {
// Determine if this is an update or create based on existing assignment map
const existingNameId = existingAssignmentMap.get(context_id);
const isUpdate = existingNameId !== undefined;

console.log(
  `[${requestId}] ${isUpdate ? 'Updating' : 'Creating'} assignment for context ${context_id} with name ${name_id}`,
);

// Upsert assignment (update or create)
// Use 'context_id' as conflict column since database has UNIQUE (context_id) constraint
const { error: upsertError } = await supabase
  .from('context_name_assignments')
  .upsert(
{
  user_id: userId,
  context_id,
  name_id,
  created_at: new Date().toISOString(),
},
{
  onConflict: 'context_id',
},
  );

if (upsertError) {
  console.error(
`[${requestId}] Upsert assignment error for context ${context_id}:`,
upsertError,
  );
  // Continue processing other assignments
} else {
  // Track based on pre-filtering determination
  if (isUpdate) {
updated++;
console.log(
  `[${requestId}] Successfully updated assignment for context ${context_id}`,
);
  } else {
created++;
console.log(
  `[${requestId}] Successfully created assignment for context ${context_id}`,
);
  }
}
  }
}

// Log processing summary
console.log(
  `[${requestId}] Bulk assignment processing complete: ${created} created, ${updated} updated, ${deleted} deleted`,
);

// Get all current assignments for response
const { data: finalAssignments, error: finalError } = await supabase
  .from('context_name_assignments')
  .select(
`
id,
context_id,
name_id,
created_at,
user_contexts!inner(
  context_name
),
names!inner(
  name_text,
  name_type
)
  `,
  )
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

if (finalError) {
  console.error('Final assignments query error:', finalError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve updated assignments',
requestId,
{ error: finalError.message },
timestamp,
  );
}

// Process final assignments data
const assignmentResults: AssignmentWithDetails[] = finalAssignments.map(
  (item: {
id: string;
context_id: string;
name_id: string;
created_at: string;
user_contexts: { context_name: string };
names: { name_text: string; name_type: string };
  }) => ({
id: item.id,
context_id: item.context_id,
context_name: item.user_contexts.context_name,
context_description: null, // Not fetched in bulk endpoint
name_id: item.name_id,
name_text: item.names.name_text,
name_type: item.names.name_type as AssignmentWithDetails['name_type'],
created_at: item.created_at,
  }),
);

// Prepare response data
const responseData: BulkAssignmentResponseData = {
  updated,
  created,
  deleted,
  assignments: assignmentResults,
};

return createSuccessResponse(responseData, requestId, timestamp);
  } catch (error) {
console.error('Unexpected error in bulk assignment operation:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'An unexpected error occurred during bulk assignment operation',
  requestId,
  { error: String(error) },
  timestamp,
);
  }
};

/**
 * Export the POST handler with authentication wrapper
 */
export const POST = withRequiredAuth(bulkUpdateAssignments);
