'use client';

import { DeleteNameModal } from '@/components/modals/DeleteNameModal';
import type { AuthenticatedUser } from '@/utils/context';
import type { Tables } from '@/generated/database';

type Name = Tables<'names'>;
import {
  swrFetcher,
  createMutationFetcher,
  formatSWRError,
} from '@/utils/swr-fetcher';
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { z } from 'zod';

interface NamesTabProps {
  user: AuthenticatedUser | null;
}

// Step 15.4 Simplified form data type - only name_text required
type CreateNameFormData = {
  name_text: string;
};

export function NamesTab({ user }: NamesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingName, setDeletingName] = useState<Name | null>(null);
  const [canDeleteName, setCanDeleteName] = useState(true);
  const [deleteReason, setDeleteReason] = useState<string>('');

  // Fetch names with simplified structure
  const {
data: namesResponse,
error: namesError,
mutate: revalidateNames,
  } = useSWR(user?.id ? '/api/names' : null, swrFetcher);

  // Create name mutation
  const { trigger: createName, isMutating: isCreating } = useSWRMutation(
'/api/names',
createMutationFetcher('POST'),
{
  onSuccess: () => {
notifications.show({
  title: 'Name Added',
  message: 'Name variant created successfully',
  color: 'green',
  autoClose: 3000,
});
revalidateNames();
setShowAddForm(false);
form.reset();
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

  // Delete name mutation
  const { trigger: deleteName, isMutating: isDeleting } = useSWRMutation(
'/api/names',
createMutationFetcher('DELETE'),
{
  onSuccess: () => {
notifications.show({
  title: 'Name Deleted',
  message: 'Name variant deleted successfully',
  color: 'blue',
  autoClose: 3000,
});
revalidateNames();
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

  // Form for adding names
  const form = useForm<CreateNameFormData>({
initialValues: {
  name_text: '',
},
validate: {
  name_text: (value) => {
const result = z.string().trim().min(1).max(100).safeParse(value);
return result.success ? null : 'Name text is required';
  },
},
  });

  const handleSubmit = async (values: CreateNameFormData) => {
await createName(values);
  };

  const handleDelete = async (name: Name) => {
try {
  // Check if name can be deleted first
  const canDeleteResponse = await fetch(
`/api/names/${name.id}/can-delete`,
{
  method: 'GET',
  credentials: 'include',
},
  );

  if (!canDeleteResponse.ok) {
notifications.show({
  title: 'Error',
  message: 'Failed to check deletion permissions',
  color: 'red',
});
return;
  }

  const canDeleteData = await canDeleteResponse.json();

  // Set the deletion state and reason
  setCanDeleteName(canDeleteData.data?.can_delete || false);
  setDeleteReason(canDeleteData.data?.reason || '');
  setDeletingName(name);
} catch {
  notifications.show({
title: 'Error',
message: 'Failed to validate deletion',
color: 'red',
  });
}
  };

  const handleConfirmDelete = async (nameId: string) => {
await deleteName({ name_id: nameId });
  };

  const names = (namesResponse as { names: Name[] } | undefined)?.names || [];
  const isLoading = !namesResponse && !namesError;

  return (
<Tabs.Panel value='names'>
  <Stack gap='lg'>
<div>
  <Group justify='space-between' mb='md'>
<Title order={2}>Name Variants</Title>
<Button
  leftSection={<IconPlus size={16} />}
  onClick={() => setShowAddForm(!showAddForm)}
  variant={showAddForm ? 'light' : 'filled'}
  size='sm'
  data-testid='toggle-add-name-form'
>
  {showAddForm ? 'Cancel' : 'Add Name'}
</Button>
  </Group>

  <Text size='sm' c='dimmed' mb='lg'>
Manage your name variants. OIDC properties are now assigned at the
context level for OAuth compatibility.
  </Text>
</div>

{/* Add Name Form */}
{showAddForm && (
  <Paper p='md' withBorder>
<Title order={3} mb='md'>
  Add Name Variant
</Title>
<form onSubmit={form.onSubmit(handleSubmit)}>
  <Stack gap='md'>
<TextInput
  label='Name Text'
  placeholder='Enter the name'
  required
  data-testid='name-text-input'
  {...form.getInputProps('name_text')}
/>

<Group justify='flex-end'>
  <Button
type='button'
variant='light'
onClick={() => setShowAddForm(false)}
disabled={isCreating}
  >
Cancel
  </Button>
  <Button
type='submit'
loading={isCreating}
leftSection={<IconPlus size={16} />}
data-testid='add-name-button'
  >
Add Name
  </Button>
</Group>
  </Stack>
</form>
  </Paper>
)}

{/* Names List */}
{isLoading ? (
  <Center p='xl'>
<Stack align='center'>
  <Loader size='md' />
  <Text size='sm' c='dimmed'>
Loading names...
  </Text>
</Stack>
  </Center>
) : namesError ? (
  <Alert
color='red'
title='Error Loading Names'
icon={<IconAlertTriangle size={16} />}
  >
<Text size='sm'>{formatSWRError(namesError)}</Text>
  </Alert>
) : names.length === 0 ? (
  <Paper p='xl' withBorder>
<Center>
  <Stack align='center'>
<Text size='lg' fw={500} c='dimmed'>
  No name variants yet
</Text>
<Text size='sm' c='dimmed'>
  Add your first name variant to get started
</Text>
<Button
  onClick={() => setShowAddForm(true)}
  leftSection={<IconPlus size={16} />}
  mt='sm'
>
  Add Name
</Button>
  </Stack>
</Center>
  </Paper>
) : (
  <Stack gap='sm'>
{names.map((name: Tables<'names'>) => (
  <Card key={name.id} p='md' withBorder>
<Group justify='space-between'>
  <Group>
<div>
  <Text fw={500} size='lg'>
{name.name_text}
  </Text>
</div>
  </Group>

  <ActionIcon
color='red'
variant='light'
onClick={() => handleDelete(name)}
loading={isDeleting}
disabled={isDeleting}
data-testid='delete-name-button'
  >
<IconTrash size={16} />
  </ActionIcon>
</Group>
  </Card>
))}
  </Stack>
)}

{/* Delete Name Modal */}
<DeleteNameModal
  opened={!!deletingName}
  onClose={() => {
setDeletingName(null);
setCanDeleteName(true);
setDeleteReason('');
  }}
  nameId={deletingName?.id || ''}
  nameText={deletingName?.name_text || ''}
  isDeleting={isDeleting}
  onConfirmDelete={handleConfirmDelete}
  canDelete={canDeleteName}
  deleteReason={deleteReason}
  isDefaultContextName={deleteReason.toLowerCase().includes('default')}
/>
  </Stack>
</Tabs.Panel>
  );
}
