// TrueNamePath: Shared Assignment Validation Schemas
// Centralized Zod schemas for assignment API endpoints
// Date: August 21, 2025 - Updated to use database-generated enum types
// Academic project - shared validation patterns

import { z } from 'zod';
import type { Enums } from '@/generated/database';

// =============================================================================
// Database Type Aliases
// =============================================================================

/**
 * OIDC property type from database enum (single source of truth)
 */
export type OIDCProperty = Enums<'oidc_property_enum'>;

// Helper to extract enum values for Zod validation
export const OIDC_PROPERTY_VALUES = [
  'given_name',
  'family_name',
  'name',
  'nickname',
  'display_name',
  'preferred_username',
  'middle_name',
] as const satisfies readonly OIDCProperty[];

// =============================================================================
// Common Field Schemas
// =============================================================================

/**
 * UUID validation schema with consistent error message
 */
export const UuidSchema = z.string().uuid();

/**
 * Context ID validation schema
 */
export const ContextIdSchema = UuidSchema.refine((val) => val.length > 0, {
  message: 'Context ID is required',
});

/**
 * Name ID validation schema
 */
export const NameIdSchema = UuidSchema.refine((val) => val.length > 0, {
  message: 'Name ID is required',
});

/**
 * Assignment ID validation schema
 */
export const AssignmentIdSchema = UuidSchema.refine((val) => val.length > 0, {
  message: 'Assignment ID is required',
});

// =============================================================================
// Query Parameter Schemas
// =============================================================================

/**
 * Common query parameters for list endpoints with pagination and filtering
 */
export const ListQueryParamsSchema = z.object({
  limit: z
.string()
.nullable()
.optional()
.transform((val) => (val ? parseInt(val, 10) : undefined))
.refine((val) => !val || (val > 0 && val <= 100), {
  message: 'Limit must be between 1 and 100',
}),

  context_id: ContextIdSchema.nullable().optional(),
});

// =============================================================================
// Request Body Schemas
// =============================================================================

/**
 * Schema for creating new context-name assignments
 */
export const CreateAssignmentRequestSchema = z.object({
  context_id: ContextIdSchema,
  name_id: NameIdSchema,
});

/**
 * Schema for updating existing context-name assignments
 */
export const UpdateAssignmentRequestSchema = z
  .object({
assignment_id: AssignmentIdSchema,
context_id: ContextIdSchema.optional(),
name_id: NameIdSchema.optional(),
  })
  .refine((data) => data.context_id || data.name_id, {
message:
  'At least one field (context_id or name_id) must be provided for update',
  });

/**
 * Schema for deleting context-name assignments
 */
export const DeleteAssignmentRequestSchema = z.object({
  assignment_id: AssignmentIdSchema,
});

/**
 * Schema for bulk assignment operations
 */
export const BulkAssignmentRequestSchema = z.object({
  assignments: z
.array(
  z.object({
context_id: ContextIdSchema,
name_id: NameIdSchema.nullable(), // null means delete assignment
  }),
)
.min(1, 'At least one assignment is required')
.max(50, 'Maximum 50 assignments per request'),
});

// =============================================================================
// OIDC-Specific Schemas
// =============================================================================

/**
 * Standard OAuth 2.0 scopes per OIDC Core 1.0
 */
export const STANDARD_OAUTH_SCOPES = [
  'openid',
  'profile',
  'email',
  'phone',
  'address',
] as const;

/**
 * OIDC claims supported by our database (from generated enum)
 */
export const SUPPORTED_OIDC_CLAIMS = OIDC_PROPERTY_VALUES;

/**
 * Schema for OIDC assignment operations (updated for unified table)
 */
export const OIDCAssignmentRequestSchema = z.object({
  context_id: ContextIdSchema,
  name_id: NameIdSchema,
  oidc_property: z.enum(OIDC_PROPERTY_VALUES),
  is_primary: z.boolean().default(true),
  visibility_level: z
.enum(['STANDARD', 'RESTRICTED', 'PRIVATE'])
.default('STANDARD'),
  allowed_scopes: z
.array(z.enum(STANDARD_OAUTH_SCOPES))
.min(1, 'At least one scope must be allowed')
.default(['openid', 'profile']),
});

/**
 * Schema for OIDC query parameters
 */
export const OIDCQueryParamsSchema = z.object({
  context_id: ContextIdSchema.optional(),
});

// =============================================================================
// Type Exports for Schema Inference
// =============================================================================

export type ListQueryParams = z.infer<typeof ListQueryParamsSchema>;
export type CreateAssignmentRequest = z.infer<
  typeof CreateAssignmentRequestSchema
>;
export type UpdateAssignmentRequest = z.infer<
  typeof UpdateAssignmentRequestSchema
>;
export type DeleteAssignmentRequest = z.infer<
  typeof DeleteAssignmentRequestSchema
>;
export type BulkAssignmentRequest = z.infer<typeof BulkAssignmentRequestSchema>;
export type OIDCAssignmentRequest = z.infer<typeof OIDCAssignmentRequestSchema>;
export type OIDCQueryParams = z.infer<typeof OIDCQueryParamsSchema>;

// Export types for reuse
export type StandardOAuthScope = (typeof STANDARD_OAUTH_SCOPES)[number];
export type SupportedOIDCClaim = OIDCProperty;

// =============================================================================
// Shared Validation Helpers
// =============================================================================

/**
 * Creates a standardized validation error response
 * Reduces boilerplate across assignment API routes
 */
export function createValidationErrorResponse(
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
'Invalid request parameters',
request_id,
result.error.issues.map((err: z.ZodIssue) => ({
  field: err.path?.join?.('.') || 'unknown',
  message: err.message || 'Validation error',
  code: err.code || 'invalid_input',
})),
timestamp,
  );
}

/**
 * Creates a standardized bulk validation error response
 * Reduces boilerplate for bulk operations
 */
export function createBulkValidationErrorResponse(
  result: { error: z.ZodError },
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
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request body format',
request_id,
result.error.format(),
timestamp,
  );
}
