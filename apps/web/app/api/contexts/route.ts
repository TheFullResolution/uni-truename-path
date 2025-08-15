// TrueNamePath: Context Management API Route
// POST /api/contexts - Create new user context
// GET /api/contexts - List all user contexts with statistics
// Date: August 14, 2025
// Academic project REST API with authentication and validation

// NextRequest is implicitly used by the AuthenticatedHandler type
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../lib/api';
import { ErrorCodes } from '../../../lib/api';
// Removed unused import from centralized database types
import { z } from 'zod';

/**
 * Input validation schema for creating a context
 */
const CreateContextSchema = z.object({
  context_name: z
.string()
.min(1, 'Context name cannot be empty')
.max(100, 'Context name cannot exceed 100 characters')
.regex(/^[a-zA-Z0-9\s\-_]+$/, 'Context name contains invalid characters')
.transform((str) => str.trim()),
  description: z
.string()
.max(500, 'Description cannot exceed 500 characters')
.optional()
.nullable()
.transform((str) => str?.trim() || null),
});

/**
 * Response type for context with statistics - omits user_id for security
 */
interface ContextWithStats {
  id: string;
  context_name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  name_assignments_count: number;
  has_active_consents: boolean;
}

/**
 * POST /api/contexts - Create a new user context
 */
const handlePost: AuthenticatedHandler<{
  context: Omit<
ContextWithStats,
'name_assignments_count' | 'has_active_consents'
  >;
}> = async (request, context) => {
  try {
// Parse and validate request body
const body = await request.json();
const validatedData = CreateContextSchema.parse(body);

// Check if context name already exists for this user
const { data: existingContext, error: checkError } = await context.supabase
  .from('user_contexts')
  .select('id')
  .eq('user_id', context.user!.id)
  .eq('context_name', validatedData.context_name)
  .maybeSingle();

if (checkError) {
  console.error('Context existence check failed:', checkError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to check context existence',
context.requestId,
{ error: checkError.message },
context.timestamp,
  );
}

if (existingContext) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Context name already exists',
context.requestId,
{ context_name: validatedData.context_name },
context.timestamp,
  );
}

// Create the new context
const { data: newContext, error: createError } = await context.supabase
  .from('user_contexts')
  .insert({
user_id: context.user!.id,
context_name: validatedData.context_name,
description: validatedData.description,
  })
  .select('id, context_name, description, created_at, updated_at')
  .single();

if (createError) {
  console.error('Context creation failed:', createError);

  // Handle specific constraint violations
  if (createError.code === '23505') {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Context name already exists',
  context.requestId,
  { context_name: validatedData.context_name },
  context.timestamp,
);
  }

  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to create context',
context.requestId,
{ error: createError.message },
context.timestamp,
  );
}

return createSuccessResponse(
  { context: newContext },
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

console.error('Unexpected error in POST /api/contexts:', error);
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
 * GET /api/contexts - List all user contexts with statistics
 */
const handleGet: AuthenticatedHandler<{
  contexts: ContextWithStats[];
}> = async (request, context) => {
  try {
// Query contexts with statistics
// We need to get contexts and then calculate statistics separately
const { data: contexts, error: contextsError } = await context.supabase
  .from('user_contexts')
  .select('id, context_name, description, created_at, updated_at')
  .eq('user_id', context.user!.id)
  .order('created_at', { ascending: false });

if (contextsError) {
  console.error('Failed to fetch contexts:', contextsError);
  return createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to fetch contexts',
context.requestId,
{ error: contextsError.message },
context.timestamp,
  );
}

// For each context, get statistics
const contextsWithStats: ContextWithStats[] = await Promise.all(
  contexts.map(async (contextRecord) => {
// Get name assignments count
const { count: assignmentsCount, error: assignmentsError } =
  await context.supabase
.from('context_name_assignments')
.select('*', { count: 'exact', head: true })
.eq('context_id', contextRecord.id);

if (assignmentsError) {
  console.error(
`Failed to count assignments for context ${contextRecord.id}:`,
assignmentsError,
  );
  // Continue with 0 count rather than failing the entire request
}

// Check for active consents
const { data: activeConsents, error: consentsError } =
  await context.supabase
.from('consents')
.select('id')
.eq('context_id', contextRecord.id)
.eq('status', 'GRANTED')
.limit(1);

if (consentsError) {
  console.error(
`Failed to check consents for context ${contextRecord.id}:`,
consentsError,
  );
  // Continue with false rather than failing the entire request
}

return {
  ...contextRecord,
  name_assignments_count: assignmentsCount || 0,
  has_active_consents: (activeConsents?.length || 0) > 0,
};
  }),
);

return createSuccessResponse(
  { contexts: contextsWithStats },
  context.requestId,
  context.timestamp,
);
  } catch (error) {
console.error('Unexpected error in GET /api/contexts:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'An unexpected error occurred',
  context.requestId,
  undefined,
  context.timestamp,
);
  }
};

// Export the handler wrapped with authentication
export const POST = withRequiredAuth(handlePost);
export const GET = withRequiredAuth(handleGet);
