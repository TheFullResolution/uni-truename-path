// Names API Route

import {
  type AuthenticatedHandler,
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  withRequiredAuth,
} from '@/utils/api';
import { type CanDeleteNameResponse } from '@/types/database';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import type { TablesInsert, TablesUpdate } from '@/generated/database';
import type {
  NamesResponseData,
  NameWithAssignments,
  NameAssignment,
} from './types';

/**
 * Request body validation schema for name creation
 */
const CreateNameSchema = z.object({
  name_text: z
.string()
.trim()
.min(1, 'Name text is required')
.max(100, 'Name text cannot exceed 100 characters'),
});

const UpdateNameSchema = z.object({
  name_id: z.string().uuid('Name ID must be a valid UUID'),
  name_text: z
.string()
.trim()
.min(1, 'Name text is required')
.max(100, 'Name text cannot exceed 100 characters')
.optional(),
});

const DeleteNameSchema = z.object({
  name_id: z.string().uuid('Name ID must be a valid UUID'),
});

const QueryParamsSchema = z.object({
  limit: z
.string()
.nullable()
.optional()
.transform((val) => (val ? parseInt(val, 10) : undefined))
.refine((val) => !val || (val > 0 && val <= 100), {
  message: 'Limit must be between 1 and 100',
}),
});

type QueryParams = z.infer<typeof QueryParamsSchema>;

/**
 * GET /api/names - Retrieve all name variants for authenticated user
 */
const handleGET: AuthenticatedHandler<NamesResponseData> = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  const url = new URL(request.url);
  const queryParams = {
limit: url.searchParams.get('limit'),
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

  let namesQuery = supabase
.from('names')
.select('*')
.eq('user_id', authenticatedUserId);

  if (validatedQueryParams.limit) {
namesQuery = namesQuery.limit(validatedQueryParams.limit);
  }

  namesQuery = namesQuery
.order('is_preferred', { ascending: false })
.order('created_at', { ascending: false });

  const { data: namesData, error: queryError } = await namesQuery;

  if (queryError) {
console.error(`Database Query Error [${requestId}]:`, {
  error: queryError.message,
  code: queryError.code,
  details: queryError.details,
  hint: queryError.hint,
});

return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Database query failed',
  requestId,
  process.env.NODE_ENV === 'development'
? queryError.message
: 'Unable to retrieve name variants',
  timestamp,
);
  }

  const nameVariants = namesData || [];
  let nameVariantsWithAssignments: NameWithAssignments[] = nameVariants;

  if (nameVariants.length > 0) {
const nameIds = nameVariants.map((name) => name.id);

const { data: assignments, error: assignmentsError } = await supabase
  .from('context_oidc_assignments')
  .select(
`
name_id,
context_id,
oidc_property,
user_contexts!inner (
  id,
  context_name,
  is_permanent
)
  `,
  )
  .in('name_id', nameIds)
  .eq('user_id', authenticatedUserId);

if (assignmentsError) {
  console.error(`Assignments Query Error [${requestId}]:`, {
error: assignmentsError.message,
code: assignmentsError.code,
details: assignmentsError.details,
  });
}

const assignmentsByNameId = new Map<string, NameAssignment[]>();
(assignments || []).forEach((assignment) => {
  const nameId = assignment.name_id;
  if (!assignmentsByNameId.has(nameId)) {
assignmentsByNameId.set(nameId, []);
  }

  assignmentsByNameId.get(nameId)!.push({
context_id: assignment.context_id,
context_name: assignment.user_contexts.context_name,
is_permanent: assignment.user_contexts.is_permanent ?? false,
oidc_property: assignment.oidc_property,
  });
});

nameVariantsWithAssignments = nameVariants.map((name) => ({
  ...name,
  assignments: assignmentsByNameId.get(name.id) || [],
}));
  }

  const responseData: NamesResponseData = {
names: nameVariantsWithAssignments,
total: nameVariantsWithAssignments.length,
metadata: {
  retrieval_timestamp: timestamp,
  filter_applied: {
limit: validatedQueryParams.limit,
  },
  userId: authenticatedUserId,
},
  };

  console.log(`API Request [${requestId}]:`, {
endpoint: '/api/names',
method: 'GET',
authenticatedUserId: authenticatedUserId.substring(0, 8) + '...',
totalNames: nameVariantsWithAssignments.length,
namesWithAssignments: nameVariantsWithAssignments.filter(
  (n) => n.assignments && n.assignments.length > 0,
).length,
totalAssignments: nameVariantsWithAssignments.reduce(
  (total, name) => total + (name.assignments?.length || 0),
  0,
),
filtersApplied: Object.keys(validatedQueryParams).filter(
  (key) => validatedQueryParams[key as keyof QueryParams] !== undefined,
).length,
  });

  return createSuccessResponse(responseData, requestId, timestamp);
};

/**
 * POST /api/names - Create a new name variant
 */
const handlePOST: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
const body = await request.json();
const validatedData = CreateNameSchema.parse(body);

if (!user) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User authentication required',
requestId,
{},
timestamp,
  );
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id')
  .eq('id', user.id)
  .single();

if (profileError || !profile) {
  return createErrorResponse(
ErrorCodes.PROFILE_NOT_FOUND,
'User profile not found',
requestId,
{ profileId: user.id },
timestamp,
  );
}

const nameData: TablesInsert<'names'> = {
  user_id: profile.id,
  name_text: validatedData.name_text,
};

const { data: newName, error: createError } = await supabase
  .from('names')
  .insert(nameData)
  .select('*')
  .single();

if (createError || !newName) {
  console.error('Error creating name variant:', createError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to create name variant',
requestId,
{ error: createError?.message },
timestamp,
  );
}

return createSuccessResponse(
  {
message: 'Name variant created successfully',
name: {
  id: newName.id,
  name_text: newName.name_text,
  is_preferred: newName.is_preferred,
  created_at: newName.created_at,
  updated_at: newName.updated_at,
},
  },
  requestId,
  timestamp,
);
  } catch (error) {
console.error('Name creation error:', error);

if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request data',
requestId,
{ validationErrors: error.issues },
timestamp,
  );
}

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
  'An unexpected error occurred while creating the name variant',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

/**
 * PUT /api/names - Update a name variant
 */
const handlePUT: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
const body = await request.json();
const validatedData = UpdateNameSchema.parse(body);

const { data: existingName, error: fetchError } = await supabase
  .from('names')
  .select('id, name_text, is_preferred, user_id, created_at, updated_at')
  .eq('id', validatedData.name_id)
  .eq('user_id', user!.id)
  .maybeSingle();

if (fetchError) {
  console.error('Name fetch failed:', fetchError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
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

const updateData: TablesUpdate<'names'> = {
  updated_at: new Date().toISOString(),
};

if (validatedData.name_text) {
  updateData.name_text = validatedData.name_text;
}

const { data: updatedName, error: updateError } = await supabase
  .from('names')
  .update(updateData)
  .eq('id', validatedData.name_id)
  .eq('user_id', user!.id)
  .select('id, name_text, is_preferred, created_at, updated_at')
  .single();

if (updateError) {
  console.error('Name update failed:', updateError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to update name',
requestId,
{ error: updateError.message },
timestamp,
  );
}

return createSuccessResponse(
  {
message: 'Name variant updated successfully',
name: updatedName,
  },
  requestId,
  timestamp,
);
  } catch (error) {
console.error('Name update error:', error);

if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request data',
requestId,
{ validationErrors: error.issues },
timestamp,
  );
}

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
  'An unexpected error occurred while updating the name variant',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

/**
 * DELETE /api/names - Delete a name variant
 */
const handleDELETE: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
const body = await request.json();
const validatedData = DeleteNameSchema.parse(body);

const { data: existingName, error: fetchError } = await supabase
  .from('names')
  .select('id, name_text, is_preferred, created_at, updated_at')
  .eq('id', validatedData.name_id)
  .eq('user_id', user!.id)
  .maybeSingle();

if (fetchError) {
  console.error('Name fetch failed:', fetchError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
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

const { data: deletionCheck, error: checkError } = await supabase.rpc(
  'can_delete_name',
  {
p_user_id: user!.id,
p_name_id: validatedData.name_id,
  },
);

if (checkError) {
  console.error('Error checking name deletion permissions:', checkError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to validate deletion',
requestId,
{ error: checkError.message },
timestamp,
  );
}

const checkData = deletionCheck as unknown as CanDeleteNameResponse;
if (!checkData?.can_delete) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
checkData?.reason || 'Cannot delete this name variant',
requestId,
{
  reason: checkData?.reason,
  reason_code: checkData?.reason_code,
  protection_type: checkData?.protection_type,
  name_count: checkData?.name_count,
  context_info: checkData?.context_info,
},
timestamp,
  );
}

const { error: deleteError } = await supabase
  .from('names')
  .delete()
  .eq('id', validatedData.name_id)
  .eq('user_id', user!.id);

if (deleteError) {
  console.error('Name deletion failed:', deleteError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to delete name',
requestId,
{ error: deleteError.message },
timestamp,
  );
}

return createSuccessResponse(
  {
message: 'Name variant deleted successfully',
name: existingName,
  },
  requestId,
  timestamp,
);
  } catch (error) {
console.error('Name deletion error:', error);

if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request data',
requestId,
{ validationErrors: error.issues },
timestamp,
  );
}

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
  'An unexpected error occurred while deleting the name variant',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

export const GET = withRequiredAuth(handleGET, { enableLogging: true });
export const POST = withRequiredAuth(handlePOST);
export const PUT = withRequiredAuth(handlePUT);
export const DELETE = withRequiredAuth(handleDELETE);
