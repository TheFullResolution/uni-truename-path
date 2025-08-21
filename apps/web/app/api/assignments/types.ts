// TrueNamePath: Assignment API Type Definitions
// Centralized types for context-name assignment endpoints
// Date: August 20, 2025
// Academic project - snake_case compliant types

import type { QueryData } from '@supabase/supabase-js';
import type { Tables } from '@/generated/database';
import { createClient } from '@/utils/supabase/client';

// =============================================================================
// Database Entity Types (Direct from Generated Schema)
// =============================================================================

/**
 * Context-name assignment database entity
 */
export type ContextNameAssignment = Tables<'context_name_assignments'>;

/**
 * User context database entity
 */
export type UserContext = Tables<'user_contexts'>;

/**
 * Name database entity
 */
export type Name = Tables<'names'>;

// =============================================================================
// Database Query Builders
// =============================================================================

/**
 * Optimized query for retrieving assignments with context and name details.
 * Uses inner joins to ensure data integrity and avoid null references.
 *
 * @param userId - User ID to filter assignments
 * @returns Supabase query builder with assignments and related data
 */
export const getAssignmentsWithDetailsQuery = (userId: string) =>
  createClient()
.from('context_name_assignments')
.select(
  `
  id,
  context_id,
  name_id,
  created_at,
  user_contexts!inner(
id,
context_name,
description
  ),
  names!inner(
id,
name_text
  )
`,
)
.eq('user_id', userId)
.order('created_at', { ascending: false });

/**
 * Raw database result type for assignments query.
 * Used internally for type safety during data transformation.
 */
export type RawAssignmentQueryResult = QueryData<
  ReturnType<typeof getAssignmentsWithDetailsQuery>
>;

// =============================================================================
// API Response Types (snake_case compliant)
// =============================================================================

/**
 * Enriched assignment data with context and name details.
 * This is the primary assignment object returned by all assignment endpoints.
 */
export interface AssignmentWithDetails {
  /** Assignment unique identifier */
  id: string;
  /** Context unique identifier */
  context_id: string;
  /** Human-readable context name */
  context_name: string;
  /** Optional context description */
  context_description: string | null;
  /** Name unique identifier */
  name_id: string;
  /** Actual name text */
  name_text: string;
  /** Assignment creation timestamp */
  created_at: string;
}

/**
 * Context without an assigned name.
 * Used to show available contexts for assignment creation.
 */
export interface UnassignedContext {
  /** Context unique identifier */
  id: string;
  /** Human-readable context name */
  context_name: string;
  /** Optional context description */
  description: string | null;
}

/**
 * Complete response data for GET /api/assignments.
 * Includes assignments, unassigned contexts, and metadata.
 */
export interface AssignmentsResponseData {
  /** Array of existing assignments with details */
  assignments: AssignmentWithDetails[];
  /** Array of contexts without assignments */
  unassigned_contexts: UnassignedContext[];
  /** Total number of user contexts */
  total_contexts: number;
  /** Number of contexts with assignments */
  assigned_contexts: number;
  /** Request metadata and applied filters */
  metadata: {
/** Timestamp when data was retrieved */
retrieval_timestamp: string;
/** Filters applied to the query */
filter_applied: {
  /** Optional context ID filter */
  context_id?: string;
  /** Optional result limit */
  limit?: number;
};
/** User ID that owns the assignments */
user_id: string;
  };
}

/**
 * Response data for POST /api/assignments (assignment creation).
 */
export interface CreateAssignmentResponseData {
  /** Success message */
  message: string;
  /** Created assignment with full details */
  assignment: AssignmentWithDetails;
}

/**
 * Response data for PUT /api/assignments (assignment updates).
 */
export interface UpdateAssignmentResponseData {
  /** Success message */
  message: string;
  /** Updated assignment with full details */
  assignment: AssignmentWithDetails;
}

/**
 * Response data for DELETE /api/assignments (assignment deletion).
 */
export interface DeleteAssignmentResponseData {
  /** Success message */
  message: string;
  /** ID of the deleted assignment */
  deleted_assignment_id: string;
  /** ID of the context that was unassigned */
  context_id: string;
  /** Name of the context that was unassigned */
  context_name: string;
  /** Timestamp when deletion occurred */
  deleted_at: string;
}

/**
 * Response data for POST /api/assignments/bulk (bulk operations).
 * Provides counts and final state of all assignments.
 */
export interface BulkAssignmentResponseData {
  /** Number of assignments updated */
  updated: number;
  /** Number of assignments created */
  created: number;
  /** Number of assignments deleted */
  deleted: number;
  /** Current state of all user assignments */
  assignments: AssignmentWithDetails[];
}
