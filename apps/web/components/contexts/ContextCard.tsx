'use client';

import type { ContextWithStats } from '@/app/api/contexts/types';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconLock,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react';

interface ContextCardProps {
  context: ContextWithStats;
  onEdit?: (context: ContextWithStats) => void;
  onDelete?: (context: ContextWithStats) => void;
  onEditAssignments?: (context: ContextWithStats) => void;
}

function getVisibilityBadgeColor(visibility: string): string {
  switch (visibility) {
case 'public':
  return 'green';
case 'restricted':
  return 'yellow';
case 'private':
  return 'red';
default:
  return 'gray';
  }
}

function getVisibilityLabel(visibility: string): string {
  switch (visibility) {
case 'public':
  return 'Public';
case 'restricted':
  return 'Restricted';
case 'private':
  return 'Private';
default:
  return 'Unknown';
  }
}

export function ContextCard({
  context,
  onEdit,
  onDelete,
  onEditAssignments,
}: ContextCardProps) {
  const isPermanent = context.is_permanent === true;
  const visibilityColor = getVisibilityBadgeColor(context.visibility);
  const visibilityLabel = getVisibilityLabel(context.visibility);

  return (
<Card p='md' withBorder>
  <Stack gap='sm'>
{/* Header with name and badges */}
<Group justify='space-between' align='flex-start'>
  <div style={{ flex: 1 }}>
<Group gap='xs' align='center' mb={4}>
  <Text fw={600} size='lg'>
{context.context_name}
  </Text>

  {/* Default Badge for permanent contexts */}
  {isPermanent && (
<Tooltip
  label='This is your default context and cannot be deleted or renamed'
  withArrow
  position='top'
>
  <Badge
size='sm'
variant='light'
color='blue'
leftSection={<IconLock size={12} />}
  >
Default
  </Badge>
</Tooltip>
  )}

  {/* Assignment Count Badge */}
  <Badge size='sm' variant='light' color='cyan'>
{context.oidc_assignment_count} assignment
{context.oidc_assignment_count !== 1 ? 's' : ''}
  </Badge>

  {/* Visibility Badge */}
  <Badge size='sm' variant='light' color={visibilityColor}>
{visibilityLabel}
  </Badge>
</Group>

{/* Description */}
{context.description && (
  <Text size='sm' c='dimmed'>
{context.description}
  </Text>
)}
  </div>
</Group>

{/* Action buttons */}
<Group justify='space-between' align='center'>
  <div>
{/* Edit Assignments button - always visible */}
<Button
  variant='light'
  size='sm'
  leftSection={<IconSettings size={16} />}
  onClick={() => onEditAssignments?.(context)}
  data-testid='edit-assignments-button'
>
  Edit Assignments
</Button>
  </div>

  <Group gap='xs'>
{/* Edit button - only for non-permanent contexts */}
{!isPermanent && onEdit && (
  <ActionIcon
variant='light'
color='blue'
onClick={() => onEdit(context)}
data-testid='edit-context-button'
  >
<IconEdit size={16} />
  </ActionIcon>
)}

{/* Delete button - only for non-permanent contexts */}
{!isPermanent && onDelete && (
  <ActionIcon
color='red'
variant='light'
onClick={() => onDelete(context)}
data-testid='delete-context-button'
  >
<IconTrash size={16} />
  </ActionIcon>
)}

{/* Lock icon for permanent contexts */}
{isPermanent && (
  <Tooltip
label='Default context cannot be edited or deleted'
withArrow
position='top'
  >
<ActionIcon
  variant='light'
  color='gray'
  disabled
  data-testid='permanent-context-indicator'
>
  <IconLock size={16} />
</ActionIcon>
  </Tooltip>
)}
  </Group>
</Group>

{/* Footer with metadata */}
<Divider />

<Group justify='space-between' align='center'>
  <Text size='sm' c='dimmed'>
Created: {new Date(context.created_at).toLocaleDateString()}
  </Text>
  {isPermanent && (
<Text size='sm' c='dimmed' fs='italic'>
  • System Default
</Text>
  )}
</Group>
  </Stack>
</Card>
  );
}
