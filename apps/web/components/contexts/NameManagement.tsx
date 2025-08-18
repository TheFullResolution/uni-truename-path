'use client';

import useSWR, { mutate } from 'swr';
import useSWRMutation from 'swr/mutation';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconReload,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import React, { useState } from 'react';
import {
  swrFetcher,
  createMutationFetcher,
  formatSWRError,
} from '../../utils/swr-fetcher';
import type { Name } from '../../types/database';
import type {
  NamesResponseData,
  UpdateNameRequest,
  UpdateNameResponseData,
} from '../../app/api/names/types';
import DeleteNameModal from './modals/DeleteNameModal';

interface NameManagementProps {
  userId: string;
  onRefresh?: () => void;
  refreshTrigger?: number; // Currently unused but part of component API
}

export function NameManagement({ userId }: NameManagementProps) {
  // Modal state for name deletion
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [nameToDelete, setNameToDelete] = useState<Name | null>(null);

  // SWR data fetching with explicit revalidation
  const {
data: namesData,
error: namesError,
mutate: revalidateNames,
isLoading: loading,
  } = useSWR<NamesResponseData>(userId ? `/api/names` : null, swrFetcher);

  // Extract names from API response
  const names = namesData?.names || [];

  // Update name mutation with explicit revalidation
  const { trigger: updateName, isMutating: isUpdating } = useSWRMutation(
'/api/names',
createMutationFetcher<UpdateNameResponseData, UpdateNameRequest>('PUT'),
{
  onSuccess: () => {
revalidateNames(); // EXPLICIT revalidation
mutate('/api/dashboard/stats'); // Update stats

notifications.show({
  title: 'Name Updated',
  message: 'Successfully updated name preferences',
  color: 'green',
  autoClose: 4000,
});
  },
  onError: (error) => {
notifications.show({
  title: 'Error',
  message: formatSWRError(error),
  color: 'red',
  autoClose: 5000,
});
  },
},
  );

  // Handle setting preferred name
  const handleSetPreferred = async (nameId: string) => {
try {
  await updateName({
name_id: nameId,
is_preferred: true,
  });
  // Success handling is done via onSuccess callback
} catch (error) {
  // Error handling is done via onError callback
  console.error('Error setting preferred name:', error);
}
  };

  // Handle opening delete modal
  const handleDeleteName = (name: Name) => {
setNameToDelete(name);
setDeleteModalOpened(true);
  };

  // Get name type display color
  const getNameTypeColor = (nameType: string): string => {
switch (nameType) {
  case 'LEGAL':
return 'red';
  case 'PREFERRED':
return 'green';
  case 'NICKNAME':
return 'blue';
  case 'ALIAS':
return 'purple';
  case 'PROFESSIONAL':
return 'orange';
  case 'CULTURAL':
return 'teal';
  default:
return 'gray';
}
  };

  // Error state
  if (namesError) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='lg'>
  <IconUser size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Your Name Variants
  </Title>
</Group>
<Alert
  icon={<IconAlertTriangle size={16} />}
  color='red'
  title='Error Loading Names'
>
  {formatSWRError(namesError)}
</Alert>
  </Paper>
);
  }

  if (loading) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='lg'>
  <IconUser size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Your Name Variants
  </Title>
</Group>
<Stack gap='md'>
  <Skeleton height={60} />
  <Skeleton height={60} />
  <Skeleton height={60} />
</Stack>
  </Paper>
);
  }

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group justify='space-between' mb='lg'>
<Group gap='sm'>
  <IconUser size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Your Name Variants
  </Title>
  <Badge variant='light' color='blue' size='sm'>
{names.length} total
  </Badge>
</Group>
<Button
  variant='light'
  color='brand'
  size='sm'
  onClick={() => revalidateNames()}
  leftSection={<IconReload size={16} />}
  disabled={loading}
>
  Refresh
</Button>
  </Group>

  <Text size='sm' c='gray.6' mb='xl'>
Manage your name variants and set preferences
  </Text>

  {names.length === 0 ? (
<Center py='xl'>
  <Stack align='center' gap='md'>
<IconUser size={48} color='#ced4da' />
<Text size='lg' c='gray.6'>
  No name variants created yet
</Text>
<Text size='sm' c='gray.5' ta='center'>
  Create your first name variant above to start assigning names to
  contexts
</Text>
  </Stack>
</Center>
  ) : (
<Grid>
  {names.map((name: Name) => (
<Grid.Col key={name.id} span={{ base: 12, md: 6, lg: 4 }}>
  <Card
p='md'
withBorder
radius='md'
bg='gray.0'
data-testid='name-variant-card'
  >
<Stack gap='sm'>
  <Group justify='space-between' align='flex-start'>
<Stack gap='xs' flex={1}>
  <Group gap='xs'>
<Text fw={600} size='lg' c='gray.8'>
  {name.name_text}
</Text>
{name.is_preferred && (
  <IconStarFilled size={16} color='#FFD43B' />
)}
  </Group>

  <Badge
variant='light'
color={getNameTypeColor(name.name_type)}
size='sm'
  >
{name.name_type}
  </Badge>

  <Text size='xs' c='gray.5'>
Created:{' '}
{new Date(name.created_at).toLocaleDateString()}
  </Text>
</Stack>

<Group gap='xs'>
  <ActionIcon
variant='light'
color='yellow'
size='sm'
onClick={() => handleSetPreferred(name.id)}
disabled={isUpdating}
loading={isUpdating}
title={
  name.is_preferred
? 'Current preferred'
: 'Set as preferred'
}
data-testid='set-preferred-button'
  >
{name.is_preferred ? (
  <IconStarFilled size={16} />
) : (
  <IconStar size={16} />
)}
  </ActionIcon>

  <ActionIcon
variant='light'
color='red'
size='sm'
onClick={() => handleDeleteName(name)}
disabled={isUpdating}
title='Delete name'
data-testid='delete-name-button'
  >
<IconTrash size={16} />
  </ActionIcon>
</Group>
  </Group>

  {name.is_preferred && (
<Alert
  icon={<IconStarFilled size={14} />}
  color='yellow'
  variant='light'
  py='xs'
>
  <Text size='xs'>
This is your preferred name - used when no specific
assignment exists
  </Text>
</Alert>
  )}
</Stack>
  </Card>
</Grid.Col>
  ))}
</Grid>
  )}

  {names.length > 0 && (
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='Name Management'
  color='blue'
  mt='lg'
>
  <Text size='sm'>
Your preferred name (marked with ⭐) is used when no specific
assignment exists for a context. You can create multiple variants
and assign different ones to different contexts.
  </Text>
</Alert>
  )}

  {/* Delete Name Modal */}
  <DeleteNameModal
opened={deleteModalOpened}
onClose={() => {
  setDeleteModalOpened(false);
  setNameToDelete(null);
}}
name={nameToDelete}
totalNames={names.length}
  />
</Paper>
  );
}
