// Individual Context Management API Route
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  validate_uuid,
  type AuthenticatedHandler,
  ErrorCodes,
} from '@/utils/api';
import { z } from 'zod';

const UpdateContextSchema = z.object({
  context_name: z
.string()
.min(1)
.max(100)
.regex(/^[a-zA-Z0-9\s\-_]+$/)
.trim()
.optional(),
  description: z
.string()
.max(500)
.nullable()
.transform((str) => str?.trim() || null)
.optional(),
});

const handlePut: AuthenticatedHandler = async (request, context) => {
  const contextId = request.url.split('/').pop()!;

  if (!validate_uuid(contextId)) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid context ID',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  const body = UpdateContextSchema.parse(await request.json());

  // Check ownership and duplicate name in one query
  const [{ data: existing }, { data: duplicate }] = await Promise.all([
context.supabase
  .from('user_contexts')
  .select('*')
  .eq('id', contextId)
  .eq('user_id', context.user!.id)
  .maybeSingle(),
body.context_name
  ? context.supabase
  .from('user_contexts')
  .select('id')
  .eq('user_id', context.user!.id)
  .eq('context_name', body.context_name)
  .neq('id', contextId)
  .maybeSingle()
  : Promise.resolve({ data: null }),
  ]);

  if (!existing) {
return createErrorResponse(
  ErrorCodes.NOT_FOUND,
  'Context not found',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  if (duplicate) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Context name already exists',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  // Prevent renaming permanent contexts (Public context)
  if (
existing.is_permanent &&
body.context_name &&
body.context_name !== existing.context_name
  ) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Cannot rename the Public context',
  context.requestId,
  {
current_name: existing.context_name,
attempted_name: body.context_name,
  },
  context.timestamp,
);
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
updated_at: new Date().toISOString(),
  };

  if (body.context_name !== undefined) {
updateData.context_name = body.context_name;
  }
  if (body.description !== undefined) {
updateData.description = body.description;
  }

  // Update context
  const { data: updated } = await context.supabase
.from('user_contexts')
.update(updateData)
.eq('id', contextId)
.eq('user_id', context.user!.id)
.select()
.single();

  return createSuccessResponse(updated, context.requestId, context.timestamp);
};

const handleDelete: AuthenticatedHandler = async (request, context) => {
  const url = new URL(request.url);
  const contextId = url.pathname.split('/').pop()!;
  const force = url.searchParams.get('force') === 'true';

  if (!validate_uuid(contextId)) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid context ID',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  // Check ownership
  const { data: existing } = await context.supabase
.from('user_contexts')
.select('*')
.eq('id', contextId)
.eq('user_id', context.user!.id)
.maybeSingle();

  if (!existing) {
return createErrorResponse(
  ErrorCodes.NOT_FOUND,
  'Context not found',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  // Prevent deletion of permanent contexts (Public context)
  if (existing.is_permanent) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Cannot delete the Public context',
  context.requestId,
  {
context_name: existing.context_name,
suggestion: 'Public context cannot be deleted as it is permanent',
  },
  context.timestamp,
);
  }

  // Check dependencies if not forcing
  if (!force) {
const { count: appAssignments } = await context.supabase
  .from('app_context_assignments')
  .select('*', { count: 'exact', head: true })
  .eq('context_id', contextId);

if ((appAssignments || 0) > 0) {
  return createSuccessResponse(
{
  context: existing,
  requires_force: true,
  impacts: {
app_assignments: appAssignments || 0,
  },
  message: 'Use ?force=true to delete with dependencies',
},
context.requestId,
context.timestamp,
  );
}
  }

  // Delete context (cascade will handle related data)
  await context.supabase
.from('user_contexts')
.delete()
.eq('id', contextId)
.eq('user_id', context.user!.id);

  return createSuccessResponse(
{ deleted_id: contextId },
context.requestId,
context.timestamp,
  );
};

export const PUT = withRequiredAuth(handlePut);
export const DELETE = withRequiredAuth(handleDelete);
export const GET = () => handle_method_not_allowed(['PUT', 'DELETE']);
export const POST = GET;
export const PATCH = GET;
