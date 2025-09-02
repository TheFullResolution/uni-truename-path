'use client';

import { TabPanel } from '@/components/dashboard/TabPanel';
import { NamesList } from '@/components/tabs/NamesList';
import type { AuthenticatedUser } from '@/utils/context';
import type { Tables } from '@/generated/database';
import type { CanDeleteNameResponse } from '@/types/database';
import type { NamesResponseData } from '@/app/api/names/types';

type Name = Tables<'names'>;
import {
  swrFetcher,
  createMutationFetcher,
  formatSWRError,
} from '@/utils/swr-fetcher';
import { Button, Stack, Paper, Title, TextInput, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

interface NamesTabProps {
  user: AuthenticatedUser | null;
}

export function NamesTab({ user }: NamesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingName, setDeletingName] = useState<Name | null>(null);
  const [canDeleteName, setCanDeleteName] = useState(true);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [protectionData, setProtectionData] =
useState<CanDeleteNameResponse | null>(null);

  // Edit functionality state
  const [editingName, setEditingName] = useState<Name | null>(null);
  const [editText, setEditText] = useState<string>('');

  // Form for adding names (following ContextsTab pattern)
  const form = useForm<{ name_text: string }>({
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

  // Fetch names with simplified structure
  const {
data: namesResponse,
error: namesError,
mutate: revalidateNames,
  } = useSWR(user?.id ? '/api/names' : null, swrFetcher);

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

  const handleAddNameSubmit = async (values: { name_text: string }) => {
await createName(values);
  };

  const handleCancel = () => {
setShowAddForm(false);
form.reset();
  };

  const handleDelete = async (name: Name) => {
try {
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

  const protectionInfo = canDeleteData.data;
  setCanDeleteName(protectionInfo?.can_delete || false);
  setDeleteReason(protectionInfo?.reason || '');
  setProtectionData(protectionInfo);

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

  const names = (namesResponse as NamesResponseData | undefined)?.names || [];
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
{/* Add Name Form - Following ContextsTab pattern for stability */}
{showAddForm && (
  <Paper p='md' withBorder>
<Title order={3} mb='md'>
  Add Name Variant
</Title>
<form onSubmit={form.onSubmit(handleAddNameSubmit)}>
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
onClick={handleCancel}
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

{/* Names List - Isolated component to prevent form re-renders */}
<NamesList
  names={names}
  isLoading={isLoading}
  error={namesError}
  editingName={editingName}
  editText={editText}
  isUpdating={isUpdating}
  isDeleting={isDeleting}
  onStartEdit={handleStartEdit}
  onSaveEdit={handleSaveEdit}
  onCancelEdit={handleCancelEdit}
  onSetEditText={setEditText}
  onDelete={handleDelete}
  onConfirmDelete={handleConfirmDelete}
  deletingName={deletingName}
  canDeleteName={canDeleteName}
  deleteReason={deleteReason}
  protectionData={protectionData}
  onCloseDeleteModal={() => {
setDeletingName(null);
setCanDeleteName(true);
setDeleteReason('');
setProtectionData(null);
  }}
/>
  </Stack>
</TabPanel>
  );
}
