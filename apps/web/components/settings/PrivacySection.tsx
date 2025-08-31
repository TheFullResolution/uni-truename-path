'use client';

import { Card, Group, Text, Title } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';

export function PrivacySection() {
  return (
<Card withBorder p='md' radius='md' mb='lg'>
  <Group gap='sm' mb='md'>
<IconDownload size={20} color='var(--mantine-color-gray-6)' />
<Title order={3} size='h4' c='gray.8'>
  Privacy
</Title>
  </Group>

  <Card p='md' bg='gray.0' radius='md'>
<Group gap='sm'>
  <IconDownload size={20} color='var(--mantine-color-gray-5)' />
  <div>
<Text size='sm' fw={500} c='gray.7'>
  Data Export
</Text>
<Text size='xs' c='gray.6'>
  Coming Soon - Download all your data (GDPR compliance)
</Text>
  </div>
</Group>
  </Card>
</Card>
  );
}
