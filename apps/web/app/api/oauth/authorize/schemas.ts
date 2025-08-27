// TrueNamePath: OAuth Authorization Endpoint Validation Schemas
// Zod schemas for POST /api/oauth/authorize endpoint
// Date: August 23, 2025
// Academic project - OAuth session token generation with context assignment

import { z } from 'zod';
import { UuidSchema, ClientIdSchema, StateSchema } from '../schemas';

// =============================================================================
// Common Field Schemas
// =============================================================================

// Client ID and State schemas are imported from shared OAuth schemas

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
 * Updated to use client_id instead of app_id and added state parameter
 */
export const OAuthAuthorizeRequestSchema = z.object({
  client_id: ClientIdSchema,
  context_id: UuidSchema,
  return_url: ReturnUrlSchema,
  state: StateSchema,
});

// =============================================================================
// Response Body Schemas
// =============================================================================

/**
 * Schema for successful authorization response
 * Contains session token, expiry information, redirect URL, and client/context details
 */
export const OAuthAuthorizeResponseSchema = z.object({
  session_token: z.string(),
  expires_at: z.string(),
  redirect_url: z.string(),
  client: z.object({
client_id: z.string(),
display_name: z.string(),
publisher_domain: z.string(),
  }),
  context: z.object({
id: z.string(),
context_name: z.string(),
  }),
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
