'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  Alert,
  Badge,
  Title,
  Divider,
} from '@mantine/core';
import {
  IconShield,
  IconInfoCircle,
  IconUsers,
  IconLock,
  IconAlertTriangle,
  IconBook,
} from '@tabler/icons-react';
import { CanDeleteNameResponse } from '@/types/database';

interface ProtectedNameWarningProps {
  opened: boolean;
  onClose: () => void;
  nameText: string;
  protectionData: CanDeleteNameResponse;
  onOpenReplacementGuide?: () => void;
}

function getProtectionTypeIcon(protectionType: string) {
  switch (protectionType) {
case 'PUBLIC_CONTEXT':
  return <IconUsers size={16} />;
case 'PERMANENT_CONTEXT':
  return <IconLock size={16} />;
case 'LAST_NAME':
  return <IconShield size={16} />;
default:
  return <IconAlertTriangle size={16} />;
  }
}

function getProtectionTypeColor(protectionType: string): string {
  switch (protectionType) {
case 'PUBLIC_CONTEXT':
  return 'orange';
case 'PERMANENT_CONTEXT':
  return 'red';
case 'LAST_NAME':
  return 'yellow';
default:
  return 'gray';
  }
}

export function ProtectedNameWarning({
  opened,
  onClose,
  nameText,
  protectionData,
  onOpenReplacementGuide,
}: ProtectedNameWarningProps) {
  const { reason, reason_code, protection_type, context_info, name_count } =
protectionData;
  const hasPublicContexts = context_info.public_contexts.length > 0;
  const hasPermanentContexts = context_info.permanent_contexts.length > 0;

  return (
<Modal
  opened={opened}
  onClose={onClose}
  title='Cannot Delete Name'
  centered
  size='lg'
>
  <Stack gap='md'>
{/* Main protection alert */}
<Alert
  icon={getProtectionTypeIcon(protection_type)}
  title='Name Protection Active'
  color={getProtectionTypeColor(protection_type)}
>
  <Text size='sm' mb='xs'>
The name{' '}
<Text component='span' fw={600}>
  &ldquo;{nameText}&rdquo;
</Text>{' '}
cannot be deleted.
  </Text>
  <Text size='sm' c='dimmed'>
{reason}
  </Text>
</Alert>

{/* Protection details */}
<Stack gap='xs'>
  <Group gap='xs' align='center'>
<Text size='sm' fw={500}>
  Protection Details:
</Text>
<Badge
  variant='light'
  color={getProtectionTypeColor(protection_type)}
  size='sm'
>
  {protection_type
.replace('_', ' ')
.toLowerCase()
.replace(/\b\w/g, (l) => l.toUpperCase())}
</Badge>
  </Group>

  <Group gap='md'>
<Text size='sm' c='dimmed'>
  Total names: {name_count}
</Text>
<Text size='sm' c='dimmed'>
  Protection code: {reason_code}
</Text>
  </Group>
</Stack>

{/* Public contexts section */}
{hasPublicContexts && (
  <>
<Divider />
<Stack gap='xs'>
  <Group gap='xs' align='center'>
<IconUsers size={16} color='var(--mantine-color-green-6)' />
<Title order={6}>Public Context Assignments</Title>
<Badge variant='light' color='green' size='xs'>
  {context_info.public_contexts.length}
</Badge>
  </Group>

  <Alert
color='green'
variant='light'
icon={<IconInfoCircle size={16} />}
  >
<Text size='sm' mb='xs'>
  This name is assigned to public contexts that are visible to
  external applications and services.
</Text>
  </Alert>

  <Group gap='xs'>
{context_info.public_contexts.map((context) => (
  <Badge
key={context.id}
variant='light'
color='green'
size='sm'
leftSection={<IconUsers size={12} />}
  >
{context.context_name}
  </Badge>
))}
  </Group>
</Stack>
  </>
)}

{/* Permanent contexts section */}
{hasPermanentContexts && (
  <>
<Divider />
<Stack gap='xs'>
  <Group gap='xs' align='center'>
<IconLock size={16} color='var(--mantine-color-red-6)' />
<Title order={6}>Permanent Context Assignments</Title>
<Badge variant='light' color='red' size='xs'>
  {context_info.permanent_contexts.length}
</Badge>
  </Group>

  <Alert
color='red'
variant='light'
icon={<IconShield size={16} />}
  >
<Text size='sm' mb='xs'>
  This name is assigned to permanent contexts that cannot be
  modified without replacement.
</Text>
  </Alert>

  <Group gap='xs'>
{context_info.permanent_contexts.map((context) => (
  <Badge
key={context.id}
variant='light'
color='red'
size='sm'
leftSection={<IconLock size={12} />}
  >
{context.context_name}
  </Badge>
))}
  </Group>
</Stack>
  </>
)}

{/* Last name protection info */}
{reason_code === 'LAST_NAME' && (
  <>
<Divider />
<Alert
  icon={<IconShield size={16} />}
  title='Last Name Protection'
  color='yellow'
  variant='light'
>
  <Text size='sm'>
You must have at least one name available for context-aware
resolution to function properly. This is your last remaining
name variant and serves as the fallback for all identity
presentations.
  </Text>
</Alert>
  </>
)}

{/* Action guidance */}
<Alert
  icon={<IconInfoCircle size={16} />}
  title='What you can do'
  color='blue'
  variant='light'
>
  <Stack gap='xs'>
<Text size='sm'>To delete this name, you&apos;ll need to:</Text>
<Text size='sm'>
  • Create alternative name variants for protected contexts
</Text>
<Text size='sm'>
  • Reassign context assignments to replacement names
</Text>
{reason_code === 'LAST_NAME' && (
  <Text size='sm'>
• Ensure you have at least one other name variant available
  </Text>
)}
  </Stack>
</Alert>

{/* Action buttons */}
<Group justify='space-between' mt='md'>
  <Group>
{onOpenReplacementGuide && (
  <Button
variant='light'
color='blue'
size='md'
leftSection={<IconBook size={16} />}
onClick={() => {
  onOpenReplacementGuide();
  onClose();
}}
  >
Learn Safe Replacement
  </Button>
)}
  </Group>

  <Button onClick={onClose} variant='filled' size='md'>
Understood
  </Button>
</Group>
  </Stack>
</Modal>
  );
}
