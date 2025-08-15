'use client';

import { Paper, Group, Title, Stack, Text, Skeleton } from '@mantine/core';
import { IconApi } from '@tabler/icons-react';
import { DashboardStats } from '../../../types/database';

interface APIUsageCardProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function APIUsageCard({ stats, loading }: APIUsageCardProps) {
  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconApi size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  API Usage
</Title>
  </Group>

  <Stack gap='md'>
<Group justify='space-between'>
  <Text size='sm' c='gray.7'>
Today&apos;s API Calls
  </Text>
  {loading ? (
<Skeleton height={16} width={30} />
  ) : (
<Text size='sm' fw={600} c='brand.7'>
  {stats?.activity_metrics.api_calls_today || 0}
</Text>
  )}
</Group>
<Group justify='space-between'>
  <Text size='sm' c='gray.7'>
Recent Activity
  </Text>
  {loading ? (
<Skeleton height={16} width={30} />
  ) : (
<Text size='sm' fw={600} c='blue.7'>
  {stats?.activity_metrics.recent_activity_count || 0}
</Text>
  )}
</Group>
<Group justify='space-between'>
  <Text size='sm' c='gray.7'>
Active Consents
  </Text>
  {loading ? (
<Skeleton height={16} width={30} />
  ) : (
<Text size='sm' fw={600} c='green.7'>
  {stats?.context_statistics.active_consents || 0}
</Text>
  )}
</Group>
  </Stack>
</Paper>
  );
}
