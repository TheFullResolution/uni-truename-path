import type { ContextWithStats } from './types';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  type AuthenticatedHandler,
  ErrorCodes,
} from '@/utils/api';
import { fetchContextsWithStats } from '@/utils/server/contexts';
import { filterAvailableContexts } from '@/utils/contexts/filtering';
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
  // visibility field removed - simplified context model
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

  // Create context - simplified schema without visibility
  const { data: newContext, error: insertError } = await context.supabase
.from('user_contexts')
.insert({
  user_id: context.user!.id,
  context_name: body.context_name,
  description: body.description,
  // is_permanent defaults to FALSE (only "Public" context should be permanent)
  // visibility removed - all contexts are validated by completeness only
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

  try {
// Parse query parameters
const url = new URL(request.url);
const filter = url.searchParams.get('filter');

// Use centralized utility for fetching contexts with stats
const contextsWithStats = await fetchContextsWithStats(
  context.supabase,
  context.user!.id,
);

// Apply filtering if requested
let filteredContexts = contextsWithStats;
if (filter === 'complete') {
  filteredContexts = filterAvailableContexts(contextsWithStats);
}

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
  filteredContexts,
  context.requestId,
  context.timestamp,
);
  } catch (error) {
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to fetch contexts',
  context.requestId,
  error instanceof Error ? error.message : 'Unknown error',
  context.timestamp,
);
  }
};

export const POST = withRequiredAuth(handlePost);
export const GET = withRequiredAuth(handleGet);
export const PUT = () => handle_method_not_allowed(['POST', 'GET']);
export const DELETE = PUT;
export const PATCH = PUT;
