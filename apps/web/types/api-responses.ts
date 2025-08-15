/**
 * Centralized API Response Types for TrueNamePath
 *
 * This file provides type-safe interfaces for all API responses used throughout
 * the TrueNamePath application. It eliminates type duplication by creating
 * standardized response types that components can import and use with SWR.
 *
 * Key Benefits:
 * - Single source of truth for API response structures
 * - Full TypeScript support with SWR generic fetchers
 * - Consistent snake_case naming convention matching database schema
 * - Type-safe API operations from endpoint to component
 *
 * @fileoverview Centralized API response type infrastructure
 */
import { Enums, Tables } from './generated';

// Import database types from the single source of truth

// Type aliases for convenience
type Name = Tables<'names'>;
type ContextNameAssignment = Tables<'context_name_assignments'>;
type NameCategory = Enums<'name_category'>;

/**
 * Assignment with Context and Name Details (snake_case)
 *
 * Represents a context-name assignment with all joined data from the database.
 * Used when the API returns assignments with context and name information.
 */
export interface AssignmentWithDetails {
  /**
   * Unique identifier for the assignment
   */
  id: string;

  /**
   * ID of the context this assignment belongs to
   */
  context_id: string;

  /**
   * Human-readable name of the context
   */
  context_name: string;

  /**
   * Optional description of the context
   */
  context_description: string | null;

  /**
   * ID of the name variant assigned to this context
   */
  name_id: string;

  /**
   * The actual text of the name variant
   */
  name_text: string;

  /**
   * Category of the name (LEGAL, PREFERRED, etc.)
   */
  name_type: NameCategory;

  /**
   * When this assignment was created
   */
  created_at: string;
}

/**
 * Unassigned Context (snake_case)
 *
 * Represents a user context that does not yet have a name assignment.
 * Used to show contexts available for assignment.
 */
export interface UnassignedContext {
  /**
   * Unique identifier for the context
   */
  id: string;

  /**
   * Human-readable name of the context
   */
  context_name: string;

  /**
   * Optional description of the context
   */
  description: string | null;
}

/**
 * GET /api/assignments Response Data
 *
 * Complete response structure for the assignments list endpoint.
 * Includes assignments, unassigned contexts, and metadata.
 */
export interface AssignmentsResponseData {
  /**
   * List of current context-name assignments with full details
   */
  assignments: AssignmentWithDetails[];

  /**
   * List of contexts that don't have name assignments yet
   */
  unassigned_contexts: UnassignedContext[];

  /**
   * Total number of contexts owned by the user
   */
  total_contexts: number;

  /**
   * Number of contexts that have name assignments
   */
  assigned_contexts: number;

  /**
   * Request metadata for debugging and filtering information
   */
  metadata: {
/**
 * ISO timestamp when the data was retrieved
 */
retrievalTimestamp: string;

/**
 * Filters that were applied to the request
 */
filterApplied?: {
  /**
   * Filter by specific context ID
   */
  contextId?: string;

  /**
   * Limit on number of results
   */
  limit?: number;
};

/**
 * ID of the user who owns these assignments
 */
userId: string;
  };
}

/**
 * POST /api/assignments/bulk Response Data
 *
 * Response structure for bulk assignment operations.
 * Includes operation counts and updated assignment list.
 */
export interface BulkAssignmentResponseData {
  /**
   * Number of assignments that were updated
   */
  updated: number;

  /**
   * Number of new assignments that were created
   */
  created: number;

  /**
   * Number of assignments that were deleted
   */
  deleted: number;

  /**
   * Complete list of assignments after the bulk operation
   */
  assignments: AssignmentWithDetails[];
}

/**
 * GET /api/names Response Data
 *
 * Response structure for the name variants list endpoint.
 * Includes user's name variants and metadata.
 */
export interface NamesResponseData {
  /**
   * List of name variants owned by the user
   */
  names: Name[];

  /**
   * Total number of name variants
   */
  total: number;

  /**
   * Request metadata for debugging and filtering information
   */
  metadata: {
/**
 * ISO timestamp when the data was retrieved
 */
retrievalTimestamp: string;

/**
 * Filters that were applied to the request
 */
filterApplied?: {
  /**
   * Filter by specific name type
   */
  nameType?: string;

  /**
   * Limit on number of results
   */
  limit?: number;
};

/**
 * ID of the user who owns these names
 */
userId: string;
  };
}

/**
 * POST /api/assignments Create Response Data
 *
 * Response structure when creating a single assignment.
 */
export interface CreateAssignmentResponseData {
  /**
   * Success message
   */
  message: string;

  /**
   * The created assignment with full details
   */
  assignment: AssignmentWithDetails;
}

/**
 * PUT /api/assignments Update Response Data
 *
 * Response structure when updating a single assignment.
 */
export interface UpdateAssignmentResponseData {
  /**
   * Success message
   */
  message: string;

  /**
   * The updated assignment data
   */
  assignment: ContextNameAssignment;
}

/**
 * DELETE /api/assignments Delete Response Data
 *
 * Response structure when deleting a single assignment.
 */
export interface DeleteAssignmentResponseData {
  /**
   * Success message
   */
  message: string;

  /**
   * ID of the deleted assignment
   */
  deleted_assignment_id: string;

  /**
   * ID of the context that was unassigned
   */
  context_id: string;

  /**
   * Name of the context that was unassigned
   */
  context_name: string;

  /**
   * When the deletion occurred
   */
  deleted_at: string;
}

/**
 * Request Types for API Operations
 *
 * These types define the structure of request bodies for various operations.
 */

/**
 * Create Assignment Request Body
 */
export interface CreateAssignmentRequest {
  /**
   * ID of the context to assign a name to
   */
  contextId: string;

  /**
   * ID of the name variant to assign
   */
  nameId: string;
}

/**
 * Update Assignment Request Body
 */
export interface UpdateAssignmentRequest {
  /**
   * ID of the assignment to update
   */
  assignmentId: string;

  /**
   * New context ID (optional)
   */
  contextId?: string;

  /**
   * New name ID (optional)
   */
  nameId?: string;
}

/**
 * Delete Assignment Request Body
 */
export interface DeleteAssignmentRequest {
  /**
   * ID of the assignment to delete
   */
  assignmentId: string;
}

/**
 * Bulk Assignment Request Body
 */
export interface BulkAssignmentRequest {
  /**
   * Array of assignment operations to perform
   */
  assignments: Array<{
/**
 * Context ID for the assignment
 */
context_id: string;

/**
 * Name ID to assign (null to delete assignment)
 */
name_id: string | null;
  }>;
}

/**
 * Type Utilities for SWR Integration
 *
 * These utilities help with type-safe SWR usage.
 */

/**
 * Extract the data type from a JSend success response
 */
export type ExtractApiResponseData<T> = T extends { data: infer D } ? D : never;

/**
 * SWR Error type for API responses
 */
export interface ApiError extends Error {
  /**
   * HTTP status code
   */
  status?: number;

  /**
   * Structured error information from API
   */
  details?: unknown;
}

/**
 * Context Response Types
 */

/**
 * Context with statistics for dashboard display
 */
export interface ContextWithStats {
  id: string;
  context_name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  name_assignments_count: number;
  has_active_consents: boolean;
}

/**
 * GET /api/contexts Response Data
 */
export interface ContextsResponseData {
  contexts: ContextWithStats[];
  total: number;
}

/**
 * POST /api/contexts Response Data
 */
export interface CreateContextResponseData {
  message: string;
  context: Omit<
ContextWithStats,
'name_assignments_count' | 'has_active_consents'
  >;
}

/**
 * PUT /api/contexts/[id] Response Data
 */
export interface UpdateContextResponseData {
  message: string;
  context: ContextWithStats;
}

/**
 * DELETE /api/contexts/[id] Response Data
 */
export interface DeleteContextResponseData {
  message: string;
  deleted_context_id: string;
  context_name: string;
  deleted_at: string;
}

/**
 * Name Response Types
 */

/**
 * POST /api/names Response Data
 */
export interface CreateNameResponseData {
  message: string;
  name: Name;
}

/**
 * PUT /api/names Response Data
 */
export interface UpdateNameResponseData {
  message: string;
  name: Name;
}

/**
 * DELETE /api/names Response Data
 */
export interface DeleteNameResponseData {
  message: string;
  deleted_name_id: string;
  name_text: string;
  deleted_at: string;
}

/**
 * Request Types for Context Operations
 */

/**
 * Create Context Request Body
 */
export interface CreateContextRequest {
  context_name: string;
  description?: string | null;
}

/**
 * Update Context Request Body
 */
export interface UpdateContextRequest {
  context_name?: string;
  description?: string | null;
}

/**
 * Create Name Request Body
 */
export interface CreateNameRequest {
  name_text: string;
  name_type: NameCategory;
  is_preferred?: boolean;
}

/**
 * Update Name Request Body
 */
export interface UpdateNameRequest {
  nameId: string;
  name_text?: string;
  name_type?: NameCategory;
  isPreferred?: boolean;
}

/**
 * Name Resolution Types
 */

/**
 * Individual batch resolution item
 */
export interface BatchResolutionItem {
  context: string;
  resolvedName: string;
  source: string;
  responseTimeMs: number;
  errorMessage?: string;
}

/**
 * GET /api/names/resolve/batch/[userId] Response Data
 */
export interface BatchResolutionResponseData {
  userId: string;
  resolutions: BatchResolutionItem[];
  totalContexts: number;
  successfulResolutions: number;
  batchTimeMs: number;
  requestTimestamp: string;
  authenticated: string;
}
