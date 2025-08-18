'use client';

import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { NAME_CATEGORIES } from '@/app/api/names/types';
import {
  Badge,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';

interface NameVariantsCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export default function NameVariantsCard({
  stats,
  loading,
}: NameVariantsCardProps) {
  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconUser size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Name Variants
</Title>
  </Group>

  <Stack gap='xs'>
{NAME_CATEGORIES.map((type) => {
  const count = stats?.name_statistics.names_by_type[type] || 0;
  return (
<Group key={type} justify='space-between'>
  <Badge variant='light' color='blue' size='sm'>
{type}
  </Badge>
  {loading ? (
<Skeleton height={16} width={20} />
  ) : (
<Text size='sm' c='gray.7'>
  {count}
</Text>
  )}
</Group>
  );
})}
  </Stack>
</Paper>
  );
}
