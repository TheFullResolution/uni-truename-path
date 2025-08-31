'use client';

import { Group, Text, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

/**
 * Props for the AssignmentRequiredField component
 */
interface AssignmentRequiredFieldProps {
  /** Whether to show the required indicator */
  required: boolean;
  /** The main field label text */
  label: string;
  /** Optional field description */
  description?: string;
  /** Custom tooltip text (defaults to OIDC compliance message) */
  tooltip?: string;
  /** Additional content to display alongside the label */
  children?: ReactNode;
  /** Additional className for custom styling */
  className?: string;
}

/**
 * Default tooltip message for required OIDC properties
 */
const DEFAULT_REQUIRED_TOOLTIP =
  'Required for default context OIDC compliance. This property cannot be unassigned.';

/**
 * AssignmentRequiredField Component
 *
 * A reusable component for displaying field labels with required indicators
 * in assignment forms. Provides consistent styling and accessibility features
 * for required field indication across the application.
 *
 * @component
 * @example
 * ```tsx
 * <AssignmentRequiredField
 *   required={isRequired}
 *   label="Given Name"
 *   description="Your first/given name (e.g., John)"
 * >
 *   <Badge size='xs' color='red' variant='light'>Required</Badge>
 * </AssignmentRequiredField>
 * ```
 */
export function AssignmentRequiredField({
  required,
  label,
  description,
  tooltip = DEFAULT_REQUIRED_TOOLTIP,
  children,
  className,
}: AssignmentRequiredFieldProps) {
  const RequiredIndicator = () => {
if (!required) return null;

const asterisk = (
  <Text
component='span'
c='red.6'
fw={500}
ml={4}
style={{
  lineHeight: 'inherit',
  verticalAlign: 'baseline',
}}
aria-label='Required field'
  >
*
  </Text>
);

// Show tooltip only for required fields
return (
  <Tooltip
label={tooltip}
position='top-start'
withArrow
multiline
w={300}
styles={{
  tooltip: {
fontSize: '13px',
lineHeight: 1.4,
padding: '8px 12px',
  },
}}
  >
<span style={{ cursor: 'help' }}>{asterisk}</span>
  </Tooltip>
);
  };

  return (
<div className={className} role='group'>
  <Group gap='xs' align='flex-start' wrap='nowrap'>
{/* Main label with required indicator */}
<Group gap={0} align='baseline' wrap='nowrap'>
  <Text fw={500} size='sm' style={{ lineHeight: 1.4 }}>
{label}
  </Text>
  <RequiredIndicator />
</Group>

{/* Additional content (badges, etc.) */}
{children && <div style={{ flexShrink: 0 }}>{children}</div>}
  </Group>

  {/* Field description */}
  {description && (
<Text size='xs' c='dimmed' mt={4} style={{ lineHeight: 1.3 }}>
  {description}
</Text>
  )}
</div>
  );
}

/**
 * Utility function to determine if a field should show required indicator
 * based on OIDC property and context requirements
 *
 * @param property - The OIDC property name
 * @param isDefaultContext - Whether this is the default (permanent) context
 * @returns Boolean indicating if the field is required
 */
export const isAssignmentPropertyRequired = (
  property: string,
  isDefaultContext: boolean,
): boolean => {
  if (!isDefaultContext) return false;

  // Required OIDC properties for default context
  const requiredProperties = ['given_name', 'family_name', 'name'] as const;
  return requiredProperties.includes(
property as (typeof requiredProperties)[number],
  );
};

/**
 * Utility function to get appropriate tooltip message for an OIDC property
 *
 * @param property - The OIDC property name
 * @param isRequired - Whether the field is required
 * @returns Appropriate tooltip message
 */
export const getAssignmentFieldTooltip = (
  property: string,
  isRequired: boolean,
): string => {
  if (!isRequired) {
return `Optional OIDC property. Can be left unassigned.`;
  }

  const propertyDescriptions: Record<string, string> = {
given_name: 'Required OIDC property for given name identification.',
family_name: 'Required OIDC property for family name identification.',
name: 'Required OIDC property for full name display.',
  };

  return (
propertyDescriptions[property] ||
'Required for default context OIDC compliance.'
  );
};
