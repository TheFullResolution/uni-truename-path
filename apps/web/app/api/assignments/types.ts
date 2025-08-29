// TrueNamePath: Assignment API Type Definitions
// Centralized types for context-name assignment endpoints
// Date: August 20, 2025
// Academic project - snake_case compliant types

import type { QueryData, SupabaseClient } from '@supabase/supabase-js';
import type { Tables, Enums } from '@/generated/database';

// =============================================================================
// Database Entity Types (Direct from Generated Schema)
// =============================================================================

/**
 * User context database entity
 */
export type UserContext = Tables<'user_contexts'>;

/**
 * Name database entity
 */
export type Name = Tables<'names'>;

/**
 * Context OIDC assignment database entity (simplified schema)
 */
export type ContextOIDCAssignment = Tables<'context_oidc_assignments'>;

/**
 * Simple alias for OIDC assignment (database table)
 */
export type OIDCAssignment = Tables<'context_oidc_assignments'>;

// =============================================================================
// Database Query Builders
// =============================================================================

// =============================================================================
// API Response Types (snake_case compliant)
// =============================================================================

// =============================================================================
// Simplified OIDC Assignment Types (Step 15.7.2)
// =============================================================================

/**
 * OIDC assignment with joined data from names and contexts tables
 * Uses QueryData pattern for type-safe database queries
 */
export const getOIDCAssignmentWithDetailsQuery = (
  supabase: SupabaseClient,
  userId: string,
) =>
  supabase
.from('context_oidc_assignments')
.select(
  `
  *,
  names!inner(name_text),
  user_contexts!inner(context_name, description, is_permanent)
`,
)
.eq('user_id', userId);

export type OIDCAssignmentQueryResult = QueryData<
  ReturnType<typeof getOIDCAssignmentWithDetailsQuery>
>;

/**
 * Single OIDC assignment with details (with computed fields for UI)
 */
export interface OIDCAssignmentWithDetails {
  id: string;
  context_id: string;
  oidc_property: Enums<'oidc_property'>;
  name_id: string;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  names: { name_text: string };
  user_contexts: {
context_name: string;
description: string | null;
is_permanent: boolean | null;
  };
  // Computed fields for UI
  name_text: string;
  context_name: string;
  is_required: boolean;
}

/**
 * Required OIDC properties for default context constraint handling.
 * These properties cannot be removed from the default context.
 */
export const REQUIRED_OIDC_PROPERTIES: Enums<'oidc_property'>[] = [
  'given_name',
  'family_name',
  'name',
] as const;

// =============================================================================
// Batch OIDC Assignment Types (Step 15.7.6)
// =============================================================================

/**
 * Summary of batch operation results
 */
export interface BatchOIDCAssignmentSummary {
  total_processed: number;
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
}

/**
 * Response data for POST /api/assignments/oidc/batch
 */
export interface BatchOIDCAssignmentResponseData {
  context_id: string;
  context_name: string;
  assignments: OIDCAssignmentWithDetails[];
  summary: BatchOIDCAssignmentSummary;
}

// Response interfaces removed - let TypeScript infer response types from API handlers
// Use OIDCAssignmentWithDetails for individual assignments in responses
