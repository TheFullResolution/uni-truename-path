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
  visibility: z
.enum(['public', 'restricted', 'private'])
.optional()
.default('restricted'),
});
// Database function response interface for completeness data
// Database function response interface for completeness data
interface CompletenessResponse {
  is_complete?: boolean;
  missing_properties?: string[];
  completeness_details?: {
completion_percentage?: number;
  };
}

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
  visibility: body.visibility,
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
  const startTime = Date.now();

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

  // Batch fetch statistics and completeness data
  const [
{ data: assignments },
{ data: consents },
{ data: oidcAssignments },
...completenessResults
  ] = await Promise.all([
context.supabase
  .from('context_name_assignments')
  .select('context_id')
  .in('context_id', contextIds),
context.supabase
  .from('consents')
  .select('context_id')
  .in('context_id', contextIds)
  .eq('status', 'GRANTED'),
context.supabase
  .from('context_oidc_assignments')
  .select('context_id')
  .in('context_id', contextIds),
// Add completeness queries for each context
...contextIds.map((contextId) =>
  context.supabase.rpc('get_context_completeness_status', {
p_context_id: contextId,
  }),
),
  ]);

  // Build statistics maps
  const assignmentCounts = new Map<string, number>();
  const consentSet = new Set<string>();
  const oidcAssignmentCounts = new Map<string, number>();

  assignments?.forEach((a) =>
assignmentCounts.set(
  a.context_id,
  (assignmentCounts.get(a.context_id) || 0) + 1,
),
  );
  consents?.forEach((c) => consentSet.add(c.context_id));
  oidcAssignments?.forEach((o) =>
oidcAssignmentCounts.set(
  o.context_id,
  (oidcAssignmentCounts.get(o.context_id) || 0) + 1,
),
  );

  // Build completeness data map
  const completenessMap = new Map<
string,
{
  is_complete: boolean;
  missing_properties: string[];
  completion_percentage: number;
}
  >();

  completenessResults.forEach((result, index) => {
const contextId = contextIds[index];
if (result.data && typeof result.data === 'object') {
  const data = result.data as unknown as CompletenessResponse;
  completenessMap.set(contextId, {
is_complete: data.is_complete || false,
missing_properties: Array.isArray(data.missing_properties)
  ? data.missing_properties
  : [],
completion_percentage:
  data.completeness_details?.completion_percentage || 0,
  });
} else {
  // Fallback for any failed completeness checks
  completenessMap.set(contextId, {
is_complete: false,
missing_properties: ['name', 'given_name', 'family_name'],
completion_percentage: 0,
  });
}
  });

  // Return contexts with stats and completeness data
  const contextsWithStats: ContextWithStats[] = contexts.map((ctx) => {
const completeness = completenessMap.get(ctx.id) || {
  is_complete: false,
  missing_properties: ['name', 'given_name', 'family_name'],
  completion_percentage: 0,
};

return {
  ...ctx,
  name_assignments_count: assignmentCounts.get(ctx.id) || 0,
  has_active_consents: consentSet.has(ctx.id),
  oidc_assignment_count: oidcAssignmentCounts.get(ctx.id) || 0,
  is_complete: completeness.is_complete,
  missing_properties: completeness.missing_properties,
  completion_percentage: completeness.completion_percentage,
};
  });

  const responseTime = Date.now() - startTime;

  // Log performance metrics for monitoring
  if (responseTime > 500) {
console.warn(
  `Slow context API response: ${responseTime}ms for user ${context.user!.id}`,
);
  } else if (responseTime < 100) {
console.log(
  `Fast context API response: ${responseTime}ms for user ${context.user!.id}`,
);
  }

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
