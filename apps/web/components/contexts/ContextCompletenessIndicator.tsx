'use client';

import { Badge, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconAlertTriangle, IconX } from '@tabler/icons-react';
import type { ContextCompletionStatus } from '@/utils/contexts/completeness';

interface ContextCompletenessIndicatorProps {
  completionStatus: ContextCompletionStatus;
  assignmentCount: number;
  missingProperties?: string[];
  className?: string;
}

function getCompletenessColor(status: ContextCompletionStatus): string {
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

function getCompletenessIcon(status: ContextCompletionStatus) {
  switch (status) {
case 'invalid':
  return <IconX size={14} />;
case 'partial':
  return <IconAlertTriangle size={14} />;
case 'complete':
  return <IconCheck size={14} />;
default:
  return null;
  }
}

function getCompletenessLabel(status: ContextCompletionStatus): string {
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
  completionStatus,
  assignmentCount,
  missingProperties = [],
  className,
}: ContextCompletenessIndicatorProps) {
  const completenessColor = getCompletenessColor(completionStatus);
  const completenessIcon = getCompletenessIcon(completionStatus);
  const completenessLabel = getCompletenessLabel(completionStatus);

  // Separate required and optional missing properties
  const requiredProperties = ['name', 'given_name', 'family_name'];
  const missingRequired = missingProperties.filter((p) =>
requiredProperties.includes(p),
  );
  const missingOptional = missingProperties.filter(
(p) => !requiredProperties.includes(p),
  );

  const tooltipContent = (
<div>
  <Text size='sm' fw='500' mb='xs'>
{completenessLabel} ({assignmentCount}/7 properties)
  </Text>

  {completionStatus === 'invalid' && missingRequired.length > 0 && (
<Text size='sm' c='red' mb='xs'>
  Missing required: {formatMissingProperties(missingRequired)}
</Text>
  )}

  {completionStatus === 'partial' && missingOptional.length > 0 && (
<Text size='sm' c='dimmed'>
  Missing optional: {formatMissingProperties(missingOptional)}
</Text>
  )}

  {completionStatus === 'complete' && (
<Text size='sm' c='green'>
  All properties assigned
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
