'use client';

import { DeleteNameModal } from '@/components/modals/DeleteNameModal';
import { TabPanel } from '@/components/dashboard/TabPanel';
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
  Text,
  TextInput,
  Title,
  Loader,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconTrash,
  IconAlertTriangle,
  IconEdit,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
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

  // Edit functionality state
  const [editingName, setEditingName] = useState<Name | null>(null);
  const [editText, setEditText] = useState<string>('');

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

  // Update name mutation
  const { trigger: updateName, isMutating: isUpdating } = useSWRMutation(
'/api/names',
createMutationFetcher('PUT'),
{
  onSuccess: () => {
notifications.show({
  title: 'Name Updated',
  message: 'Name variant updated successfully',
  color: 'green',
  autoClose: 3000,
});
revalidateNames();
setEditingName(null);
setEditText('');
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

  // Edit handler functions
  const handleStartEdit = (name: Name) => {
setEditingName(name);
setEditText(name.name_text);
  };

  const handleSaveEdit = async () => {
if (!editingName || !editText.trim()) return;

await updateName({
  name_id: editingName.id,
  name_text: editText.trim(),
});
  };

  const handleCancelEdit = () => {
setEditingName(null);
setEditText('');
  };

  const names = (namesResponse as { names: Name[] } | undefined)?.names || [];
  const isLoading = !namesResponse && !namesError;

  return (
<TabPanel
  value='names'
  title='Name Variants'
  description='Manage your name variants and their usage across different contexts'
  actions={
<Button
  leftSection={<IconPlus />}
  onClick={() => setShowAddForm(!showAddForm)}
  variant={showAddForm ? 'light' : 'filled'}
  size='sm'
  data-testid='toggle-add-name-form'
>
  {showAddForm ? 'Cancel' : 'Add Name'}
</Button>
  }
>
  <Stack gap='lg'>
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
leftSection={<IconPlus />}
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
  leftSection={<IconPlus />}
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
  <Group grow>
{editingName?.id === name.id ? (
  // Edit mode
  <Group gap='xs' grow>
<TextInput
  value={editText}
  onChange={(e) => setEditText(e.target.value)}
  flex={1}
  data-testid='edit-name-input'
  onKeyDown={(e) => {
if (e.key === 'Enter') {
  handleSaveEdit();
} else if (e.key === 'Escape') {
  handleCancelEdit();
}
  }}
  autoFocus
/>
<ActionIcon
  color='green'
  variant='light'
  onClick={handleSaveEdit}
  loading={isUpdating}
  disabled={isUpdating || !editText.trim()}
  data-testid='save-edit-button'
>
  <IconCheck size={16} />
</ActionIcon>
<ActionIcon
  color='gray'
  variant='light'
  onClick={handleCancelEdit}
  disabled={isUpdating}
  data-testid='cancel-edit-button'
>
  <IconX size={16} />
</ActionIcon>
  </Group>
) : (
  // Display mode
  <div>
<Text fw={500} size='lg'>
  {name.name_text}
</Text>
  </div>
)}
  </Group>

  {editingName?.id !== name.id && (
<Group gap='xs'>
  <ActionIcon
color='blue'
variant='light'
onClick={() => handleStartEdit(name)}
disabled={!!editingName || isDeleting}
data-testid='edit-name-button'
  >
<IconEdit size={16} />
  </ActionIcon>
  <ActionIcon
color='red'
variant='light'
onClick={() => handleDelete(name)}
loading={isDeleting}
disabled={isDeleting || !!editingName}
data-testid='delete-name-button'
  >
<IconTrash size={16} />
  </ActionIcon>
</Group>
  )}
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
</TabPanel>
  );
}
