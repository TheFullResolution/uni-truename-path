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
