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
// Type Exports for Schema Inference
// =============================================================================

export type OAuthAuthorizeRequest = z.infer<typeof OAuthAuthorizeRequestSchema>;
