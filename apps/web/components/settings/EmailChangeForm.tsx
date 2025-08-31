'use client';

import { Card, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconInfoCircle, IconMail } from '@tabler/icons-react';

import { useAuth } from '@/utils/context';

export function EmailChangeForm() {
  const { user } = useAuth();

  return (
<Stack gap='md'>
  <Text size='sm' fw={500} c='gray.7'>
Email Address
  </Text>

  <TextInput
label='Current Email'
value={user?.email || ''}
disabled
leftSection={<IconMail size={16} />}
  />

  <Card p='md' bg='blue.0' radius='md' withBorder>
<Group gap='sm'>
  <IconInfoCircle size={20} color='var(--mantine-color-blue-6)' />
  <div>
<Text size='sm' fw={500} c='blue.7'>
  Email Change Coming Soon
</Text>
<Text size='xs' c='blue.6' mt='xs'>
  Email changes with verification flow will be available in a future
  update. This ensures secure email transitions with proper
  confirmation.
</Text>
  </div>
</Group>
  </Card>
</Stack>
  );
}
