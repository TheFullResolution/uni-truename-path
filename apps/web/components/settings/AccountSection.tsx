'use client';

import { Avatar, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconInfoCircle, IconUser } from '@tabler/icons-react';

import { EmailChangeForm } from './';

export function AccountSection() {
  return (
<Card withBorder p='md' radius='md' mb='lg'>
  <Group gap='sm' mb='md'>
<IconUser size={20} color='var(--mantine-color-gray-6)' />
<Title order={3} size='h4' c='gray.8'>
  Account
</Title>
  </Group>

  <Stack gap='md'>
{/* Avatar Section */}
<Stack gap='md'>
  <Text size='sm' fw={500} c='gray.7'>
Profile Picture
  </Text>

  <Group gap='md'>
<Avatar size='xl' radius='xl'>
  <IconUser size={24} />
</Avatar>
<Stack gap='xs'>
  <Text fw={500}>Profile Picture</Text>
  <Text size='sm' c='dimmed'>
Customize your avatar
  </Text>
</Stack>
  </Group>

  <Card p='md' bg='blue.0' radius='md' withBorder>
<Group gap='sm'>
  <IconInfoCircle size={20} color='var(--mantine-color-blue-6)' />
  <div>
<Text size='sm' fw={500} c='blue.7'>
  Avatar Upload Coming Soon
</Text>
<Text size='xs' c='blue.6' mt='xs'>
  Profile picture upload functionality will be available in a
  future update. Customize your avatar with personal photos.
</Text>
  </div>
</Group>
  </Card>
</Stack>

{/* Email Change Form */}
<EmailChangeForm />
  </Stack>
</Card>
  );
}
