// TrueNamePath: OAuth Assignment Update Endpoint Validation Schemas
// Zod schemas for PUT /api/oauth/assignments/[clientId] endpoint
// Date: August 28, 2025
// Academic project - OAuth context assignment updates

import { z } from 'zod';
import { UuidSchema, ClientIdSchema } from '../../schemas';

// =============================================================================
// Common Field Schemas
// =============================================================================

// Client ID and UUID schemas are imported from shared OAuth schemas

/**
 * Context ID validation schema for assignment updates
 * Ensures valid UUID format for context assignments
 */
export const AssignmentContextIdSchema = UuidSchema.refine(
  (val) => val.length > 0,
  {
message: 'Context ID is required',
  },
);

// =============================================================================
// Request Body Schemas
// =============================================================================

/**
 * Schema for OAuth assignment update request
 * Updates context assignment for existing OAuth session
 * Simplified to only handle context_id updates
 */
export const UpdateAssignmentRequestSchema = z.object({
  context_id: AssignmentContextIdSchema,
});

// =============================================================================
// Path Parameter Schemas
// =============================================================================

/**
 * Schema for clientId path parameter validation
 * Ensures client ID follows required format
 */
export const ClientIdPathSchema = z.object({
  clientId: ClientIdSchema,
});

// =============================================================================
// Type Exports for Schema Inference
// =============================================================================

export type UpdateAssignmentRequest = z.infer<
  typeof UpdateAssignmentRequestSchema
>;
export type ClientIdPathParams = z.infer<typeof ClientIdPathSchema>;

// =============================================================================
// Shared Validation Helpers
// =============================================================================

/**
 * Creates a standardized OAuth assignment validation error response
 * Follows established patterns from oauth/schemas.ts
 */
export function createOAuthAssignmentValidationErrorResponse(
  result: z.ZodSafeParseResult<unknown>,
  request_id: string,
  timestamp: string,
  createErrorResponse: (
code: string,
message: string,
requestId: string,
data: unknown,
timestamp: string,
  ) => unknown,
  ErrorCodes: Record<string, string>,
) {
  if (result.success) {
throw new Error('Cannot create error response for successful validation');
  }

  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid assignment update request parameters',
request_id,
result.error.issues.map((err: z.ZodIssue) => ({
  field: err.path?.join?.('.') || 'unknown',
  message: err.message || 'Validation error',
  code: err.code || 'invalid_input',
})),
timestamp,
  );
}
