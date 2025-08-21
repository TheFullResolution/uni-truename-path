import type { ContextWithStats } from './types';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  type AuthenticatedHandler,
  ErrorCodes,
} from '@/utils/api';
import { z } from 'zod';

const CreateContextSchema = z.object({
  context_name: z
.string()
.min(1)
.max(100)
.regex(/^[a-zA-Z0-9\s\-_]+$/)
.trim(),
  description: z
.string()
.max(500)
.nullable()
.optional()
.transform((str) => str?.trim() || null),
});

const handlePost: AuthenticatedHandler = async (request, context) => {
  const body = CreateContextSchema.parse(await request.json());

  // Check for duplicate
  const { data: existing } = await context.supabase
.from('user_contexts')
.select('id')
.eq('user_id', context.user!.id)
.eq('context_name', body.context_name)
.maybeSingle();

  if (existing) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Context name already exists',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  // Create context - only use fields that exist in the database schema
  const { data: newContext, error: insertError } = await context.supabase
.from('user_contexts')
.insert({
  user_id: context.user!.id,
  context_name: body.context_name,
  description: body.description,
  // is_permanent defaults to FALSE (only "Default" context should be permanent)
})
.select()
.single();

  if (insertError) {
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to create context',
  context.requestId,
  insertError.message,
  context.timestamp,
);
  }

  return createSuccessResponse(
newContext,
context.requestId,
context.timestamp,
  );
};

const handleGet: AuthenticatedHandler<ContextWithStats[]> = async (
  request,
  context,
) => {
  // Get contexts
  const { data: contexts } = await context.supabase
.from('user_contexts')
.select('*')
.eq('user_id', context.user!.id)
.order('created_at', { ascending: false });

  if (!contexts?.length) {
return createSuccessResponse([], context.requestId, context.timestamp);
  }

  const contextIds = contexts.map((c) => c.id);

  // Batch fetch statistics
  const [{ data: assignments }, { data: consents }] = await Promise.all([
context.supabase
  .from('context_name_assignments')
  .select('context_id')
  .in('context_id', contextIds),
context.supabase
  .from('consents')
  .select('context_id')
  .in('context_id', contextIds)
  .eq('status', 'GRANTED'),
  ]);

  // Build statistics maps
  const assignmentCounts = new Map<string, number>();
  const consentSet = new Set<string>();

  assignments?.forEach((a) =>
assignmentCounts.set(
  a.context_id,
  (assignmentCounts.get(a.context_id) || 0) + 1,
),
  );
  consents?.forEach((c) => consentSet.add(c.context_id));

  // Return contexts with stats
  const contextsWithStats: ContextWithStats[] = contexts.map((ctx) => ({
...ctx,
name_assignments_count: assignmentCounts.get(ctx.id) || 0,
has_active_consents: consentSet.has(ctx.id),
  }));

  return createSuccessResponse(
contextsWithStats,
context.requestId,
context.timestamp,
  );
};

export const POST = withRequiredAuth(handlePost);
export const GET = withRequiredAuth(handleGet);
export const PUT = () => handle_method_not_allowed(['POST', 'GET']);
export const DELETE = PUT;
export const PATCH = PUT;
