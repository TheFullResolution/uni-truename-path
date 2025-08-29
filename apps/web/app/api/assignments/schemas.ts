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
export type OIDCProperty = Enums<'oidc_property'>;

// Helper to extract enum values for Zod validation (simplified schema)
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

// =============================================================================
// OIDC-Specific Schemas (Simplified)
// =============================================================================

/**
 * Schema for OIDC assignment operations (simplified for new table)
 * Removed scope and visibility complexity - direct property assignments only
 */
export const OIDCAssignmentRequestSchema = z.object({
  context_id: ContextIdSchema,
  name_id: NameIdSchema,
  oidc_property: z.enum(OIDC_PROPERTY_VALUES),
});

/**
 * Schema for OIDC query parameters
 */
export const OIDCQueryParamsSchema = z.object({
  context_id: ContextIdSchema.optional(),
});

/**
 * Schema for batch OIDC assignment operations (Step 15.7.6)
 * Handles multiple OIDC property assignments for a single context
 */
export const BatchOIDCAssignmentRequestSchema = z.object({
  context_id: ContextIdSchema,
  assignments: z
.array(
  z.object({
oidc_property: z.enum(OIDC_PROPERTY_VALUES),
name_id: NameIdSchema.nullable(), // null means delete/unassign
  }),
)
.min(1, 'At least one assignment is required')
.max(20, 'Maximum 20 assignments per batch request'),
});

// =============================================================================
// Type Exports for Schema Inference
// =============================================================================

export type ListQueryParams = z.infer<typeof ListQueryParamsSchema>;

export type BatchOIDCAssignmentRequest = z.infer<
  typeof BatchOIDCAssignmentRequestSchema
>;

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
