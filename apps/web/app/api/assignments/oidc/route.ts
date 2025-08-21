// TrueNamePath: OIDC Assignments API Route (Simplified)
// REST API for managing context-specific OIDC assignments
// Date: August 20, 2025 - Post Step 15.4 Migration
// Academic project OIDC assignments with standard OAuth scopes

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
import { z } from 'zod';
import type { OIDCScope } from '@/types/oidc';
import {
  OIDCAssignmentRequestSchema,
  OIDCQueryParamsSchema,
  DeleteAssignmentRequestSchema,
  createValidationErrorResponse as sharedCreateValidationErrorResponse,
} from '../schemas';

// =============================================================================
// Types
// =============================================================================

interface OIDCAssignment {
  assignment_id: string;
  name_id: string;
  name_text: string;
  property_type: string; // Maps from oidc_property for frontend compatibility
  visibility_level: 'STANDARD' | 'RESTRICTED' | 'PRIVATE';
  allowed_scopes: OIDCScope[];
  created_at: string;
  updated_at: string;
}

interface OIDCAssignmentsResponseData {
  assignments: OIDCAssignment[];
  total: number;
  context_id: string;
  context_name: string;
}

interface OIDCAssignmentResponseData {
  assignment: OIDCAssignment;
  operation: 'CREATED' | 'UPDATED';
}

interface OIDCDeleteResponseData {
  success: true;
  assignment_id: string;
}

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
 * Validates OIDC assignment request body
 */
function validateOIDCAssignmentRequest(body: unknown) {
  return OIDCAssignmentRequestSchema.safeParse(body);
}

/**
 * Validates assignment deletion request
 */
function validateDeleteAssignmentRequest(body: unknown) {
  return DeleteAssignmentRequestSchema.safeParse(body);
}

/**
 * Creates standardized validation error response using shared helper (aligned with main route patterns)
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
// Fetch OIDC assignments from unified table
const { data: assignment_data, error: assignment_error } = await supabase
  .from('context_name_assignments')
  .select(
`
id,
name_id,
oidc_property,
is_primary,
created_at,
names!inner(name_text)
  `,
  )
  .eq('context_id', context_id)
  .eq('user_id', user!.id)
  .not('oidc_property', 'is', null); // Only OIDC assignments

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

// Get context details for response metadata
const { data: contextData, error: contextError } = await supabase
  .from('user_contexts')
  .select('context_name')
  .eq('id', context_id)
  .eq('user_id', user!.id)
  .single();

if (contextError || !contextData) {
  return createErrorResponse(
ErrorCodes.RESOURCE_NOT_FOUND,
'Context not found or access denied',
requestId,
undefined,
timestamp,
  );
}

// Transform the data with proper typing and mapping
const assignments: OIDCAssignment[] = (assignment_data || [])
  .filter((assignment) => assignment.oidc_property) // Ensure non-null
  .map((assignment) => ({
assignment_id: assignment.id,
name_id: assignment.name_id,
name_text: assignment.names.name_text,
property_type: assignment.oidc_property!, // Map oidc_property to property_type for frontend
visibility_level: 'STANDARD', // Default for unified table structure
allowed_scopes: ['openid', 'profile'] as OIDCScope[], // Default scopes
created_at: assignment.created_at,
updated_at: assignment.created_at, // No updated_at in unified table
  }));

return createSuccessResponse<OIDCAssignmentsResponseData>(
  {
assignments,
total: assignments.length,
context_id,
context_name: contextData.context_name,
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

// =============================================================================
// POST Handler - Create OIDC assignment
// =============================================================================

const handlePOST = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp }: AuthenticatedContext,
) => {
  let body;
  try {
body = await request.json();
  } catch {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid JSON body',
  requestId,
  undefined,
  timestamp,
);
  }

  // Validate request body
  const validation = validateOIDCAssignmentRequest(body);
  if (!validation.success) {
return createOIDCValidationErrorResponse(validation, requestId, timestamp);
  }

  const {
context_id,
name_id,
oidc_property,
is_primary,
visibility_level,
allowed_scopes,
  } = validation.data;

  try {
// Verify user owns the context
const { data: contextData, error: contextError } = await supabase
  .from('user_contexts')
  .select('id')
  .eq('id', context_id)
  .eq('user_id', user!.id)
  .single();

if (contextError || !contextData) {
  return createErrorResponse(
ErrorCodes.AUTHORIZATION_FAILED,
'Context not found or access denied',
requestId,
undefined,
timestamp,
  );
}

// Verify user owns the name
const { data: nameData, error: nameError } = await supabase
  .from('names')
  .select('id, name_text')
  .eq('id', name_id)
  .eq('user_id', user!.id)
  .single();

if (nameError || !nameData) {
  return createErrorResponse(
ErrorCodes.AUTHORIZATION_FAILED,
'Name not found or access denied',
requestId,
undefined,
timestamp,
  );
}

// Upsert the assignment to unified table
const { data: assignment_data, error: assignment_error } = await supabase
  .from('context_name_assignments')
  .upsert(
{
  user_id: user!.id,
  context_id: context_id,
  name_id: name_id,
  oidc_property: oidc_property,
  is_primary: is_primary,
},
{
  onConflict: 'context_id,oidc_property',
},
  )
  .select()
  .single();

if (assignment_error) {
  console.error(
'Database error creating OIDC assignment:',
assignment_error,
  );
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to create OIDC assignment',
requestId,
{ error: assignment_error.message },
timestamp,
  );
}

if (!assignment_data) {
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to create assignment',
requestId,
undefined,
timestamp,
  );
}

const assignment: OIDCAssignment = {
  assignment_id: assignment_data.id,
  name_id: assignment_data.name_id,
  name_text: nameData.name_text,
  property_type: assignment_data.oidc_property!, // Map oidc_property to property_type (non-null assured)
  visibility_level: visibility_level,
  allowed_scopes: allowed_scopes,
  created_at: assignment_data.created_at,
  updated_at: assignment_data.created_at, // No updated_at in unified table
};

return createSuccessResponse<OIDCAssignmentResponseData>(
  {
assignment,
operation: 'CREATED',
  },
  requestId,
  timestamp,
);
  } catch (error) {
console.error('Unexpected error in OIDC assignment POST:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'Internal server error',
  requestId,
  undefined,
  timestamp,
);
  }
};

// =============================================================================
// PUT Handler - Update OIDC assignment
// =============================================================================

const handlePUT = async (
  request: NextRequest,
  context: AuthenticatedContext,
) => {
  // PUT uses the same logic as POST since upsert handles both cases
  return handlePOST(request, context);
};

// =============================================================================
// DELETE Handler - Delete OIDC assignment
// =============================================================================

const handleDELETE = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp }: AuthenticatedContext,
) => {
  let body;
  try {
body = await request.json();
  } catch {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid JSON body',
  requestId,
  undefined,
  timestamp,
);
  }

  // Validate request body
  const validation = validateDeleteAssignmentRequest(body);
  if (!validation.success) {
return createOIDCValidationErrorResponse(validation, requestId, timestamp);
  }

  const { assignment_id } = validation.data;

  try {
// Delete the assignment with ownership verification from unified table
const { error: deleteError } = await supabase
  .from('context_name_assignments')
  .delete()
  .eq('id', assignment_id)
  .eq('user_id', user!.id)
  .not('oidc_property', 'is', null); // Only delete OIDC assignments

if (deleteError) {
  console.error('Database error deleting OIDC assignment:', deleteError);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to delete OIDC assignment',
requestId,
{ error: deleteError.message },
timestamp,
  );
}

return createSuccessResponse<OIDCDeleteResponseData>(
  {
success: true,
assignment_id,
  },
  requestId,
  timestamp,
);
  } catch (error) {
console.error('Unexpected error in OIDC assignment DELETE:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'Internal server error',
  requestId,
  undefined,
  timestamp,
);
  }
};

// =============================================================================
// Exports
// =============================================================================

export const GET = withRequiredAuth(handleGET as AuthenticatedHandler);
export const POST = withRequiredAuth(handlePOST as AuthenticatedHandler);
export const PUT = withRequiredAuth(handlePUT as AuthenticatedHandler);
export const DELETE = withRequiredAuth(handleDELETE as AuthenticatedHandler);

// Handle unsupported methods
export const PATCH = () =>
  handle_method_not_allowed(['GET', 'POST', 'PUT', 'DELETE']);
export const HEAD = () =>
  handle_method_not_allowed(['GET', 'POST', 'PUT', 'DELETE']);
export const OPTIONS = () =>
  handle_method_not_allowed(['GET', 'POST', 'PUT', 'DELETE']);
