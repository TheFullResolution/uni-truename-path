// TrueNamePath: OAuth API Validation Schemas
// Centralized Zod schemas for OAuth endpoints
// Date: August 23, 2025
// Academic project - OAuth app registration validation patterns

import { z } from 'zod';

// =============================================================================
// Common Field Schemas
// =============================================================================

/**
 * UUID validation schema with consistent error message
 */
export const UuidSchema = z.string().uuid();

/**
 * Client ID validation schema
 * Format: tnp_[a-f0-9]{16} (20 characters total)
 * Used across OAuth endpoints for client identification
 */
export const ClientIdSchema = z
  .string()
  .regex(
/^tnp_[a-f0-9]{16}$/,
'Client ID must be in format: tnp_[16 hex chars]',
  );

/**
 * State parameter validation schema for CSRF protection
 * Optional string with max 255 characters
 * Used in OAuth authorization flow to prevent CSRF attacks
 */
export const StateSchema = z
  .string()
  .max(255, 'State parameter must be 255 characters or less')
  .optional();

/**
 * App name validation schema
 * Follows OAuth standard naming conventions: lowercase alphanumeric with hyphens
 * Length: 1-50 characters for practical API usage
 */
export const AppNameSchema = z
  .string()
  .min(1, 'App name is required')
  .max(50, 'App name must be 50 characters or less')
  .regex(
/^[a-z0-9-]+$/,
'App name must contain only lowercase letters, numbers, and hyphens',
  );

/**
 * Display name validation schema
 * Human-readable name for OAuth applications
 */
export const DisplayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be 100 characters or less')
  .trim();

// NOTE: DescriptionSchema, RedirectUriSchema, and AppTypeSchema removed
// These fields are no longer part of the client_id registry system

// =============================================================================
// Request Body Schemas
// =============================================================================

/**
 * Schema for creating new OAuth applications
 * Updated for client_id registry system (oauth_client_registry table)
 */
export const CreateOAuthAppRequestSchema = z.object({
  app_name: AppNameSchema,
  display_name: DisplayNameSchema,
  publisher_domain: z
.string()
.min(1, 'Publisher domain is required')
.max(253, 'Publisher domain must be 253 characters or less')
.refine(
  (domain) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain),
  'Publisher domain must be a valid domain format',
),
});

/**
 * Schema for updating existing OAuth applications
 * Updated for client_id registry system (simplified fields)
 */
export const UpdateOAuthAppRequestSchema = z
  .object({
display_name: DisplayNameSchema.optional(),
last_used_at: z.string().datetime().optional(),
  })
  .refine(
(data) =>
  data.display_name !== undefined || data.last_used_at !== undefined,
{
  message: 'At least one field must be provided for update',
},
  );

// =============================================================================
// Query Parameter Schemas
// =============================================================================

/**
 * Common query parameters for OAuth app endpoints
 * Updated for client_id registry system (simplified)
 */
export const OAuthAppQueryParamsSchema = z.object({
  limit: z
.string()
.nullable()
.optional()
.transform((val) => (val ? parseInt(val, 10) : undefined))
.refine((val) => !val || (val > 0 && val <= 100), {
  message: 'Limit must be between 1 and 100',
}),
});

// =============================================================================
// Type Exports for Schema Inference
// =============================================================================

export type CreateOAuthAppRequest = z.infer<typeof CreateOAuthAppRequestSchema>;
export type UpdateOAuthAppRequest = z.infer<typeof UpdateOAuthAppRequestSchema>;
export type OAuthAppQueryParams = z.infer<typeof OAuthAppQueryParamsSchema>;

// =============================================================================
// Shared Validation Helpers
// =============================================================================

/**
 * Creates a standardized OAuth validation error response
 * Reduces boilerplate across OAuth API routes
 */
export function createOAuthValidationErrorResponse(
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
