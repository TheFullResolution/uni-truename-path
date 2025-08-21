import { z } from 'zod';
import {
  withRequiredAuth,
  type AuthenticatedHandler,
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '@/utils/api';
import type {
  BatchResolutionData,
  BatchResolutionItem,
  ResolutionSource,
} from '../../../types';

// =============================================================================
// Batch Name Resolution Endpoint
// =============================================================================
// Efficiently resolves names for multiple contexts using
// resolve_name() function with batch processing optimization

// Query parameters validation
const batchQuerySchema = z.object({
  contexts: z
.string()
.transform((str) => str.split(',').filter(Boolean))
.pipe(z.array(z.string().min(1)).min(1, 'At least one context required')),
});

// Main handler function for batch resolution
const handleGET: AuthenticatedHandler<BatchResolutionData> = async (
  request,
  context,
) => {
  const batch_start = Date.now();

  try {
// Extract userId from URL path
const target_user_id = request.url.split('/').slice(-1)[0]?.split('?')[0];

// Validate target user ID
if (!target_user_id || !/^[0-9a-f-]{36}$/.test(target_user_id)) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid target user ID format',
context.requestId,
{ target_user_id },
context.timestamp,
  );
}

// Parse and validate query parameters
const url = new URL(request.url);
const queryParams = {
  contexts: url.searchParams.get('contexts') || '',
};

const { contexts } = batchQuerySchema.parse(queryParams);

// Use authenticated Supabase client from context
const { supabase } = context;

// Validate target user exists
const { data: targetUser, error: targetUserError } = await supabase
  .from('profiles')
  .select('id, email')
  .eq('id', target_user_id)
  .single();

if (targetUserError || !targetUser) {
  return createErrorResponse(
ErrorCodes.USER_NOT_FOUND,
'Target user not found',
context.requestId,
{ target_user_id, error: targetUserError?.message },
context.timestamp,
  );
}

// Process batch resolutions with performance tracking
const resolutions: BatchResolutionItem[] = [];
let successful_resolutions = 0;

// Process each context sequentially for consistent audit logging
for (const context_name of contexts) {
  const resolution_start = Date.now();

  try {
// Call simplified PostgreSQL function for this context
const { data: resolvedName, error: resolveError } = await supabase.rpc(
  'resolve_name',
  {
p_target_user_id: target_user_id,
p_requester_user_id: context.user?.id,
p_context_name: context_name,
  },
);

const resolution_time = Date.now() - resolution_start;

if (resolveError || !resolvedName) {
  // Failed resolution
  resolutions.push({
context: context_name,
resolved_name: 'Unknown',
source: 'error' as ResolutionSource,
response_time_ms: resolution_time,
error: resolveError?.message || 'No name data found',
  });
  continue;
}

// Successful resolution - resolve_name returns the actual name text
resolutions.push({
  context: context_name,
  resolved_name: resolvedName || 'Unknown',
  source: 'context_specific' as ResolutionSource,
  response_time_ms: resolution_time,
});

successful_resolutions++;
  } catch (contextError) {
console.error(
  `Batch resolution error for context ${context_name}:`,
  contextError,
);

resolutions.push({
  context: context_name,
  resolved_name: 'Error',
  source: 'error' as ResolutionSource,
  response_time_ms: Date.now() - resolution_start,
  error: 'Resolution processing failed',
});
  }
}

// Build batch response
const total_time = Date.now() - batch_start;

const batchData: BatchResolutionData = {
  user_id: target_user_id,
  resolutions,
  total_contexts: contexts.length,
  successful_resolutions,
  batch_time_ms: total_time,
  timestamp: new Date().toISOString(),
};

return createSuccessResponse(
  batchData,
  context.requestId,
  context.timestamp,
);
  } catch (error) {
console.error('Batch resolve error:', error);

if (error instanceof z.ZodError) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid query parameters',
context.requestId,
{ validationErrors: error.issues },
context.timestamp,
  );
}

return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Internal server error during batch resolution',
  context.requestId,
  { error: error instanceof Error ? error.message : 'Unknown error' },
  context.timestamp,
);
  }
};

// Export with authentication wrapper and performance logging
export const GET = withRequiredAuth(handleGET, {
  enableLogging: true,
});

// Export types for frontend usage
export type { BatchResolutionData, BatchResolutionItem };
