// TrueNamePath: Name Assignments SWR Hook
// Custom SWR hook for fetching name context assignments
// Date: August 31, 2025
// Academic project infrastructure following established SWR patterns

import useSWR from 'swr';
import { swrFetcher } from '@/utils/swr-fetcher';
import { type NameAssignmentsResponse } from '@/types/database';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Extended response type from the /api/names/[nameId]/assignments endpoint
 * Includes metadata for tracking and debugging
 */
export interface NameAssignmentsResponseData extends NameAssignmentsResponse {
  metadata: {
name_id: string;
user_id: string;
retrieval_timestamp: string;
  };
}

/**
 * Individual assignment details for easier component consumption
 */
export interface NameAssignment {
  context_id: string;
  context_name: string;
  is_permanent: boolean;
  oidc_property: string;
}

// =============================================================================
// SWR Hook
// =============================================================================

/**
 * Custom SWR hook for fetching name context assignments
 *
 * @param nameId - The name ID to fetch assignments for, or null to skip fetching
 * @returns Standard SWR response with assignments data, loading state, error, and mutate function
 *
 * @example
 * ```tsx
 * const { data, error, isLoading, mutate } = useNameAssignments(nameId);
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Alert>Error loading assignments</Alert>;
 * if (data) {
 *   console.log(`Name has ${data.total} assignments`);
 *   data.assignments.forEach(assignment => {
 * console.log(`Assigned to ${assignment.context_name} as ${assignment.oidc_property}`);
 *   });
 * }
 * ```
 */
export function useNameAssignments(nameId: string | null) {
  return useSWR<NameAssignmentsResponseData>(
nameId ? `/api/names/${nameId}/assignments` : null,
swrFetcher<NameAssignmentsResponseData>,
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Helper function to determine if a name is protected (has assignments)
 *
 * @param assignments - The assignments array from useNameAssignments
 * @returns boolean indicating if the name has any context assignments
 */
export function isNameProtected(
  assignments: NameAssignment[] | undefined,
): boolean {
  return (assignments?.length ?? 0) > 0;
}

/**
 * Helper function to get assignment count for a name
 *
 * @param assignments - The assignments array from useNameAssignments
 * @returns number of assignments
 */
export function getAssignmentCount(
  assignments: NameAssignment[] | undefined,
): number {
  return assignments?.length ?? 0;
}
