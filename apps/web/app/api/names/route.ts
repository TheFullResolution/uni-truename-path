// TrueNamePath: Names Creation API Route
// POST /api/names - Create a new name variant for the authenticated user
// Date: December 2024
// Academic project REST API with authentication and validation

import type { Name, NameCategory } from '@/types/database';
import {
  type AuthenticatedHandler,
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  withRequiredAuth,
} from '@/utils/api';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { NAME_CATEGORIES } from './types';

/**
 * Request body validation schema for name creation
 */
const CreateNameSchema = z.object({
  name_text: z
.string()
.trim()
.min(1, 'Name text is required')
.max(100, 'Name text cannot exceed 100 characters'),

  name_type: z.enum(NAME_CATEGORIES),

  is_preferred: z.boolean().default(false),
});

/**
 * Request body validation schema for name updates
 */
const UpdateNameSchema = z.object({
  name_id: z.string().uuid('Name ID must be a valid UUID'),
  is_preferred: z.boolean().optional(),
  name_text: z
.string()
.trim()
.min(1, 'Name text is required')
.max(100, 'Name text cannot exceed 100 characters')
.optional(),
  name_type: z.enum(NAME_CATEGORIES).optional(),
});

/**
 * Request body validation schema for name deletion
 */
const DeleteNameSchema = z.object({
  name_id: z.string().uuid('Name ID must be a valid UUID'),
});

/**
 * Query parameter validation schema for filtering and pagination (GET)
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

  nameType: z.enum(NAME_CATEGORIES).nullable().optional(),
});

/**
 * Name variant interface based on centralized database types
 * Using snake_case to match component expectations
 */
interface NameVariant {
  id: string;
  name_text: string;
  name_type: NameCategory;
  is_preferred: boolean;
  source: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * API Response interface for GET endpoint
 */
interface NamesResponseData {
  names: NameVariant[];
  total: number;
  metadata: {
retrievalTimestamp: string;
filterApplied?: {
  nameType?: string;
  limit?: number;
};
userId: string;
  };
}

// Type inference for schema validation
type QueryParams = z.infer<typeof QueryParamsSchema>;
// type CreateNameRequest = z.infer<typeof CreateNameSchema>;

/**
 * GET /api/names - Retrieve all name variants for authenticated user
 * Returns all name variants for the authenticated user with optional filtering
 */
const handleGET: AuthenticatedHandler<NamesResponseData> = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  // 1. Query parameter validation
  const url = new URL(request.url);
  const queryParams = {
limit: url.searchParams.get('limit'),
nameType: url.searchParams.get('nameType'),
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

  // 3. Database query with authenticated client
  let query = supabase
.from('names')
.select('*')
.eq('user_id', authenticatedUserId);

  // Apply optional filters
  if (validatedQueryParams.nameType) {
query = query.eq(
  'name_type',
  validatedQueryParams.nameType as NameCategory,
);
  }

  if (validatedQueryParams.limit) {
query = query.limit(validatedQueryParams.limit);
  }

  // Order by creation date (newest first) and preferred status
  query = query
.order('is_preferred', { ascending: false })
.order('created_at', { ascending: false });

  const { data: namesData, error: queryError } = await query;

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

  // 4. Transform database results to API format (snake_case for component compatibility)
  const nameVariants: NameVariant[] = (namesData || []).map((name: Name) => ({
id: name.id,
name_text: name.name_text,
name_type: name.name_type,
is_preferred: name.is_preferred,
source: name.source,
created_at: name.created_at,
updated_at: name.updated_at,
  }));

  // 5. Success response with comprehensive metadata
  const responseData: NamesResponseData = {
names: nameVariants,
total: nameVariants.length,
metadata: {
  retrievalTimestamp: timestamp,
  filterApplied: {
nameType: validatedQueryParams.nameType || undefined,
limit: validatedQueryParams.limit,
  },
  userId: authenticatedUserId,
},
  };

  console.log(`API Request [${requestId}]:`, {
endpoint: '/api/names',
method: 'GET',
authenticatedUserId: authenticatedUserId.substring(0, 8) + '...',
totalNames: nameVariants.length,
filtersApplied: Object.keys(validatedQueryParams).filter(
  (key) => validatedQueryParams[key as keyof QueryParams] !== undefined,
).length,
  });

  return createSuccessResponse(responseData, requestId, timestamp);
};

/**
 * POST /api/names - Create a new name variant
 * Creates a new name variant for the authenticated user's profile
 */
const handlePOST: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// Parse and validate request body
const body = await request.json();
const validatedData = CreateNameSchema.parse(body);

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

// Get user's profile
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

// Check if setting as preferred and unset other preferred names
if (validatedData.is_preferred) {
  const { error: unsetError } = await supabase
.from('names')
.update({ is_preferred: false })
.eq('user_id', profile.id);

  if (unsetError) {
console.error('Error unsetting previous preferred names:', unsetError);
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to update preferred name status',
  requestId,
  { error: unsetError.message },
  timestamp,
);
  }
}

// Create the new name variant
const { data: newName, error: createError } = await supabase
  .from('names')
  .insert({
user_id: profile.id,
name_text: validatedData.name_text,
name_type: validatedData.name_type as
  | 'LEGAL'
  | 'PREFERRED'
  | 'NICKNAME'
  | 'ALIAS'
  | 'PROFESSIONAL'
  | 'CULTURAL', // Type assertion for enum values
is_preferred: validatedData.is_preferred,
created_at: new Date().toISOString(),
  })
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
  name_type: newName.name_type,
  is_preferred: newName.is_preferred,
  created_at: newName.created_at,
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
  'An unexpected error occurred while creating the name variant',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

/**
 * PUT /api/names - Update a name variant
 * Updates a specific name variant for the authenticated user
 */
const handlePUT: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// Parse and validate request body
const body = await request.json();
const validatedData = UpdateNameSchema.parse(body);

// Check if the name exists and belongs to the user
const { data: existingName, error: fetchError } = await supabase
  .from('names')
  .select('id, name_text, name_type, is_preferred, user_id')
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

// If setting as preferred, unset other preferred names
if (validatedData.is_preferred === true) {
  const { error: unsetError } = await supabase
.from('names')
.update({ is_preferred: false })
.eq('user_id', user!.id)
.neq('id', validatedData.name_id);

  if (unsetError) {
console.error('Error unsetting other preferred names:', unsetError);
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to update preferred name status',
  requestId,
  { error: unsetError.message },
  timestamp,
);
  }
}

// Build update object
const updateData: Partial<{
  name_text: string;
  name_type: NameCategory;
  is_preferred: boolean;
  updated_at: string;
}> = {
  updated_at: new Date().toISOString(),
};

if (validatedData.name_text) {
  updateData.name_text = validatedData.name_text;
}

if (validatedData.name_type) {
  updateData.name_type = validatedData.name_type as NameCategory;
}

if (validatedData.is_preferred !== undefined) {
  updateData.is_preferred = validatedData.is_preferred;
}

// Update the name
const { data: updatedName, error: updateError } = await supabase
  .from('names')
  .update(updateData)
  .eq('id', validatedData.name_id)
  .eq('user_id', user!.id)
  .select('id, name_text, name_type, is_preferred, created_at, updated_at')
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
  'An unexpected error occurred while updating the name variant',
  requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  timestamp,
);
  }
};

/**
 * DELETE /api/names - Delete a name variant
 * Deletes a specific name variant for the authenticated user
 */
const handleDELETE: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
// Parse and validate request body
const body = await request.json();
const validatedData = DeleteNameSchema.parse(body);

// Check if the name exists and belongs to the user
const { data: existingName, error: fetchError } = await supabase
  .from('names')
  .select('id, name_text, name_type, is_preferred, created_at, updated_at')
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

// Check if this is the user's only name
const { count: totalNames, error: countError } = await supabase
  .from('names')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user!.id);

if (countError) {
  console.error('Failed to count user names:', countError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to validate deletion',
requestId,
{ error: countError.message },
timestamp,
  );
}

if ((totalNames || 0) <= 1) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Cannot delete your only name variant',
requestId,
{ totalNames },
timestamp,
  );
}

// If deleting the preferred name and there are other names, auto-set another as preferred
const isPreferredName = existingName.is_preferred;

// Proceed with deletion
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

// If we deleted the preferred name and there are other names, auto-set another as preferred
if (isPreferredName && (totalNames || 0) > 1) {
  const { data: remainingNames, error: remainingNamesError } =
await supabase
  .from('names')
  .select('id')
  .eq('user_id', user!.id)
  .limit(1);

  if (!remainingNamesError && remainingNames && remainingNames.length > 0) {
const { error: updatePreferredError } = await supabase
  .from('names')
  .update({ is_preferred: true })
  .eq('id', remainingNames[0].id)
  .eq('user_id', user!.id);

if (updatePreferredError) {
  console.error(
'Error setting new preferred name:',
updatePreferredError,
  );
  // Don't fail the deletion, just log the error
}
  }
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
  'An unexpected error occurred while deleting the name variant',
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
