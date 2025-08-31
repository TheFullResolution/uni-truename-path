'use client';

import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

interface DangerZoneProps {
  onDeleteAccount: () => void;
}

export function DangerZone({ onDeleteAccount }: DangerZoneProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteClick = () => {
setIsLoading(true);
try {
  onDeleteAccount();
} finally {
  setIsLoading(false);
}
  };

  return (
<Card withBorder p='md' radius='md' bg='red.0'>
  <Group gap='sm' mb='md'>
<IconTrash size={20} color='var(--mantine-color-red-6)' />
<Title order={3} size='h4' c='red.7'>
  Danger Zone
</Title>
  </Group>

  <Stack gap='md'>
<Text size='sm' c='gray.7'>
  Permanently delete your account and all associated data.
</Text>

<Stack gap='xs'>
  <Text size='sm' c='red.7' fw={500}>
Account Deletion
  </Text>
  <Text size='xs' c='gray.6' mb='md'>
This action is irreversible. All your data, including names,
contexts, assignments, and connected applications will be
permanently removed. This cannot be undone.
  </Text>

  <Button
variant='filled'
color='red'
size='md'
leftSection={<IconTrash size={16} />}
onClick={handleDeleteClick}
loading={isLoading}
disabled={isLoading}
data-testid='delete-account-button'
  >
{isLoading ? 'Processing...' : 'Delete Account'}
  </Button>
</Stack>
  </Stack>
</Card>
  );
}
