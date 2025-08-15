'use client';

import React from 'react';
import { Paper, Group, Title, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

export function SettingsPanel() {
  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconSettings size={24} color='#4A7FE7' />
<Title order={2} c='gray.8'>
  Context Settings
</Title>
  </Group>
  <Text c='gray.6'>
Context settings and preferences will be implemented in future updates.
This will include default context behavior, privacy settings, and bulk
operations.
  </Text>
</Paper>
  );
}
