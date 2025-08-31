import { z } from 'zod';
import type { Enums } from '@/generated/database';
import type { UserContext } from '@/types/database';
import {
  isDefaultContext,
  getRequiredPropertiesForContext,
} from './oidc-constraints';

// Constants for assignment validation
export const ASSIGNMENT_ERROR_MESSAGES = {
  REQUIRED_PROPERTY_MISSING:
'This property is required for the default context',
  INVALID_NAME_ID: 'Invalid name selection',
  EMPTY_ASSIGNMENTS: 'At least one name assignment is required',
  CONTEXT_NOT_FOUND: 'Context not found',
} as const;

// Assignment value schema - validates individual property assignments
export const assignmentValueSchema = z.union([
  z.string().min(1, 'Name selection is required'),
  z.literal(''), // Allow empty string for non-required properties
]);

// Form values schema for assignment dialog
export const assignmentFormSchema = z.object({
  assignments: z.record(
z.string(), // OIDC property key
assignmentValueSchema,
  ),
});

// Schema for validating a single assignment
export const singleAssignmentSchema = z.object({
  oidc_property: z.string().min(1, 'OIDC property is required'),
  name_id: z.union([z.string().min(1), z.null()]),
  context_id: z.string().min(1, 'Context ID is required'),
});

// Batch assignment schema for API operations
export const batchAssignmentSchema = z.object({
  context_id: z.string().min(1, 'Context ID is required'),
  assignments: z.array(
z.object({
  oidc_property: z.string().min(1, 'OIDC property is required'),
  name_id: z.union([z.string().min(1), z.null()]),
}),
  ),
});

// Type definitions
export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;
export type SingleAssignmentData = z.infer<typeof singleAssignmentSchema>;
export type BatchAssignmentData = z.infer<typeof batchAssignmentSchema>;

export interface AssignmentValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings?: string[];
}

export interface AssignmentContext {
  context: UserContext;
  isDefaultContext: boolean;
  requiredProperties: readonly Enums<'oidc_property'>[];
}

/**
 * Validates an individual assignment value for a specific OIDC property
 *
 * @param property - The OIDC property being assigned
 * @param value - The name ID value (can be string or null)
 * @param context - The assignment context information
 * @returns Error message string or null if valid
 */
export const validateAssignmentValue = (
  property: Enums<'oidc_property'>,
  value: string | null | undefined,
  context: AssignmentContext,
): string | null => {
  const { isDefaultContext: isDefault, requiredProperties } = context;

  // Check if this property is required for the current context
  const isRequired = isDefault && requiredProperties.includes(property);

  // Validate required properties
  if (isRequired && (!value || value.trim() === '')) {
return ASSIGNMENT_ERROR_MESSAGES.REQUIRED_PROPERTY_MISSING;
  }

  // Validate non-empty values
  if (value && value.trim() !== '' && value.length < 1) {
return ASSIGNMENT_ERROR_MESSAGES.INVALID_NAME_ID;
  }

  return null;
};

/**
 * Validates all required assignments for a given context
 *
 * @param assignments - Form values with property -> name_id mappings
 * @param context - The assignment context information
 * @returns Validation result with errors for each invalid property
 */
export const validateRequiredAssignments = (
  assignments: Record<string, string | null | undefined>,
  context: AssignmentContext,
): AssignmentValidationResult => {
  const { requiredProperties } = context;
  const errors: Record<string, string> = {};

  // Validate each required property
  requiredProperties.forEach((property) => {
const value = assignments[property];
const error = validateAssignmentValue(property, value, context);

if (error) {
  errors[property] = error;
}
  });

  return {
valid: Object.keys(errors).length === 0,
errors,
  };
};

/**
 * Gets comprehensive validation errors for the entire assignment form
 *
 * @param assignments - Form values with property -> name_id mappings
 * @param context - The assignment context information
 * @returns Complete validation result with all errors and warnings
 */
export const getAssignmentValidationErrors = (
  assignments: Record<string, string | null | undefined>,
  context: AssignmentContext,
): AssignmentValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate each assignment in the form
  Object.entries(assignments).forEach(([property, value]) => {
const error = validateAssignmentValue(
  property as Enums<'oidc_property'>,
  value,
  context,
);

if (error) {
  errors[property] = error;
}
  });

  // Check if default context has any unassigned required properties
  if (context.isDefaultContext) {
context.requiredProperties.forEach((property) => {
  if (!(property in assignments) || !assignments[property]) {
errors[property] = ASSIGNMENT_ERROR_MESSAGES.REQUIRED_PROPERTY_MISSING;
  }
});
  }

  // Add warning if no assignments are present (for non-default contexts)
  if (!context.isDefaultContext && Object.keys(assignments).length === 0) {
warnings.push(
  'Consider adding at least one name assignment for this context',
);
  }

  return {
valid: Object.keys(errors).length === 0,
errors,
warnings,
  };
};

/**
 * Creates assignment context information from a UserContext object
 *
 * @param context - The user context object
 * @returns Assignment context with validation metadata
 */
export const createAssignmentContext = (
  context: UserContext,
): AssignmentContext => {
  const isDefault = isDefaultContext(context);
  const requiredProperties = getRequiredPropertiesForContext(context);

  return {
context,
isDefaultContext: isDefault,
requiredProperties,
  };
};

/**
 * Validates a batch assignment operation before API submission
 *
 * @param batchData - The batch assignment data to validate
 * @param context - The assignment context information
 * @returns Validation result for the batch operation
 */
export const validateBatchAssignment = (
  batchData: BatchAssignmentData,
  context: AssignmentContext,
): AssignmentValidationResult => {
  // Validate the batch structure first
  const schemaResult = batchAssignmentSchema.safeParse(batchData);
  if (!schemaResult.success) {
return {
  valid: false,
  errors: { batch: 'Invalid batch assignment structure' },
};
  }

  // Convert assignments array to record format for validation
  const assignmentsRecord: Record<string, string | null> = {};
  batchData.assignments.forEach((assignment) => {
assignmentsRecord[assignment.oidc_property] = assignment.name_id;
  });

  // Use existing validation logic
  return getAssignmentValidationErrors(assignmentsRecord, context);
};

/**
 * Helper function to check if an assignment form has validation errors
 *
 * @param assignments - Form values with property -> name_id mappings
 * @param context - The assignment context information
 * @returns Boolean indicating if form is valid
 */
export const isAssignmentFormValid = (
  assignments: Record<string, string | null | undefined>,
  context: AssignmentContext,
): boolean => {
  const result = getAssignmentValidationErrors(assignments, context);
  return result.valid;
};

/**
 * Gets user-friendly error message for a specific OIDC property
 *
 * @param property - The OIDC property
 * @param context - The assignment context information
 * @returns User-friendly error message
 */
export const getPropertyValidationMessage = (
  property: Enums<'oidc_property'>,
  context: AssignmentContext,
): string => {
  const isRequired =
context.isDefaultContext && context.requiredProperties.includes(property);

  if (isRequired) {
return `${property.replace('_', ' ')} is required for the default context`;
  }

  return `Please select a name for ${property.replace('_', ' ')}`;
};

// Export validation constants for use in UI components
export { REQUIRED_OIDC_PROPERTIES } from './oidc-constraints';
