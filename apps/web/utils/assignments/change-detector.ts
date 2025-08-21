// TrueNamePath: OIDC Assignment Change Detection Utilities

import type { OIDCAssignmentWithDetails } from '@/app/api/assignments/types';
import type { OIDCProperty, Enums } from '@/types/database';

// =============================================================================
// Change Detection Types
// =============================================================================

/**
 * Represents a detected change in an OIDC assignment
 */
export interface AssignmentChange {
  /** The OIDC property being changed */
  oidc_property: OIDCProperty;
  /** Original name ID (null = was unassigned) */
  old_value: string | null;
  /** New name ID (null = now unassigned) */
  new_value: string | null;
  /** Type of operation needed */
  operation: 'create' | 'update' | 'delete' | 'unchanged';
}

/**
 * All supported OIDC properties for change detection
 * Sourced from database enum for type safety
 */
const OIDC_PROPERTIES: readonly Enums<'oidc_property'>[] = [
  'given_name',
  'family_name',
  'name',
  'nickname',
  'display_name',
  'preferred_username',
  'middle_name',
] as const;

// =============================================================================
// Core Change Detection Logic
// =============================================================================

/**
 * Detects changes between original OIDC assignments and form values.
 */
export function detectAssignmentChanges(
  originalAssignments: OIDCAssignmentWithDetails[],
  formValues: Record<string, string>, // From Mantine useForm.values
): AssignmentChange[] {
  // Create lookup map for efficient original assignment lookup
  const originalMap = new Map<OIDCProperty, string | null>();

  // Populate lookup map with current assignments
  for (const assignment of originalAssignments) {
originalMap.set(assignment.oidc_property, assignment.name_id);
  }

  // Process all OIDC properties to detect changes
  const changes: AssignmentChange[] = [];

  for (const oidcProperty of OIDC_PROPERTIES) {
const oldValue = originalMap.get(oidcProperty) || null;
const newValue = normalizeFormValue(formValues[oidcProperty]);

const operation = determineOperation(oldValue, newValue);

changes.push({
  oidc_property: oidcProperty,
  old_value: oldValue,
  new_value: newValue,
  operation,
});
  }

  return changes;
}

/**
 * Filters changes to return only those requiring actual operations.
 */
export function getActualChanges(
  changes: AssignmentChange[],
): AssignmentChange[] {
  return changes.filter((change) => change.operation !== 'unchanged');
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalizes form values to handle empty strings consistently.
 */
function normalizeFormValue(formValue: string | undefined): string | null {
  if (formValue === undefined || formValue === '' || formValue.trim() === '') {
return null;
  }
  return formValue.trim();
}

/**
 * Determines the operation type based on old and new values.
 */
function determineOperation(
  oldValue: string | null,
  newValue: string | null,
): AssignmentChange['operation'] {
  if (oldValue === newValue) {
return 'unchanged';
  }

  if (oldValue === null && newValue !== null) {
return 'create';
  }

  if (oldValue !== null && newValue === null) {
return 'delete';
  }

  if (oldValue !== null && newValue !== null) {
return 'update';
  }

  return 'unchanged';
}
