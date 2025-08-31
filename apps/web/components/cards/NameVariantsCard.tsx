'use client';

import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import {
  Card,
  Group,
  Loader,
  Text,
  ThemeIcon,
  Stack,
  Badge,
  Button,
} from '@mantine/core';
import { IconPlug } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface ConnectedAppsCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function ConnectedAppsCard({ stats, loading }: ConnectedAppsCardProps) {
  const router = useRouter();
  const connectedApps = stats?.oauth_metrics?.connected_apps || 0;
  const topApp = stats?.oauth_metrics?.top_app_name;

  const handleViewAll = () => {
router.push('/dashboard/connected-apps');
  };

  return (
<Card withBorder radius='md' p='md' data-testid='connected-apps-card'>
  <Group justify='apart'>
<div>
  <Text fz='xs' tt='uppercase' fw={700} c='dimmed'>
Connected Apps
  </Text>
  <Text fz='lg' fw={500} mt='xs' data-testid='connected-apps-count'>
{loading ? <Loader size={16} /> : connectedApps}
  </Text>
  <Stack gap={4} mt='xs'>
<Text fz='xs' c='dimmed'>
  {loading ? 'Loading...' : 'OAuth integrations'}
</Text>
{!loading && topApp && (
  <Badge size='xs' variant='light' color='blue'>
Top: {topApp}
  </Badge>
)}
  </Stack>
</div>
<ThemeIcon
  color='blue'
  size={40}
  radius='md'
  variant='gradient'
  gradient={{ deg: 0, from: 'blue', to: 'cyan' }}
>
  <IconPlug size={24} />
</ThemeIcon>
  </Group>
  {!loading && connectedApps > 0 && (
<Button
  variant='light'
  size='sm'
  mt='md'
  fullWidth
  onClick={handleViewAll}
  data-testid='view-all-connected-apps'
>
  View All
</Button>
  )}
</Card>
  );
}
