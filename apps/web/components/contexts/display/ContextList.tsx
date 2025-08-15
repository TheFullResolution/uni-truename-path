'use client';

import React from 'react';
import {
  Paper,
  Group,
  Title,
  Text,
  Button,
  Stack,
  Center,
  Card,
  Badge,
  ActionIcon,
  Skeleton,
  Box,
  Alert,
} from '@mantine/core';
import {
  IconTags,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
} from '@tabler/icons-react';
import type { ContextWithStats } from '../../../types/api-responses';
import { formatSWRError } from '../../../lib/swr-fetcher';

interface ContextListProps {
  contexts: ContextWithStats[];
  loading: boolean;
  error?: unknown;
  onEdit: (context: ContextWithStats) => void;
  onDelete: (context: ContextWithStats) => void;
  onRefresh: () => void;
}

export const ContextList = React.memo<ContextListProps>(function ContextList({
  contexts,
  loading,
  error,
  onEdit,
  onDelete,
  onRefresh,
}: ContextListProps) {
  // Handle error state with retry option
  if (error) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='lg'>
  <IconTags size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Your Contexts
  </Title>
</Group>
<Alert
  icon={<IconAlertCircle size={16} />}
  title='Unable to Load Contexts'
  color='red'
  variant='light'
  mb='md'
>
  <Text size='sm' mb='md'>
{formatSWRError(error)}
  </Text>
  <Button
variant='light'
color='red'
size='sm'
leftSection={<IconRefresh size={16} />}
onClick={onRefresh}
  >
Retry Loading
  </Button>
</Alert>
  </Paper>
);
  }

  // Enhanced loading state with more realistic skeleton structure
  if (loading) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Group justify='space-between' mb='lg'>
  <Group gap='sm'>
<IconTags size={24} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Your Contexts
</Title>
<Skeleton height={20} width={60} radius='sm' />
  </Group>
  <Skeleton height={32} width={80} radius='sm' />
</Group>
<Stack gap='md'>
  {/* Render 3 realistic context card skeletons */}
  {Array.from({ length: 3 }).map((_, index) => (
<Card key={index} p='md' withBorder radius='md' bg='gray.0'>
  <Group justify='space-between' align='flex-start'>
<Box flex={1}>
  <Group gap='sm' mb='xs'>
<Skeleton height={24} width={150} />
<Skeleton height={20} width={80} radius='sm' />
<Skeleton height={20} width={100} radius='sm' />
  </Group>
  <Skeleton height={16} width={200} mb='xs' />
  <Group gap='xs'>
<Skeleton height={12} width={100} />
<Skeleton height={12} width={120} />
  </Group>
</Box>
<Group gap='xs'>
  <Skeleton height={28} width={28} radius='sm' />
  <Skeleton height={28} width={28} radius='sm' />
</Group>
  </Group>
</Card>
  ))}
</Stack>
  </Paper>
);
  }

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group justify='space-between' mb='lg'>
<Group gap='sm'>
  <IconTags size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Your Contexts
  </Title>
  <Badge variant='light' color='blue' size='sm'>
{contexts.length} total
  </Badge>
</Group>
<Button
  variant='light'
  color='brand'
  size='sm'
  onClick={onRefresh}
  leftSection={<IconRefresh size={16} />}
  aria-label='Refresh contexts list'
  data-testid='refresh-contexts-button'
>
  Refresh
</Button>
  </Group>

  {contexts.length === 0 ? (
<Center py='xl'>
  <Stack align='center' gap='md'>
<IconTags size={48} color='#ced4da' />
<Text size='lg' c='gray.6'>
  No contexts created yet
</Text>
<Text size='sm' c='gray.5' ta='center'>
  Create your first context to start organizing your name variants
</Text>
  </Stack>
</Center>
  ) : (
<Stack gap='md'>
  {contexts.map((context) => (
<Card
  key={context.id}
  p='md'
  withBorder
  radius='md'
  bg='gray.0'
  role='article'
  aria-label={`Context: ${context.context_name}`}
>
  <Group justify='space-between' align='flex-start'>
<Box flex={1}>
  <Group gap='sm' mb='xs'>
<Text fw={600} size='lg' c='gray.8'>
  {context.context_name}
</Text>
<Badge
  variant='light'
  color={
context.name_assignments_count > 0 ? 'blue' : 'gray'
  }
  size='sm'
>
  {context.name_assignments_count} names assigned
</Badge>
{context.has_active_consents && (
  <Badge variant='light' color='green' size='sm'>
Active consents
  </Badge>
)}
  </Group>

  {context.description && (
<Text size='sm' c='gray.6' mb='xs'>
  {context.description}
</Text>
  )}

  <Group gap='xs'>
<Text size='xs' c='gray.5'>
  Created:{' '}
  {new Date(context.created_at).toLocaleDateString()}
</Text>
{context.updated_at && (
  <Text size='xs' c='gray.5'>
Updated:{' '}
{new Date(context.updated_at).toLocaleDateString()}
  </Text>
)}
  </Group>
</Box>

<Group gap='xs'>
  <ActionIcon
variant='light'
color='blue'
size='sm'
onClick={() => onEdit(context)}
data-testid='edit-context-button'
aria-label='Edit context'
  >
<IconEdit size={16} />
  </ActionIcon>
  <ActionIcon
variant='light'
color='red'
size='sm'
onClick={() => onDelete(context)}
data-testid='delete-context-button'
aria-label='Delete context'
  >
<IconTrash size={16} />
  </ActionIcon>
</Group>
  </Group>
</Card>
  ))}
</Stack>
  )}
</Paper>
  );
});

// Display name for React DevTools
ContextList.displayName = 'ContextList';
