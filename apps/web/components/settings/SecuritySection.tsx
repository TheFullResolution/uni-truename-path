'use client';

import { Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconKey, IconShieldCheck } from '@tabler/icons-react';

import { PasswordChangeForm } from './';

export function SecuritySection() {
  return (
<Card withBorder p='md' radius='md' mb='lg'>
  <Group gap='sm' mb='md'>
<IconKey size={20} color='var(--mantine-color-gray-6)' />
<Title order={3} size='h4' c='gray.8'>
  Security
</Title>
  </Group>

  <Stack gap='lg'>
{/* Password Change Form */}
<PasswordChangeForm />

{/* 2FA Placeholder */}
<Card p='md' bg='gray.0' radius='md'>
  <Group gap='sm'>
<IconShieldCheck size={20} color='var(--mantine-color-gray-5)' />
<div>
  <Text size='sm' fw={500} c='gray.7'>
Two-Factor Authentication
  </Text>
  <Text size='xs' c='gray.6'>
Coming Soon - Enhanced security with 2FA
  </Text>
</div>
  </Group>
</Card>
  </Stack>
</Card>
  );
}
