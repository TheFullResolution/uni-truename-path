'use client';

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Paper,
  Select,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconCheck,
  IconDeviceFloppy,
  IconReload,
  IconUser,
  IconUserCheck,
} from '@tabler/icons-react';
import React, { useState } from 'react';
import {
  swrFetcher,
  createMutationFetcher,
  formatSWRError,
} from '../../../lib/swr-fetcher';
import { CACHE_KEYS } from '../../../lib/swr-keys';
// Import centralized types
import type {
  AssignmentsResponseData,
  BulkAssignmentResponseData,
  NamesResponseData,
  BulkAssignmentRequest,
  AssignmentWithDetails,
} from '../../../types/api-responses';
import type { Name } from '../../../types/database';

interface ContextAssignmentPanelProps {
  onRefresh?: () => void;
  refreshTrigger?: number; // Currently unused but part of component API
}

export function ContextAssignmentPanel({
  onRefresh,
}: ContextAssignmentPanelProps) {
  // SWR data fetching with explicit revalidation patterns
  const {
data: namesData,
error: namesError,
mutate: revalidateNames,
isLoading: namesLoading,
  } = useSWR<NamesResponseData>(
CACHE_KEYS.NAMES,
swrFetcher<NamesResponseData>,
  );

  const {
data: assignmentData,
error: assignmentsError,
mutate: revalidateAssignments,
isLoading: assignmentsLoading,
  } = useSWR<AssignmentsResponseData>(
CACHE_KEYS.ASSIGNMENTS,
swrFetcher<AssignmentsResponseData>,
{
  revalidateOnMount: true,
},
  );

  // Extract data from SWR responses
  const names = namesData?.names || [];
  const loading = namesLoading || assignmentsLoading;

  // Local state for pending changes
  const [pendingChanges, setPendingChanges] = useState<
Record<string, string | null>
  >({});
  const [hasChanges, setHasChanges] = useState(false);

  // Bulk operations with explicit revalidation
  const { trigger: bulkUpdate, isMutating: isSaving } = useSWRMutation(
'/api/assignments/bulk',
createMutationFetcher<BulkAssignmentResponseData, BulkAssignmentRequest>(
  'POST',
),
{
  onSuccess: (result) => {
// EXPLICIT revalidation
revalidateAssignments();

notifications.show({
  title: 'Assignments Saved',
  message: `Successfully updated ${result.created + result.updated + result.deleted} assignments`,
  color: 'green',
  autoClose: 4000,
});

// Reset local state
setPendingChanges({});
setHasChanges(false);

onRefresh?.();
  },
  onError: (error) => {
notifications.show({
  title: 'Error Saving Assignments',
  message: formatSWRError(error),
  color: 'red',
  autoClose: 5000,
});
  },
},
  );

  // Get the original assignment for a context (without pending changes)
  const getOriginalAssignment = (contextId: string): string | null => {
const existing = assignmentData?.assignments.find(
  (a: AssignmentWithDetails) => a.context_id === contextId,
);
return existing?.name_id || null;
  };

  // Check if a selection represents a real change
  const isRealChange = (contextId: string, nameId: string | null): boolean => {
const originalValue = getOriginalAssignment(contextId);
return originalValue !== nameId;
  };

  // Handle assignment change
  const handleAssignmentChange = (contextId: string, nameId: string | null) => {
setPendingChanges((prev) => {
  const newChanges = { ...prev };

  if (isRealChange(contextId, nameId)) {
// This is a real change from the original value
newChanges[contextId] = nameId;
  } else {
// This matches the original value, so remove it from pending changes
delete newChanges[contextId];
  }

  // Update hasChanges based on whether there are any real changes remaining
  const hasRealChanges = Object.keys(newChanges).length > 0;
  setHasChanges(hasRealChanges);

  return newChanges;
});
  };

  // Get current assignment for a context (including pending changes)
  const getCurrentAssignment = (contextId: string): string | null => {
if (contextId in pendingChanges) {
  return pendingChanges[contextId];
}

const existing = assignmentData?.assignments.find(
  (a: AssignmentWithDetails) => a.context_id === contextId,
);
return existing?.name_id || null;
  };

  // Save all pending changes using SWR mutation
  const handleSaveChanges = async () => {
if (!hasChanges || Object.keys(pendingChanges).length === 0) return;

const assignments = Object.entries(pendingChanges).map(
  ([context_id, name_id]) => ({
context_id,
name_id,
  }),
);

try {
  await bulkUpdate({ assignments });
  // Success handling is done via onSuccess callback
} catch (error) {
  // Error handling is done via onError callback
  console.error('Error saving assignments:', error);
}
  };

  // Reset pending changes
  const handleResetChanges = () => {
setPendingChanges({});
setHasChanges(false);
  };

  // Error states
  if (namesError || assignmentsError) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='lg'>
  <IconUserCheck size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Context Assignments
  </Title>
</Group>
<Alert
  icon={<IconAlertTriangle size={16} />}
  color='red'
  title='Error Loading Data'
>
  {formatSWRError(namesError || assignmentsError)}
</Alert>
  </Paper>
);
  }

  if (loading) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='lg'>
  <IconUserCheck size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Name Assignments
  </Title>
</Group>
<Stack gap='md' data-testid='assignments-loading'>
  <Skeleton height={60} />
  <Skeleton height={60} />
  <Skeleton height={60} />
</Stack>
  </Paper>
);
  }

  if (!assignmentData) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='No Data Available'
  color='orange'
>
  <Text size='sm'>
Unable to load assignment data. Please try refreshing the page.
  </Text>
</Alert>
  </Paper>
);
  }

  const allContexts = [
...assignmentData.assignments.map((a: AssignmentWithDetails) => ({
  id: a.context_id,
  context_name: a.context_name,
  description: a.context_description,
})),
...assignmentData.unassigned_contexts,
  ];

  const nameSelectData = names.map((name: Name) => ({
value: name.id,
label: `${name.name_text} (${name.name_type})`,
  }));

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group justify='space-between' mb='lg'>
<Group gap='sm'>
  <IconUserCheck size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Name Assignments
  </Title>
  <Badge variant='light' color='blue' size='sm'>
{assignmentData.total_contexts} contexts
  </Badge>
</Group>

<Group gap='xs'>
  <Button
variant='light'
color='brand'
size='sm'
onClick={() => {
  revalidateNames();
  revalidateAssignments();
}}
leftSection={<IconReload size={16} />}
disabled={loading || isSaving}
  >
Refresh
  </Button>

  {hasChanges && (
<>
  <Button
variant='light'
color='gray'
size='sm'
onClick={handleResetChanges}
disabled={isSaving}
  >
Reset
  </Button>
  <Button
color='green'
size='sm'
onClick={handleSaveChanges}
loading={isSaving}
disabled={!hasChanges}
leftSection={<IconDeviceFloppy size={16} />}
  >
Save Changes
  </Button>
</>
  )}
</Group>
  </Group>

  <Text size='sm' c='gray.6' mb='xl'>
Assign specific name variants to your contexts. Changes are saved when
you click &quot;Save Changes&quot;.
  </Text>

  {names.length === 0 ? (
<Center py='xl'>
  <Stack align='center' gap='md'>
<IconUser size={48} color='#ced4da' />
<Text size='lg' c='gray.6'>
  No name variants available
</Text>
<Text size='sm' c='gray.5' ta='center'>
  You need to create name variants before you can assign them to
  contexts.
  <br />
  Go to the &quot;Manage Names&quot; tab to add your first name
  variant.
</Text>
  </Stack>
</Center>
  ) : allContexts.length === 0 ? (
<Center py='xl'>
  <Stack align='center' gap='md'>
<IconUserCheck size={48} color='#ced4da' />
<Text size='lg' c='gray.6'>
  No contexts available
</Text>
<Text size='sm' c='gray.5' ta='center'>
  Create contexts first to assign names to them
</Text>
  </Stack>
</Center>
  ) : (
<Grid>
  {allContexts.map((context) => {
const currentAssignment = getCurrentAssignment(context.id);
const isChanged = context.id in pendingChanges;

return (
  <Grid.Col key={context.id} span={{ base: 12, md: 6 }}>
<Card
  p='md'
  withBorder
  radius='md'
  bg={isChanged ? 'blue.0' : 'gray.0'}
  data-testid='assignment-row'
>
  <Stack gap='sm'>
<Group justify='space-between'>
  <Text fw={600} size='md' c='gray.8'>
{context.context_name}
  </Text>
  {isChanged && (
<Badge size='xs' color='blue' variant='filled'>
  Modified
</Badge>
  )}
</Group>

{context.description && (
  <Text size='xs' c='gray.6'>
{context.description}
  </Text>
)}

<Select
  placeholder='Select a name variant'
  data={nameSelectData}
  value={currentAssignment}
  onChange={(value) =>
handleAssignmentChange(context.id, value)
  }
  clearable
  searchable
  size='sm'
  leftSection={<IconUser size={16} />}
  data-testid='assignment-select'
  styles={{
input: {
  borderColor: isChanged ? '#4A7FE7' : undefined,
},
  }}
/>

{currentAssignment && (
  <Group gap='xs' mt='xs'>
<IconCheck size={14} color='green' />
<Text size='xs' c='green.7'>
  {names.find((n: Name) => n.id === currentAssignment)
?.name_text || 'Unknown name'}
</Text>
  </Group>
)}
  </Stack>
</Card>
  </Grid.Col>
);
  })}
</Grid>
  )}

  {hasChanges && (
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='Unsaved Changes'
  color='yellow'
  mt='xl'
>
  <Text size='sm'>
You have unsaved assignment changes. Click &quot;Save Changes&quot;
to apply them or &quot;Reset&quot; to discard.
  </Text>
</Alert>
  )}
</Paper>
  );
}
