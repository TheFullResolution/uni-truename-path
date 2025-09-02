// Context Deletion Validation API Route
// GET endpoint to check if a context can be deleted without performing deletion
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  validate_uuid,
  type AuthenticatedHandler,
  ErrorCodes,
} from '@/utils/api';

/**
 * Response interface for context can-delete endpoint
 */
interface CanDeleteContextResponse {
  can_delete: boolean;
  requires_force: boolean;
  impact?: {
app_assignments: number;
details: string[];
  };
}

const handleGET: AuthenticatedHandler = async (request, context) => {
  const contextId = request.url.split('/').slice(-2, -1)[0]; // Extract context ID from URL

  if (!validate_uuid(contextId)) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid context ID',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  // Check ownership and get context details
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

  // Check if it's a permanent context
  if (existing.is_permanent) {
const response: CanDeleteContextResponse = {
  can_delete: false,
  requires_force: false,
  impact: {
app_assignments: 0,
details: ['Cannot delete the default context as it is permanent'],
  },
};

return createSuccessResponse(
  response,
  context.requestId,
  context.timestamp,
);
  }

  // Check if any OAuth apps are using this context
  const { count: appAssignments } = await context.supabase
.from('app_context_assignments')
.select('*', { count: 'exact', head: true })
.eq('context_id', contextId);

  const appAssignmentCount = appAssignments || 0;
  const hasDependencies = appAssignmentCount > 0;

  const details: string[] = [];
  if (appAssignmentCount > 0) {
details.push(
  `${appAssignmentCount} connected app${appAssignmentCount === 1 ? '' : 's'} will be disconnected`,
);
  }

  const response: CanDeleteContextResponse = {
can_delete: true,
requires_force: hasDependencies,
impact: hasDependencies
  ? {
  app_assignments: appAssignmentCount,
  details,
}
  : undefined,
  };

  return createSuccessResponse(response, context.requestId, context.timestamp);
};

export const GET = withRequiredAuth(handleGET);
export const POST = () => handle_method_not_allowed(['GET']);
export const PUT = POST;
export const DELETE = POST;
export const PATCH = POST;
