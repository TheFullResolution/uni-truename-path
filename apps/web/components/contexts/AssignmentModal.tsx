'use client';

import { Modal } from '@mantine/core';
import { AssignmentDialog } from './AssignmentDialog';

interface AssignmentModalProps {
  opened: boolean;
  onClose: () => void;
  contextId: string;
  contextName: string;
  onSuccess?: () => void;
}

export function AssignmentModal({
  opened,
  onClose,
  contextId,
  contextName,
  onSuccess,
}: AssignmentModalProps) {
  return (
<Modal
  opened={opened}
  onClose={onClose}
  title={`Edit Assignments - ${contextName}`}
  size='lg'
  centered
  closeOnClickOutside={false}
  closeOnEscape={true}
>
  <AssignmentDialog
contextId={contextId}
contextName={contextName}
onClose={onClose}
onSuccess={onSuccess}
  />
</Modal>
  );
}
