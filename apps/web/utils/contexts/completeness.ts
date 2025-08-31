/**
 * Context completeness utilities
 *
 * Three-status system:
 * - Invalid: Missing required properties (exclude from lists)
 * - Partial: Has all required but missing optional (allow in lists)
 * - Complete: Has all properties (allow in lists)
 */

export type ContextCompletionStatus = 'invalid' | 'partial' | 'complete';

// Required OIDC properties for a context to be valid
const REQUIRED_PROPERTIES = ['name', 'given_name', 'family_name'] as const;

// All OIDC properties (3 required + 4 optional)
const ALL_PROPERTIES = [
  'name',
  'given_name',
  'family_name',
  'nickname',
  'display_name',
  'preferred_username',
  'middle_name',
] as const;

export interface ContextCompletionInfo {
  status: ContextCompletionStatus;
  isValid: boolean; // true for 'partial' and 'complete', false for 'invalid'
  assignedCount: number;
  requiredCount: number;
  optionalCount: number;
  missingRequired: string[];
  missingOptional: string[];
}

/**
 * Calculate the completion status of a context based on assigned OIDC properties
 */
export function getContextCompletionStatus(
  assignedProperties: string[],
): ContextCompletionInfo {
  // Check which required properties are missing
  const missingRequired = REQUIRED_PROPERTIES.filter(
(prop) => !assignedProperties.includes(prop),
  );

  // Check which optional properties are missing
  const allPropertiesSet = new Set(ALL_PROPERTIES);
  const requiredSet = new Set(REQUIRED_PROPERTIES);
  const optionalProperties = Array.from(allPropertiesSet).filter(
(prop) => !requiredSet.has(prop as (typeof REQUIRED_PROPERTIES)[number]),
  );

  const missingOptional = optionalProperties.filter(
(prop) => !assignedProperties.includes(prop),
  );

  // Count assigned properties by category
  const requiredCount = REQUIRED_PROPERTIES.filter((prop) =>
assignedProperties.includes(prop),
  ).length;

  const optionalCount = assignedProperties.length - requiredCount;

  // Determine status
  let status: ContextCompletionStatus;
  if (missingRequired.length > 0) {
status = 'invalid';
  } else if (assignedProperties.length === ALL_PROPERTIES.length) {
status = 'complete';
  } else {
status = 'partial';
  }

  return {
status,
isValid: status !== 'invalid',
assignedCount: assignedProperties.length,
requiredCount,
optionalCount,
missingRequired,
missingOptional,
  };
}

/**
 * Quick check if a context is valid (has all required properties)
 */
export function isContextValid(assignedProperties: string[]): boolean {
  return REQUIRED_PROPERTIES.every((prop) => assignedProperties.includes(prop));
}

/**
 * Get display label for completion status
 */
export function getCompletionStatusLabel(
  status: ContextCompletionStatus,
): string {
  switch (status) {
case 'invalid':
  return 'Invalid';
case 'partial':
  return 'Partial';
case 'complete':
  return 'Complete';
default:
  return 'Unknown';
  }
}

/**
 * Get color for completion status (for UI components)
 */
export function getCompletionStatusColor(
  status: ContextCompletionStatus,
): string {
  switch (status) {
case 'invalid':
  return 'red';
case 'partial':
  return 'yellow';
case 'complete':
  return 'green';
default:
  return 'gray';
  }
}
