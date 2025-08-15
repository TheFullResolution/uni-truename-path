'use client';

import {
  Paper,
  Group,
  Title,
  Stack,
  Text,
  Badge,
  Skeleton,
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { DashboardStats } from '../../../types/database';

interface NameVariantsCardProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function NameVariantsCard({
  stats,
  loading,
}: NameVariantsCardProps) {
  const nameTypes = ['LEGAL', 'PREFERRED', 'NICKNAME', 'ALIAS'];

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconUser size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Name Variants
</Title>
  </Group>

  <Stack gap='xs'>
{nameTypes.map((type) => {
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
