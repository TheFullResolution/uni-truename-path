'use client';

import { Group, Paper, Tabs, Text, Title } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

export function SettingsTab() {
  return (
<Tabs.Panel value='settings'>
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='md'>
  <IconSettings size={24} color='#4A7FE7' />
  <Title order={2} c='gray.8'>
Account Settings
  </Title>
</Group>
<Text c='gray.6'>
  Account settings will be implemented in future steps. This will
  include profile management, security settings, and API key management.
</Text>
  </Paper>
</Tabs.Panel>
  );
}
