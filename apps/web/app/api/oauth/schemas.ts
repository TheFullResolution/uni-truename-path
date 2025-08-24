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

/**
 * Description validation schema
 * Optional descriptive text for OAuth applications
 */
export const DescriptionSchema = z
  .string()
  .max(500, 'Description must be 500 characters or less')
  .trim()
  .nullable()
  .optional();

/**
 * Redirect URI validation schema
 * Must be a valid HTTPS URL for security
 */
export const RedirectUriSchema = z
  .string()
  .url('Redirect URI must be a valid URL')
  .refine(
(url) => url.startsWith('https://') || url.startsWith('http://localhost'),
'Redirect URI must use HTTPS (or HTTP for localhost)',
  );

/**
 * App type validation schema
 * Optional classification for OAuth applications
 */
export const AppTypeSchema = z
  .string()
  .max(50, 'App type must be 50 characters or less')
  .trim()
  .nullable()
  .optional();

// =============================================================================
// Request Body Schemas
// =============================================================================

/**
 * Schema for creating new OAuth applications
 * Follows database schema requirements for oauth_applications table
 */
export const CreateOAuthAppRequestSchema = z.object({
  app_name: AppNameSchema,
  display_name: DisplayNameSchema,
  description: DescriptionSchema,
  redirect_uri: RedirectUriSchema,
  app_type: AppTypeSchema,
});

/**
 * Schema for updating existing OAuth applications
 * All fields optional for partial updates
 */
export const UpdateOAuthAppRequestSchema = z
  .object({
display_name: DisplayNameSchema.optional(),
description: DescriptionSchema,
redirect_uri: RedirectUriSchema.optional(),
app_type: AppTypeSchema,
is_active: z.boolean().optional(),
  })
  .refine(
(data) =>
  data.display_name !== undefined ||
  data.description !== undefined ||
  data.redirect_uri !== undefined ||
  data.app_type !== undefined ||
  data.is_active !== undefined,
{
  message: 'At least one field must be provided for update',
},
  );

// =============================================================================
// Query Parameter Schemas
// =============================================================================

/**
 * Common query parameters for OAuth app endpoints
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

  is_active: z
.string()
.nullable()
.optional()
.transform((val) =>
  val === 'true' ? true : val === 'false' ? false : undefined,
),
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
