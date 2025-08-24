// TrueNamePath: OAuth Authorization Endpoint Validation Schemas
// Zod schemas for POST /api/oauth/authorize endpoint
// Date: August 23, 2025
// Academic project - OAuth session token generation with context assignment

import { z } from 'zod';
import { UuidSchema } from '@/app/api/oauth/schemas';

// =============================================================================
// Common Field Schemas
// =============================================================================

/**
 * Return URL validation schema
 * Basic URL validation only - no domain restrictions per PRD requirements
 */
export const ReturnUrlSchema = z.string().url('Return URL must be a valid URL');

// =============================================================================
// Request Body Schemas
// =============================================================================

/**
 * Schema for OAuth authorization request
 * Generates session token with context assignment for external applications
 */
export const OAuthAuthorizeRequestSchema = z.object({
  app_id: UuidSchema,
  context_id: UuidSchema,
  return_url: ReturnUrlSchema,
});

// =============================================================================
// Response Body Schemas
// =============================================================================

/**
 * Schema for successful authorization response
 * Contains session token and expiry information
 */
export const OAuthAuthorizeResponseSchema = z.object({
  session_token: z.string(),
  expires_at: z.string(),
  context_name: z.string(),
  app_name: z.string(),
});

// =============================================================================
// Type Exports for Schema Inference
// =============================================================================

export type OAuthAuthorizeRequest = z.infer<typeof OAuthAuthorizeRequestSchema>;
export type OAuthAuthorizeResponse = z.infer<
  typeof OAuthAuthorizeResponseSchema
>;

// =============================================================================
// Shared Validation Helpers
// =============================================================================

/**
 * Creates a standardized OAuth authorization validation error response
 * Follows established patterns from oauth/schemas.ts
 */
export function createOAuthAuthorizeValidationErrorResponse(
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
'Invalid authorization request parameters',
request_id,
result.error.issues.map((err: z.ZodIssue) => ({
  field: err.path?.join?.('.') || 'unknown',
  message: err.message || 'Validation error',
  code: err.code || 'invalid_input',
})),
timestamp,
  );
}
