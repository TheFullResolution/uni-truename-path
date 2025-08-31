'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  Alert,
  Badge,
  Loader,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconTrash,
  IconShield,
  IconInfoCircle,
} from '@tabler/icons-react';

interface DeleteNameModalProps {
  opened: boolean;
  onClose: () => void;
  nameId: string;
  nameText: string;
  isDeleting: boolean;
  onConfirmDelete: (nameId: string) => Promise<void>;
  canDelete: boolean;
  deleteReason?: string;
  isDefaultContextName?: boolean;
}

export function DeleteNameModal({
  opened,
  onClose,
  nameId,
  nameText,
  isDeleting,
  onConfirmDelete,
  canDelete,
  deleteReason,
  isDefaultContextName = false,
}: DeleteNameModalProps) {
  const handleConfirm = async () => {
try {
  await onConfirmDelete(nameId);
  onClose();
} catch (error) {
  // Error handling is done in the parent component
  console.error('Delete failed:', error);
}
  };

  // If the name cannot be deleted, show protection modal
  if (!canDelete) {
return (
  <Modal
opened={opened}
onClose={onClose}
title='Cannot Delete Name'
centered
size='md'
  >
<Stack gap='md'>
  <Alert
icon={<IconShield size={16} />}
title='Name Protection'
color='orange'
  >
<Text size='sm' mb='xs'>
  The name <strong>&ldquo;{nameText}&rdquo;</strong> cannot be
  deleted.
</Text>
{deleteReason && (
  <Text size='sm' c='dimmed'>
{deleteReason}
  </Text>
)}
  </Alert>

  {isDefaultContextName && (
<Alert
  icon={<IconInfoCircle size={16} />}
  title='Default Context Assignment'
  color='blue'
  variant='light'
>
  <Text size='sm'>
This name is assigned to your default context and serves as your
fallback identity presentation. You must have at least one name
available for context-aware resolution to function properly.
  </Text>
</Alert>
  )}

  <Group justify='flex-end' mt='md'>
<Button onClick={onClose} variant='light' size='md'>
  Understood
</Button>
  </Group>
</Stack>
  </Modal>
);
  }

  return (
<Modal
  opened={opened}
  onClose={onClose}
  title='Delete Name Variant'
  centered
  size='md'
  closeOnClickOutside={!isDeleting}
  closeOnEscape={!isDeleting}
>
  <Stack gap='md'>
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='Permanent Action'
  color='red'
  variant='light'
>
  <Text size='sm'>
You are about to delete the name variant{' '}
<Text component='span' fw={600}>
  &ldquo;{nameText}&rdquo;
</Text>
. This action cannot be undone.
  </Text>
</Alert>

{/* Name details */}
<Stack gap='xs'>
  <Text size='sm' fw={500} c='dimmed'>
Name Details:
  </Text>
  <Group>
<Badge variant='light' color='blue'>
  {nameText}
</Badge>
  </Group>
</Stack>

{/* Impact information */}
<Alert
  icon={<IconInfoCircle size={16} />}
  title='What happens next?'
  color='blue'
  variant='light'
>
  <Text size='sm'>
• This name will be removed from all context assignments
  </Text>
  <Text size='sm'>
• Any consents using this name will remain active with other
available names
  </Text>
  <Text size='sm'>
• Context-aware name resolution will no longer return this variant
  </Text>
</Alert>

<Group justify='flex-end' mt='md'>
  <Button
onClick={onClose}
variant='light'
size='md'
disabled={isDeleting}
  >
Cancel
  </Button>
  <Button
onClick={handleConfirm}
variant='filled'
color='red'
size='md'
loading={isDeleting}
disabled={isDeleting}
leftSection={
  isDeleting ? <Loader size={16} /> : <IconTrash size={16} />
}
  >
{isDeleting ? 'Deleting...' : 'Delete Name'}
  </Button>
</Group>
  </Stack>
</Modal>
  );
}
