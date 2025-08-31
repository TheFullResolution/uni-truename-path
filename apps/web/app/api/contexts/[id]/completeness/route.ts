// Context Completeness Status API Route
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  validate_uuid,
  type AuthenticatedHandler,
  ErrorCodes,
} from '@/utils/api';

// Database function response interface (matches what the PostgreSQL function returns)
interface DatabaseCompletenessResult {
  is_complete: boolean;
  context_id: string;
  context_name: string;
  visibility: string;
  user_id?: string;
  required_properties: string[];
  assigned_properties: string[];
  missing_properties: string[];
  assignment_count: number;
  completeness_details: {
total_required: number;
total_assigned: number;
total_missing: number;
completion_percentage: number;
  };
  validation_timestamp: string;
  error?: string;
  message?: string;
  sqlstate?: string;
}

// Clean API response interface (no sensitive data)
interface CompletenessResponse {
  is_complete: boolean;
  context_id: string;
  context_name: string;
  visibility: string;
  required_properties: string[];
  assigned_properties: string[];
  missing_properties: string[];
  assignment_count: number;
  completeness_details: {
total_required: number;
total_assigned: number;
total_missing: number;
completion_percentage: number;
  };
  validation_timestamp: string;
}

const handleGet: AuthenticatedHandler = async (request, context) => {
  const url = new URL(request.url);
  const contextId = url.pathname.split('/').slice(-2, -1)[0]; // Extract context ID from path

  if (!validate_uuid(contextId)) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid context ID format',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  try {
// First verify the context exists and belongs to the user
const { data: contextExists } = await context.supabase
  .from('user_contexts')
  .select('id')
  .eq('id', contextId)
  .eq('user_id', context.user!.id)
  .maybeSingle();

if (!contextExists) {
  return createErrorResponse(
ErrorCodes.NOT_FOUND,
'Context not found or access denied',
context.requestId,
undefined,
context.timestamp,
  );
}

// Call the database function to get completeness status
const { data: completenessResult, error: rpcError } =
  await context.supabase.rpc('get_context_completeness_status', {
p_context_id: contextId,
  });

if (rpcError) {
  console.error('RPC Error:', rpcError);
  return createErrorResponse(
ErrorCodes.INTERNAL_ERROR,
'Failed to retrieve context completeness status',
context.requestId,
{
  database_error: rpcError.message,
  context_id: contextId,
},
context.timestamp,
  );
}

if (!completenessResult) {
  return createErrorResponse(
ErrorCodes.INTERNAL_ERROR,
'No completeness data returned from database function',
context.requestId,
{ context_id: contextId },
context.timestamp,
  );
}

// Cast the Json result to our expected interface
const result = completenessResult as unknown as DatabaseCompletenessResult;

// Check if the function returned an error
if (result.error) {
  const errorMessage =
result.message || 'Context completeness validation failed';

  // Map database function errors to appropriate HTTP status codes
  if (result.error === 'context_not_found') {
return createErrorResponse(
  ErrorCodes.NOT_FOUND,
  'Context not found',
  context.requestId,
  { context_id: contextId },
  context.timestamp,
);
  }

  if (result.error === 'invalid_context_id') {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid context ID',
  context.requestId,
  { context_id: contextId },
  context.timestamp,
);
  }

  // Generic validation failure
  return createErrorResponse(
ErrorCodes.INTERNAL_ERROR,
errorMessage,
context.requestId,
{
  context_id: contextId,
  database_error: result.error,
  sqlstate: result.sqlstate,
},
context.timestamp,
  );
}

// Clean up the response to remove sensitive information
const cleanResponse: CompletenessResponse = {
  is_complete: result.is_complete,
  context_id: result.context_id,
  context_name: result.context_name,
  visibility: result.visibility,
  // Exclude user_id for privacy
  required_properties: result.required_properties || [],
  assigned_properties: result.assigned_properties || [],
  missing_properties: result.missing_properties || [],
  assignment_count: result.assignment_count || 0,
  completeness_details: {
total_required: result.completeness_details?.total_required || 0,
total_assigned: result.completeness_details?.total_assigned || 0,
total_missing: result.completeness_details?.total_missing || 0,
completion_percentage:
  result.completeness_details?.completion_percentage || 0,
  },
  validation_timestamp: result.validation_timestamp,
};

return createSuccessResponse(
  cleanResponse,
  context.requestId,
  context.timestamp,
);
  } catch (error) {
console.error('Context completeness API error:', error);

// Handle Zod or other validation errors
if (error instanceof Error) {
  return createErrorResponse(
ErrorCodes.INTERNAL_ERROR,
'Internal server error while processing completeness request',
context.requestId,
{
  context_id: contextId,
  error_type: error.constructor.name,
  error_message: error.message,
},
context.timestamp,
  );
}

// Fallback for unknown error types
return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'Unexpected error occurred',
  context.requestId,
  { context_id: contextId },
  context.timestamp,
);
  }
};

export const GET = withRequiredAuth(handleGet);

// Only allow GET method for this endpoint
export const POST = () => handle_method_not_allowed(['GET']);
export const PUT = () => handle_method_not_allowed(['GET']);
export const DELETE = () => handle_method_not_allowed(['GET']);
export const PATCH = () => handle_method_not_allowed(['GET']);
