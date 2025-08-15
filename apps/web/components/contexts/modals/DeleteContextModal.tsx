'use client';

import React from 'react';
import { Modal, Stack, Text, Group, Button, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';
import {
  createMutationFetcher,
  formatSWRError,
} from '../../../lib/swr-fetcher';
import type {
  DeleteContextResponseData,
  ContextWithStats,
} from '../../../types/api-responses';
import { CACHE_KEYS } from '../../../lib/swr-keys';

interface DeleteContextModalProps {
  opened: boolean;
  onClose: () => void;
  context: ContextWithStats | null;
}

export default function DeleteContextModal({
  opened,
  onClose,
  context,
}: DeleteContextModalProps) {
  const { mutate } = useSWRConfig();

  // SWR mutation for deleting context with conditional key
  const { trigger, isMutating } = useSWRMutation(
context ? `/api/contexts/${context.id}?force=true` : null,
createMutationFetcher<DeleteContextResponseData, never>('DELETE'),
{
  onSuccess: () => {
// Revalidate contexts cache after deletion
mutate(CACHE_KEYS.CONTEXTS);
mutate(CACHE_KEYS.ASSIGNMENTS);

notifications.show({
  title: 'Context Deleted',
  message: `The context "${context?.context_name}" has been successfully deleted.`,
  color: 'green',
  autoClose: 5000,
});
onClose();
  },
  onError: (error) => {
const errorMessage = formatSWRError(error);
notifications.show({
  title: 'Error Deleting Context',
  message: errorMessage,
  color: 'red',
  autoClose: 5000,
});
  },
},
  );

  const handleDelete = () => {
trigger();
  };

  const hasAssignments = context && context.name_assignments_count > 0;
  const hasConsents = context && context.has_active_consents;

  return (
<Modal
  opened={opened}
  onClose={() => {
onClose();
  }}
  title={
<Group gap='sm'>
  <IconTrash size={20} color='#e74c3c' />
  <Text fw={600}>Delete Context</Text>
</Group>
  }
  size='lg'
>
  <Stack gap='md'>
<Text>
  Are you sure you want to delete the context{' '}
  <strong>&quot;{context?.context_name}&quot;</strong>?
</Text>

{(hasConsents || hasAssignments) && (
  <Alert
icon={<IconAlertTriangle size={16} />}
title='Warning: This action will affect existing data'
color='yellow'
  >
<Stack gap='xs'>
  {hasAssignments && (
<Text size='sm'>
  • {context.name_assignments_count} name assignment(s) will be
  removed
</Text>
  )}
  {hasConsents && (
<Text size='sm'>
  • Active consents for this context will be revoked
</Text>
  )}
</Stack>
  </Alert>
)}

{hasAssignments && (
  <Alert
icon={<IconAlertTriangle size={16} />}
title='Confirm Force Deletion'
color='red'
  >
<Text size='sm'>
  This context has dependencies. Proceeding will remove all
  associated data permanently.
</Text>
  </Alert>
)}

<Group justify='flex-end' gap='md'>
  <Button
variant='light'
color='gray'
onClick={() => {
  onClose();
}}
disabled={isMutating}
  >
Cancel
  </Button>
  <Button
color='red'
loading={isMutating}
disabled={isMutating}
leftSection={<IconTrash size={16} />}
onClick={handleDelete}
  >
{hasAssignments ? 'Force Delete' : 'Delete Context'}
  </Button>
</Group>
  </Stack>
</Modal>
  );
}
