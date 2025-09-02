'use client';

import type { ContextWithStats } from '@/app/api/contexts/types';
import { AssignmentModal } from '@/components/contexts/AssignmentModal';
import { DeleteContextModal } from '@/components/modals/DeleteContextModal';
import { TabPanel } from '@/components/dashboard/TabPanel';
import type { AuthenticatedUser } from '@/utils/context';
import {
  createMutationFetcher,
  formatSWRError,
  swrFetcher,
} from '@/utils/swr-fetcher';
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconEdit, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { z } from 'zod';
import { ContextCard } from '../contexts/ContextCard';

interface ContextsTabProps {
  user: AuthenticatedUser | null;
}

// Simplified context form schema - no visibility field needed
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
  const [editingContext, setEditingContext] = useState<ContextWithStats | null>(
null,
  );
  const [deletingContext, setDeletingContext] =
useState<ContextWithStats | null>(null);
  const [dependencyImpact, setDependencyImpact] = useState<{
name_assignments?: number;
active_consents?: number;
  } | null>(null);
  const [assignmentModalOpened, setAssignmentModalOpened] = useState(false);
  const [selectedContextForAssignments, setSelectedContextForAssignments] =
useState<ContextWithStats | null>(null);

  // Fetch contexts
  const {
data: contextsResponse,
error: contextsError,
mutate: revalidateContexts,
  } = useSWR(user?.id ? '/api/contexts' : null, swrFetcher);

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

  const { trigger: updateContext, isMutating: isUpdating } = useSWRMutation(
'/api/contexts/update',
async (url, { arg }: { arg: { context_id: string } & ContextFormData }) => {
  const updateUrl = `/api/contexts/${arg.context_id}`;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { context_id, ...body } = arg;

  const response = await fetch(updateUrl, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(body),
credentials: 'include',
  });

  if (!response.ok) {
const error = await response.json();
throw new Error(error.message || 'Update failed');
  }

  return response.json();
},
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
  await updateContext({
context_id: editingContext.id,
...values,
  });
} else {
  await createContext(values);
}
  };

  const handleEdit = (context: ContextWithStats) => {
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

  const handleDelete = async (context: ContextWithStats) => {
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

  const handleOpenAssignments = (context: ContextWithStats) => {
setSelectedContextForAssignments(context);
setAssignmentModalOpened(true);
  };

  const handleCloseAssignments = () => {
setAssignmentModalOpened(false);
setSelectedContextForAssignments(null);
  };

  const contexts = (contextsResponse as ContextWithStats[]) || [];
  const isLoading = !contextsResponse && !contextsError;

  return (
<TabPanel
  value='contexts'
  title='Contexts'
  description='Manage your identity contexts and name assignments'
  actions={
<Button
  leftSection={<IconPlus />}
  onClick={() => setShowAddForm(!showAddForm)}
  variant={showAddForm ? 'light' : 'filled'}
  size='sm'
>
  {showAddForm ? 'Cancel' : 'Add Context'}
</Button>
  }
>
  <Stack gap='lg'>
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
leftSection={editingContext ? <IconEdit /> : <IconPlus />}
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
  leftSection={<IconPlus />}
  mt='sm'
>
  Add Context
</Button>
  </Stack>
</Center>
  </Paper>
) : (
  <Stack gap='sm'>
{contexts.map((context: ContextWithStats) => (
  <ContextCard
key={context.id}
context={context}
onEdit={handleEdit}
onDelete={handleDelete}
onEditAssignments={handleOpenAssignments}
  />
))}
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

{/* Assignment Modal */}
<AssignmentModal
  opened={assignmentModalOpened}
  onClose={handleCloseAssignments}
  contextId={selectedContextForAssignments?.id || ''}
  contextName={selectedContextForAssignments?.context_name || ''}
  onSuccess={revalidateContexts}
/>
  </Stack>
</TabPanel>
  );
}
