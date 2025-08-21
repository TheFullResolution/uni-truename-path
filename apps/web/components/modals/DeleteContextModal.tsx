'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  Alert,
  Divider,
  Badge,
  Loader,
  Checkbox,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconTrash,
  IconInfoCircle,
  IconExclamationCircle,
} from '@tabler/icons-react';
import { useState } from 'react';

interface DependencyImpact {
  name_assignments?: number;
  active_consents?: number;
}

interface DeleteContextModalProps {
  opened: boolean;
  onClose: () => void;
  contextId: string;
  contextName: string;
  isDeleting: boolean;
  onConfirmDelete: (contextId: string, forceDelete: boolean) => Promise<void>;
  dependencyImpact?: DependencyImpact | null;
  isPermanent?: boolean;
}

export function DeleteContextModal({
  opened,
  onClose,
  contextId,
  contextName,
  isDeleting,
  onConfirmDelete,
  dependencyImpact,
  isPermanent = false,
}: DeleteContextModalProps) {
  const [forceDeleteConfirmed, setForceDeleteConfirmed] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState<
'initial' | 'confirm'
  >('initial');

  const hasDependencies =
dependencyImpact &&
((dependencyImpact.name_assignments || 0) > 0 ||
  (dependencyImpact.active_consents || 0) > 0);

  const handleInitialConfirm = () => {
if (hasDependencies) {
  setConfirmationStep('confirm');
} else {
  // No dependencies, proceed with simple deletion
  handleFinalConfirm(false);
}
  };

  const handleFinalConfirm = async (force: boolean = false) => {
try {
  await onConfirmDelete(contextId, force);
  handleClose();
} catch (error) {
  // Error handling is done in the parent component
  console.error('Delete failed:', error);
}
  };

  const handleClose = () => {
setForceDeleteConfirmed(false);
setConfirmationStep('initial');
onClose();
  };

  if (isPermanent) {
return (
  <Modal
opened={opened}
onClose={handleClose}
title='Cannot Delete Default Context'
centered
size='md'
  >
<Stack gap='md'>
  <Alert
icon={<IconInfoCircle size={16} />}
title='Default Context Protection'
color='blue'
  >
<Text size='sm'>
  The default context is permanent and cannot be deleted. This
  context serves as your fallback identity presentation and is
  required for the system to function properly.
</Text>
  </Alert>

  <Group justify='flex-end' mt='md'>
<Button onClick={handleClose} variant='light'>
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
  onClose={handleClose}
  title={
confirmationStep === 'initial' ? 'Delete Context' : 'Confirm Deletion'
  }
  centered
  size='md'
  closeOnClickOutside={!isDeleting}
  closeOnEscape={!isDeleting}
>
  <Stack gap='md'>
{confirmationStep === 'initial' ? (
  <>
{/* Initial confirmation screen */}
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='Permanent Action'
  color='red'
  variant='light'
>
  <Text size='sm'>
You are about to delete the context{' '}
<Text component='span' fw={600}>
  &ldquo;{contextName}&rdquo;
</Text>
. This action cannot be undone.
  </Text>
</Alert>

{/* Context details */}
<Stack gap='xs'>
  <Text size='sm' fw={500} c='dimmed'>
Context Details:
  </Text>
  <Group>
<Badge variant='light' color='blue'>
  {contextName}
</Badge>
  </Group>
</Stack>

{/* Dependency information if available */}
{hasDependencies && (
  <>
<Divider />
<Alert
  icon={<IconExclamationCircle size={16} />}
  title='Impact Analysis'
  color='orange'
  variant='light'
>
  <Text size='sm' mb='xs'>
This context has active dependencies that will be affected:
  </Text>
  <Stack gap='xs'>
{(dependencyImpact?.name_assignments || 0) > 0 && (
  <Text size='sm'>
• <strong>{dependencyImpact?.name_assignments}</strong>{' '}
name assignment(s) will be removed
  </Text>
)}
{(dependencyImpact?.active_consents || 0) > 0 && (
  <Text size='sm'>
• <strong>{dependencyImpact?.active_consents}</strong>{' '}
active consent(s) will be revoked
  </Text>
)}
  </Stack>
</Alert>
  </>
)}

<Group justify='flex-end' mt='md'>
  <Button
onClick={handleClose}
variant='light'
disabled={isDeleting}
  >
Cancel
  </Button>
  <Button
onClick={handleInitialConfirm}
color='red'
loading={isDeleting}
disabled={isDeleting}
leftSection={<IconTrash size={16} />}
  >
{hasDependencies ? 'Continue' : 'Delete Context'}
  </Button>
</Group>
  </>
) : (
  <>
{/* Second confirmation screen for contexts with dependencies */}
<Alert
  icon={<IconExclamationCircle size={16} />}
  title='Final Confirmation Required'
  color='red'
>
  <Text size='sm' mb='md'>
Deleting &ldquo;{contextName}&rdquo; will permanently remove:
  </Text>
  <Stack gap='xs'>
{(dependencyImpact?.name_assignments || 0) > 0 && (
  <Text size='sm'>
✗ {dependencyImpact?.name_assignments} name assignment(s)
  </Text>
)}
{(dependencyImpact?.active_consents || 0) > 0 && (
  <Text size='sm'>
✗ {dependencyImpact?.active_consents} active consent(s)
  </Text>
)}
  </Stack>
</Alert>

<Checkbox
  checked={forceDeleteConfirmed}
  onChange={(event) =>
setForceDeleteConfirmed(event.currentTarget.checked)
  }
  label={
<Text size='sm'>
  I understand that this action is permanent and will remove all
  associated data
</Text>
  }
  disabled={isDeleting}
/>

<Group justify='flex-end' mt='md'>
  <Button
onClick={() => setConfirmationStep('initial')}
variant='light'
disabled={isDeleting}
  >
Back
  </Button>
  <Button
onClick={() => handleFinalConfirm(true)}
color='red'
disabled={!forceDeleteConfirmed || isDeleting}
loading={isDeleting}
leftSection={
  isDeleting ? <Loader size={16} /> : <IconTrash size={16} />
}
  >
{isDeleting ? 'Deleting...' : 'Force Delete'}
  </Button>
</Group>
  </>
)}
  </Stack>
</Modal>
  );
}
