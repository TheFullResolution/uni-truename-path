'use client';

import type { AuthenticatedUser } from '@/utils/context';
import type { Tables } from '@/generated/database';

type UserContext = Tables<'user_contexts'>;
import {
  swrFetcher,
  createMutationFetcher,
  formatSWRError,
} from '@/utils/swr-fetcher';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  Loader,
  Center,
  Divider,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconAlertTriangle,
  IconLock,
} from '@tabler/icons-react';
import { useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { z } from 'zod';
import { DeleteContextModal } from '../modals';

interface ContextsTabProps {
  user: AuthenticatedUser | null;
}

// Simplified context form schema after Step 15.4 migration
const contextSchema = z.object({
  context_name: z
.string()
.trim()
.min(1, 'Context name is required')
.max(100, 'Context name cannot exceed 100 characters')
.regex(/^[a-zA-Z0-9\s\-_]+$/, 'Context name contains invalid characters'),
  description: z
.string()
.max(500, 'Description cannot exceed 500 characters')
.optional(),
});

type ContextFormData = z.infer<typeof contextSchema>;

export function ContextsTab({ user }: ContextsTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContext, setEditingContext] =
useState<Tables<'user_contexts'> | null>(null);
  const [deletingContext, setDeletingContext] =
useState<Tables<'user_contexts'> | null>(null);
  const [dependencyImpact, setDependencyImpact] = useState<{
name_assignments?: number;
active_consents?: number;
  } | null>(null);

  // Fetch contexts
  const {
data: contextsResponse,
error: contextsError,
mutate: revalidateContexts,
  } = useSWR(user?.id ? '/api/contexts' : null, swrFetcher);

  // Create context mutation
  const { trigger: createContext, isMutating: isCreating } = useSWRMutation(
'/api/contexts',
createMutationFetcher('POST'),
{
  onSuccess: () => {
notifications.show({
  title: 'Context Created',
  message: 'Context created successfully',
  color: 'green',
  autoClose: 3000,
});
revalidateContexts();
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

  // Update context mutation
  const { trigger: updateContext, isMutating: isUpdating } = useSWRMutation(
'/api/contexts',
createMutationFetcher('PUT'),
{
  onSuccess: () => {
notifications.show({
  title: 'Context Updated',
  message: 'Context updated successfully',
  color: 'green',
  autoClose: 3000,
});
revalidateContexts();
setEditingContext(null);
setShowAddForm(false);
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

  // Delete context mutation
  const { trigger: deleteContext, isMutating: isDeleting } = useSWRMutation(
'/api/contexts/delete',
async (url, { arg }: { arg: { context_id: string; force: boolean } }) => {
  const deleteUrl = `/api/contexts/${arg.context_id}${arg.force ? '?force=true' : ''}`;
  const response = await fetch(deleteUrl, {
method: 'DELETE',
credentials: 'include',
  });

  if (!response.ok) {
const error = await response.json();
throw new Error(error.message || 'Delete failed');
  }

  return response.json();
},
{
  onSuccess: () => {
notifications.show({
  title: 'Context Deleted',
  message: 'Context deleted successfully',
  color: 'blue',
  autoClose: 3000,
});
revalidateContexts();
setDeletingContext(null);
setDependencyImpact(null);
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

  // Form for adding/editing contexts
  const form = useForm<ContextFormData>({
initialValues: {
  context_name: '',
  description: '',
},
validate: {
  context_name: (value) => {
const result = contextSchema.shape.context_name.safeParse(value);
return result.success
  ? null
  : result.error.issues[0]?.message || 'Invalid context name';
  },
},
  });

  const handleSubmit = async (values: ContextFormData) => {
if (editingContext) {
  // Update existing context
  await updateContext({
context_id: editingContext.id,
...values,
  });
} else {
  // Create new context
  await createContext(values);
}
  };

  const handleEdit = (context: Tables<'user_contexts'>) => {
// Prevent editing permanent contexts
if (context.is_permanent) {
  notifications.show({
title: 'Cannot Edit Default Context',
message: 'The default context cannot be edited or renamed.',
color: 'orange',
autoClose: 4000,
  });
  return;
}

setEditingContext(context);
form.setValues({
  context_name: context.context_name,
  description: context.description || '',
});
setShowAddForm(true);
  };

  const handleDelete = async (context: Tables<'user_contexts'>) => {
try {
  // Check for dependencies using the safe can-delete endpoint
  const response = await fetch(`/api/contexts/${context.id}/can-delete`, {
method: 'GET',
credentials: 'include',
  });

  if (!response.ok) {
if (response.status === 404) {
  notifications.show({
title: 'Error',
message:
  'Context not found or you do not have permission to delete it',
color: 'red',
autoClose: 5000,
  });
  return;
}
throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();

  if (result.success) {
// Check if context can be deleted at all
if (!result.data.can_delete) {
  notifications.show({
title: 'Cannot Delete Context',
message:
  result.data.impact?.details?.[0] ||
  'This context cannot be deleted',
color: 'red',
autoClose: 5000,
  });
  return;
}

// Set dependency impact data based on can-delete response
if (result.data.requires_force && result.data.impact) {
  setDependencyImpact({
name_assignments: result.data.impact.name_assignments,
active_consents: result.data.impact.active_consents,
  });
} else {
  // No dependencies - safe to delete
  setDependencyImpact(null);
}

// Show the delete modal
setDeletingContext(context);
  } else {
throw new Error(result.message || 'Failed to check dependencies');
  }
} catch (error) {
  console.error('Error checking context dependencies:', error);
  notifications.show({
title: 'Error',
message: 'Failed to check context dependencies',
color: 'red',
autoClose: 5000,
  });
}
  };

  const handleConfirmDelete = async (
contextId: string,
forceDelete: boolean,
  ) => {
await deleteContext({ context_id: contextId, force: forceDelete });
  };

  const handleCancel = () => {
setShowAddForm(false);
setEditingContext(null);
form.reset();
  };

  const contexts = (contextsResponse as UserContext[]) || [];
  const isLoading = !contextsResponse && !contextsError;

  return (
<Tabs.Panel value='contexts'>
  <Stack gap='lg'>
<div>
  <Group justify='space-between' mb='md'>
<Title order={2}>Context Management</Title>
<Button
  leftSection={<IconPlus size={16} />}
  onClick={() => setShowAddForm(!showAddForm)}
  variant={showAddForm ? 'light' : 'filled'}
  size='sm'
>
  {showAddForm ? 'Cancel' : 'Add Context'}
</Button>
  </Group>

  <Text size='sm' c='dimmed' mb='lg'>
Create and manage your custom contexts for different situations.
Your default context is permanent and cannot be deleted.
  </Text>
</div>

{/* Add/Edit Context Form */}
{showAddForm && (
  <Paper p='md' withBorder>
<Title order={3} mb='md'>
  {editingContext ? 'Edit Context' : 'Add Context'}
</Title>
<form onSubmit={form.onSubmit(handleSubmit)}>
  <Stack gap='md'>
<TextInput
  label='Context Name'
  placeholder='e.g., Professional Network'
  required
  data-testid='context-name-input'
  {...form.getInputProps('context_name')}
/>

<Textarea
  label='Description'
  placeholder='Describe when this context is used'
  rows={3}
  data-testid='context-description-input'
  {...form.getInputProps('description')}
/>

<Group justify='flex-end'>
  <Button
type='button'
variant='light'
onClick={handleCancel}
disabled={isCreating || isUpdating}
  >
Cancel
  </Button>
  <Button
type='submit'
loading={isCreating || isUpdating}
leftSection={
  editingContext ? (
<IconEdit size={16} />
  ) : (
<IconPlus size={16} />
  )
}
data-testid='context-submit-button'
  >
{editingContext ? 'Update Context' : 'Create Context'}
  </Button>
</Group>
  </Stack>
</form>
  </Paper>
)}

{/* Contexts List */}
{isLoading ? (
  <Center p='xl'>
<Stack align='center'>
  <Loader size='md' />
  <Text size='sm' c='dimmed'>
Loading contexts...
  </Text>
</Stack>
  </Center>
) : contextsError ? (
  <Alert
color='red'
title='Error Loading Contexts'
icon={<IconAlertTriangle size={16} />}
  >
<Text size='sm'>{formatSWRError(contextsError)}</Text>
  </Alert>
) : contexts.length === 0 ? (
  <Paper p='xl' withBorder>
<Center>
  <Stack align='center'>
<Text size='lg' fw={500} c='dimmed'>
  No contexts yet
</Text>
<Text size='sm' c='dimmed'>
  Create your first context to get started
</Text>
<Button
  onClick={() => setShowAddForm(true)}
  leftSection={<IconPlus size={16} />}
  mt='sm'
>
  Add Context
</Button>
  </Stack>
</Center>
  </Paper>
) : (
  <Stack gap='sm'>
{contexts.map((context: Tables<'user_contexts'>) => {
  const isPermanent = context.is_permanent === true;

  return (
<Card key={context.id} p='md' withBorder>
  <Stack gap='sm'>
<Group justify='space-between'>
  <Group>
<div>
  <Group gap='xs' align='center'>
<Text fw={600} size='lg'>
  {context.context_name}
</Text>
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
  </Group>
  {context.description && (
<Text size='sm' c='dimmed' mt={4}>
  {context.description}
</Text>
  )}
</div>
  </Group>

  <Group>
{/* Only show edit button for non-permanent contexts */}
{!isPermanent && (
  <ActionIcon
variant='light'
color='blue'
onClick={() => handleEdit(context)}
data-testid='edit-context-button'
  >
<IconEdit size={16} />
  </ActionIcon>
)}

{/* Only show delete button for non-permanent contexts */}
{!isPermanent && (
  <ActionIcon
color='red'
variant='light'
onClick={() => handleDelete(context)}
data-testid='delete-context-button'
  >
<IconTrash size={16} />
  </ActionIcon>
)}

{/* Show lock icon for permanent contexts instead of action buttons */}
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

<Divider />

<Group>
  <Text size='sm' c='dimmed'>
Created:{' '}
{new Date(context.created_at).toLocaleDateString()}
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
})}
  </Stack>
)}

{/* Delete Context Modal */}
<DeleteContextModal
  opened={!!deletingContext}
  onClose={() => {
setDeletingContext(null);
setDependencyImpact(null);
  }}
  contextId={deletingContext?.id || ''}
  contextName={deletingContext?.context_name || ''}
  isDeleting={isDeleting}
  onConfirmDelete={handleConfirmDelete}
  dependencyImpact={dependencyImpact}
  isPermanent={deletingContext?.is_permanent || false}
/>
  </Stack>
</Tabs.Panel>
  );
}
