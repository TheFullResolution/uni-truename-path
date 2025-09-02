'use client';

import { ProtectedNameWarning } from '@/components/modals/ProtectedNameWarning';
import { NameReplacementGuideModal } from '@/components/modals/NameReplacementGuideModal';
import { DeleteNameModal } from '@/components/modals/DeleteNameModal';
import { isNameProtected, getAssignmentCount } from '@/utils/utils/names';
import type { Tables } from '@/generated/database';
import type { CanDeleteNameResponse } from '@/types/database';
import type { NameAssignment } from '@/app/api/names/types';

import {
  ActionIcon,
  Alert,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Loader,
  Center,
  Tooltip,
} from '@mantine/core';
import { formatSWRError } from '@/utils/swr-fetcher';
import {
  IconTrash,
  IconAlertTriangle,
  IconEdit,
  IconCheck,
  IconX,
  IconShield,
  IconEye,
} from '@tabler/icons-react';
import { useState } from 'react';

type Name = Tables<'names'>;
type NameWithAssignments = Name & { assignments?: NameAssignment[] };

interface NamesListProps {
  names: NameWithAssignments[];
  isLoading: boolean;
  error: Error | null;
  editingName: Name | null;
  editText: string;
  isUpdating: boolean;
  isDeleting: boolean;
  onStartEdit: (name: Name) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSetEditText: (text: string) => void;
  onDelete: (name: Name) => void;
  onConfirmDelete: (nameId: string) => Promise<void>;
  deletingName: Name | null;
  canDeleteName: boolean;
  deleteReason: string;
  protectionData: CanDeleteNameResponse | null;
  onCloseDeleteModal: () => void;
}

/**
 * Individual Name Card Component with Assignment Info
 * Isolated component to prevent re-renders affecting the main form
 */
function NameCard({
  name,
  assignments,
  editingName,
  editText,
  isUpdating,
  isDeleting,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSetEditText,
  onDelete,
}: {
  name: Name;
  assignments?: NameAssignment[];
  editingName: Name | null;
  editText: string;
  isUpdating: boolean;
  isDeleting: boolean;
  onStartEdit: (name: Name) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSetEditText: (text: string) => void;
  onDelete: (name: Name) => void;
}) {
  // Use passed assignments or fallback to empty array
  const nameAssignments = assignments || [];
  const isProtected = isNameProtected(nameAssignments);
  const assignmentCount = getAssignmentCount(nameAssignments);

  // For backward compatibility, treat undefined assignments as loading
  const assignmentsLoading = assignments === undefined;
  const assignmentsError = null; // No error state since data comes from parent

  return (
<Card
  key={name.id}
  p='md'
  withBorder
  data-testid={`name-card-${name.name_text.toLowerCase().replace(/\s+/g, '-')}`}
>
  <Group justify='space-between'>
{editingName?.id === name.id ? (
  // Edit mode
  <Group gap='xs' style={{ flex: 1 }}>
<TextInput
  value={editText}
  onChange={(e) => onSetEditText(e.target.value)}
  style={{ flex: 1 }}
  data-testid='edit-name-input'
  onKeyDown={(e) => {
if (e.key === 'Enter') {
  onSaveEdit();
} else if (e.key === 'Escape') {
  onCancelEdit();
}
  }}
  autoFocus
/>
<ActionIcon
  color='green'
  variant='light'
  onClick={onSaveEdit}
  loading={isUpdating}
  disabled={isUpdating || !editText.trim()}
  data-testid='save-edit-button'
>
  <IconCheck size={16} />
</ActionIcon>
<ActionIcon
  color='gray'
  variant='light'
  onClick={onCancelEdit}
  disabled={isUpdating}
  data-testid='cancel-edit-button'
>
  <IconX size={16} />
</ActionIcon>
  </Group>
) : (
  // Display mode - Stack layout for name and assignment badges
  <Stack gap='xs' style={{ flex: 1 }}>
{/* Name text with protection indicator */}
<Group gap='xs'>
  <Text fw={500} size='lg' data-testid='name-text'>
{name.name_text}
  </Text>
  {isProtected && (
<Badge
  size='sm'
  color='orange'
  variant='light'
  leftSection={<IconShield size={12} />}
>
  Protected
</Badge>
  )}
</Group>

{/* Assignment information badges */}
{assignmentsLoading ? (
  <Group gap='xs'>
<Loader size='xs' />
<Text size='sm' c='dimmed'>
  Loading assignments...
</Text>
  </Group>
) : assignmentsError ? (
  <Text size='sm' c='red'>
Failed to load assignments
  </Text>
) : nameAssignments.length > 0 ? (
  <Group gap='xs'>
{/* Total assignment count */}
<Badge
  size='sm'
  color='blue'
  variant='light'
  leftSection={<IconEye size={12} />}
>
  {assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}
</Badge>
  </Group>
) : (
  <Text size='sm' c='dimmed'>
No assignments
  </Text>
)}
  </Stack>
)}

{editingName?.id !== name.id && (
  <Group gap='xs'>
<ActionIcon
  color='blue'
  variant='light'
  onClick={() => onStartEdit(name)}
  disabled={!!editingName || isDeleting}
  data-testid='edit-name-button'
>
  <IconEdit size={16} />
</ActionIcon>
{isProtected ? (
  <Tooltip
label='This name is protected and cannot be deleted. It is assigned to public or permanent contexts.'
multiline
w={200}
withArrow
  >
<ActionIcon
  color='red'
  variant='light'
  disabled={true}
  data-testid='delete-name-button'
>
  <IconTrash size={16} />
</ActionIcon>
  </Tooltip>
) : (
  <ActionIcon
color='red'
variant='light'
onClick={() => onDelete(name)}
loading={isDeleting}
disabled={isDeleting || !!editingName}
data-testid='delete-name-button'
  >
<IconTrash size={16} />
  </ActionIcon>
)}
  </Group>
)}
  </Group>
</Card>
  );
}

/**
 * Names List Component - Isolated from the add form to prevent re-renders
 * Contains all the logic for displaying, editing, and deleting existing names
 */
export function NamesList({
  names,
  isLoading,
  error,
  editingName,
  editText,
  isUpdating,
  isDeleting,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSetEditText,
  onDelete,
  onConfirmDelete,
  deletingName,
  canDeleteName,
  deleteReason,
  protectionData,
  onCloseDeleteModal,
}: NamesListProps) {
  const [showReplacementGuide, setShowReplacementGuide] = useState(false);

  const handleCloseDeleteModal = () => {
onCloseDeleteModal();
setShowReplacementGuide(false);
  };

  const handleOpenReplacementGuide = () => {
setShowReplacementGuide(true);
  };

  if (isLoading) {
return (
  <Center p='xl'>
<Stack align='center'>
  <Loader size='md' />
  <Text size='sm' c='dimmed'>
Loading names...
  </Text>
</Stack>
  </Center>
);
  }

  if (error) {
return (
  <Alert
color='red'
title='Error Loading Names'
icon={<IconAlertTriangle size={16} />}
  >
<Text size='sm'>{formatSWRError(error)}</Text>
  </Alert>
);
  }

  if (names.length === 0) {
return (
  <Center py='xl'>
<Stack align='center'>
  <Text size='lg' fw={500} c='dimmed'>
No name variants yet
  </Text>
  <Text size='sm' c='dimmed'>
Create your first name variant using the &quot;Add Name&quot; button
above
  </Text>
</Stack>
  </Center>
);
  }

  return (
<>
  <Stack gap='sm'>
{names.map((name) => (
  <NameCard
key={name.id}
name={name}
assignments={name.assignments}
editingName={editingName}
editText={editText}
isUpdating={isUpdating}
isDeleting={isDeleting}
onStartEdit={onStartEdit}
onSaveEdit={onSaveEdit}
onCancelEdit={onCancelEdit}
onSetEditText={onSetEditText}
onDelete={onDelete}
  />
))}
  </Stack>

  {/* Delete/Protection Modals */}
  {!canDeleteName && deletingName && protectionData ? (
<ProtectedNameWarning
  opened={!!deletingName}
  onClose={handleCloseDeleteModal}
  nameText={deletingName.name_text}
  protectionData={protectionData}
  onOpenReplacementGuide={handleOpenReplacementGuide}
/>
  ) : (
<DeleteNameModal
  opened={!!deletingName}
  onClose={handleCloseDeleteModal}
  nameId={deletingName?.id || ''}
  nameText={deletingName?.name_text || ''}
  isDeleting={isDeleting}
  onConfirmDelete={onConfirmDelete}
  canDelete={canDeleteName}
  deleteReason={deleteReason}
  isDefaultContextName={deleteReason.toLowerCase().includes('default')}
/>
  )}

  {/* Replacement Guide Modal */}
  {showReplacementGuide && deletingName && protectionData && (
<NameReplacementGuideModal
  opened={showReplacementGuide}
  onClose={() => setShowReplacementGuide(false)}
  nameText={deletingName.name_text}
  protectionData={protectionData}
  onCreateNewName={() => {
setShowReplacementGuide(false);
// Could emit event or callback to show add form
  }}
  onUpdateContexts={() => {
setShowReplacementGuide(false);
// Could navigate to contexts tab
  }}
/>
  )}
</>
  );
}
