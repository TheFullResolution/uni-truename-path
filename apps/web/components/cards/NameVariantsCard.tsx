'use client';

import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { Card, Group, Loader, Text, ThemeIcon } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';

interface NameVariantsCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function NameVariantsCard({ stats, loading }: NameVariantsCardProps) {
  const nameCount = stats?.name_statistics?.total_names || 0;

  return (
<Card withBorder radius='md' p='xl' bg='var(--mantine-color-body)'>
  <Group justify='apart'>
<div>
  <Text fz='xs' tt='uppercase' fw={700} c='dimmed'>
Name Variants
  </Text>
  <Text fz='lg' fw={500} mt='xs'>
{loading ? <Loader size={16} /> : nameCount}
  </Text>
  <Text fz='xs' c='dimmed' mt={3}>
{loading ? 'Loading...' : 'Active name variants'}
  </Text>
</div>
<ThemeIcon
  color='green'
  size={38}
  radius='md'
  variant='gradient'
  gradient={{ deg: 0, from: 'green', to: 'lime' }}
>
  <IconUsers size={24} />
</ThemeIcon>
  </Group>
</Card>
  );
}
