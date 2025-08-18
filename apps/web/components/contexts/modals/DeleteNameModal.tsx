'use client';

import React from 'react';
import { Modal, Stack, Text, Group, Button, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import useSWRMutation from 'swr/mutation';
import type { Name } from '../../../types/database';
import {
  createMutationFetcher,
  formatSWRError,
} from '../../../utils/swr-fetcher';
import { CACHE_KEYS } from '../../../utils/swr-keys';
import type { DeleteNameResponseData } from '../../../app/api/names/types';

interface DeleteNameModalProps {
  opened: boolean;
  onClose: () => void;
  name: Name | null;
  totalNames: number;
}

export default function DeleteNameModal({
  opened,
  onClose,
  name,
  totalNames,
}: DeleteNameModalProps) {
  const { trigger, isMutating } = useSWRMutation(
CACHE_KEYS.NAMES,
createMutationFetcher<DeleteNameResponseData, { name_id: string }>(
  'DELETE',
),
  );

  const handleDelete = async () => {
if (!name) return;

try {
  await trigger({ name_id: name.id });

  notifications.show({
title: 'Name Deleted',
message: `Successfully deleted "${name.name_text}"`,
color: 'green',
autoClose: 4000,
  });

  onClose();
} catch (error) {
  console.error('Name deletion error:', error);
  notifications.show({
title: 'Error Deleting Name',
message: formatSWRError(error),
color: 'red',
autoClose: 5000,
  });
}
  };

  const canDelete = totalNames > 1;
  const isPreferred = name?.is_preferred;

  return (
<Modal
  opened={opened}
  onClose={onClose}
  title={
<Group gap='sm'>
  <IconTrash size={20} color='#e74c3c' />
  <Text fw={600}>Delete Name Variant</Text>
</Group>
  }
  size='lg'
>
  <Stack gap='md'>
<Text>
  Are you sure you want to delete the name{' '}
  <strong>&quot;{name?.name_text}&quot;</strong>?
</Text>

{!canDelete && (
  <Alert
icon={<IconAlertTriangle size={16} />}
title='Cannot Delete'
color='red'
  >
<Text size='sm'>
  You cannot delete your only name variant. Please create another
  name before deleting this one.
</Text>
  </Alert>
)}

{canDelete && isPreferred && (
  <Alert
icon={<IconAlertTriangle size={16} />}
title='Preferred Name Warning'
color='yellow'
  >
<Text size='sm'>
  This is your preferred name. After deletion, you will need to set
  another name as preferred.
</Text>
  </Alert>
)}

<Group justify='flex-end' gap='md'>
  <Button
variant='light'
color='gray'
onClick={onClose}
disabled={isMutating}
  >
Cancel
  </Button>
  <Button
color='red'
loading={isMutating}
disabled={isMutating || !canDelete}
leftSection={<IconTrash size={16} />}
onClick={handleDelete}
  >
Delete Name
  </Button>
</Group>
  </Stack>
</Modal>
  );
}
