// TrueNamePath: OIDC Assignments API Route (Step 15.7.2 Simplified)
// REST API for managing context-specific OIDC assignments
// Date: August 21, 2025 - Simplified schema without scope complexity
// Academic project using new context_oidc_assignments table

import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  type AuthenticatedHandler,
  type AuthenticatedContext,
} from '@/utils/api';
import { NextRequest } from 'next/server';
import { ErrorCodes } from '@/utils/api';
import type { OIDCAssignmentWithDetails } from '@/app/api/assignments/types';
import { REQUIRED_OIDC_PROPERTIES } from '@/app/api/assignments/types';
import { z } from 'zod';

import {
  OIDCQueryParamsSchema,
  createValidationErrorResponse as sharedCreateValidationErrorResponse,
} from '../schemas';

// Using imported types from @/app/api/assignments/types

// =============================================================================
// Validation Schemas
// =============================================================================

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validates query parameters for OIDC assignment endpoints
 */
function validateOIDCQueryParams(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawParams = {
context_id: searchParams.get('context_id'),
  };
  return OIDCQueryParamsSchema.safeParse(rawParams);
}

/**
 * Creates standardized validation error response for GET endpoint
 */
function createOIDCValidationErrorResponse(
  result: z.ZodSafeParseResult<unknown>,
  requestId: string,
  timestamp: string,
) {
  return sharedCreateValidationErrorResponse(
result,
requestId,
timestamp,
createErrorResponse,
ErrorCodes,
  );
}

// =============================================================================
// GET Handler - Retrieve OIDC assignments for a context
// =============================================================================

const handleGET = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp }: AuthenticatedContext,
) => {
  const startTime = Date.now();
  // Validate query parameters
  const validation = validateOIDCQueryParams(request);
  if (!validation.success) {
return createOIDCValidationErrorResponse(validation, requestId, timestamp);
  }

  const { context_id } = validation.data;

  if (!context_id) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Context ID is required',
  requestId,
  undefined,
  timestamp,
);
  }

  try {
// Optimized: Parallel queries for context validation and assignments
const [
  { data: contextData, error: contextError },
  { data: assignment_data, error: assignment_error },
] = await Promise.all([
  supabase
.from('user_contexts')
.select('context_name, description, is_permanent')
.eq('id', context_id)
.eq('user_id', user!.id)
.single(),
  supabase
.from('context_oidc_assignments')
.select(
  `
  id,
  context_id,
  oidc_property,
  name_id,
  user_id,
  created_at,
  updated_at,
  names!inner(name_text)
`,
)
.eq('context_id', context_id)
.eq('user_id', user!.id),
]);

if (contextError || !contextData) {
  return createErrorResponse(
ErrorCodes.RESOURCE_NOT_FOUND,
'Context not found or access denied',
requestId,
undefined,
timestamp,
  );
}

if (assignment_error) {
  console.error(
'Database error fetching OIDC assignments:',
assignment_error,
  );
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve OIDC assignments',
requestId,
{ error: assignment_error.message },
timestamp,
  );
}

// Check if this is the default context for is_required calculation
const isDefaultContext = contextData.is_permanent === true;

// Transform the data with simplified structure
const assignments: OIDCAssignmentWithDetails[] = (
  assignment_data || []
).map((assignment) => ({
  id: assignment.id,
  context_id: assignment.context_id,
  oidc_property: assignment.oidc_property,
  name_id: assignment.name_id,
  created_at: assignment.created_at,
  updated_at: assignment.updated_at,
  user_id: assignment.user_id,
  names: assignment.names,
  user_contexts: {
context_name: contextData.context_name,
description: contextData.description,
is_permanent: contextData.is_permanent,
  },
  // Computed fields for UI
  name_text: assignment.names.name_text,
  context_name: contextData.context_name,
  is_required: isDefaultContext
? REQUIRED_OIDC_PROPERTIES.includes(assignment.oidc_property)
: false,
}));

const responseTime = Date.now() - startTime;

// Performance monitoring
if (responseTime > 200) {
  console.warn(
`Slow OIDC GET response: ${responseTime}ms for context ${context_id}`,
  );
} else if (responseTime < 50) {
  console.log(
`Fast OIDC GET response: ${responseTime}ms for context ${context_id}`,
  );
}

return createSuccessResponse(
  {
assignments,
total: assignments.length,
context_id,
context_name: contextData.context_name,
is_permanent: contextData.is_permanent,
  },
  requestId,
  timestamp,
);
  } catch (error) {
console.error('Unexpected error in OIDC assignments GET:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'Internal server error',
  requestId,
  undefined,
  timestamp,
);
  }
};

// Individual assignment operations removed - use batch API at /api/assignments/oidc/batch

// =============================================================================
// Exports
// =============================================================================

export const GET = withRequiredAuth(handleGET as AuthenticatedHandler);

// Handle unsupported methods - only GET supported, use batch API for modifications
export const POST = () => handle_method_not_allowed(['GET']);
export const PUT = () => handle_method_not_allowed(['GET']);
export const DELETE = () => handle_method_not_allowed(['GET']);
export const PATCH = () => handle_method_not_allowed(['GET']);
export const HEAD = () => handle_method_not_allowed(['GET']);
export const OPTIONS = () => handle_method_not_allowed(['GET']);
