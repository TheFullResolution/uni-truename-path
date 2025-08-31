'use client';

import { Badge, Group, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconExclamationMark, IconX } from '@tabler/icons-react';

interface ContextCompletenessIndicatorProps {
  isComplete: boolean;
  assignmentCount: number;
  totalRequiredProperties: number; // Always 3 (name, given_name, family_name)
  totalOptionalProperties: number; // 4 (nickname, display_name, preferred_username, middle_name)
  missingProperties?: string[];
  className?: string;
}

function getCompletenessColor(
  assignmentCount: number,
  totalRequiredProperties: number,
  totalProperties: number,
): string {
  if (assignmentCount < totalRequiredProperties) {
return 'red'; // Missing required properties
  }
  if (assignmentCount >= totalProperties) {
return 'green'; // All properties assigned
  }
  return 'yellow'; // Has all required, missing some optional
}

function getCompletenessIcon(
  assignmentCount: number,
  totalRequiredProperties: number,
  totalProperties: number,
) {
  if (assignmentCount < totalRequiredProperties) {
return <IconX size={14} />; // Incomplete (missing required)
  }
  if (assignmentCount >= totalProperties) {
return <IconCheck size={14} />; // Complete
  }
  return <IconExclamationMark size={14} />; // Partial (has required, missing optional)
}

function getCompletenessLabel(
  assignmentCount: number,
  totalRequiredProperties: number,
  totalProperties: number,
): string {
  if (assignmentCount < totalRequiredProperties) {
return 'Incomplete';
  }
  if (assignmentCount >= totalProperties) {
return 'Complete';
  }
  return 'Partial';
}

function formatMissingProperties(missingProperties: string[] = []): string {
  if (missingProperties.length === 0) {
return 'All properties assigned';
  }

  const propertyLabels: Record<string, string> = {
name: 'Full Name',
given_name: 'Given Name',
family_name: 'Family Name',
nickname: 'Nickname',
display_name: 'Display Name',
preferred_username: 'Preferred Username',
middle_name: 'Middle Name',
  };

  const formatted = missingProperties
.map((prop) => propertyLabels[prop] || prop)
.join(', ');

  return `Missing: ${formatted}`;
}

export function ContextCompletenessIndicator({
  isComplete,
  assignmentCount,
  totalRequiredProperties,
  totalOptionalProperties,
  missingProperties = [],
  className,
}: ContextCompletenessIndicatorProps) {
  const totalProperties = totalRequiredProperties + totalOptionalProperties;

  // Use the isComplete prop directly if available, otherwise fall back to calculation
  const actualIsComplete =
isComplete ?? assignmentCount >= totalRequiredProperties;

  const completenessColor = actualIsComplete
? getCompletenessColor(
assignmentCount,
totalRequiredProperties,
totalProperties,
  )
: 'red';

  const completenessIcon = actualIsComplete
? getCompletenessIcon(
assignmentCount,
totalRequiredProperties,
totalProperties,
  )
: getCompletenessIcon(
assignmentCount,
totalRequiredProperties,
totalProperties,
  );

  const completenessLabel = actualIsComplete
? getCompletenessLabel(
assignmentCount,
totalRequiredProperties,
totalProperties,
  )
: 'Incomplete';

  const requiredCount = Math.min(assignmentCount, totalRequiredProperties);
  const optionalCount = Math.max(0, assignmentCount - totalRequiredProperties);

  const tooltipContent = (
<div>
  <Text size='sm' fw='500' mb='xs'>
{completenessLabel} ({assignmentCount}/{totalProperties} assignments)
  </Text>

  <Group gap='xs' mb='xs'>
<Text size='sm'>
  Required: {requiredCount}/{totalRequiredProperties}
</Text>
<Text size='sm' c='dimmed'>
  Optional: {optionalCount}/{totalOptionalProperties}
</Text>
  </Group>

  {missingProperties.length > 0 && (
<Text size='sm' c='dimmed'>
  {formatMissingProperties(missingProperties)}
</Text>
  )}

  {isComplete !== undefined && (
<Text size='sm' c={actualIsComplete ? 'green' : 'red'} mt='xs'>
  Status: {actualIsComplete ? 'Complete' : 'Incomplete'}
</Text>
  )}
</div>
  );

  return (
<Tooltip label={tooltipContent} withArrow position='top' multiline w={280}>
  <Badge
size='sm'
variant='light'
color={completenessColor}
leftSection={completenessIcon}
className={className}
style={{ cursor: 'help' }}
data-testid='context-completeness-indicator'
  >
{completenessLabel}
  </Badge>
</Tooltip>
  );
}
