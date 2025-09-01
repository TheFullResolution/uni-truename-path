import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import {
  Card,
  Group,
  Text,
  Title,
  SimpleGrid,
  Box,
  Progress,
  Skeleton,
  ThemeIcon,
} from '@mantine/core';
import {
  IconApps,
  IconKey,
  IconActivity,
  IconCircleCheck,
} from '@tabler/icons-react';

interface OAuthOverviewCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function OAuthOverviewCard({ stats, loading }: OAuthOverviewCardProps) {
  const metrics = stats?.oauth_metrics;
  const successRate = metrics?.success_rate_percent || 0;

  const getSuccessRateColor = (rate: number) => {
if (rate >= 95) return 'green';
if (rate >= 90) return 'yellow';
return 'red';
  };

  return (
<Card withBorder radius='md' p='md'>
  <Group gap='sm' mb='md'>
<IconActivity size={20} color='var(--mantine-color-brand-6)' />
<Title order={3} c='gray.8'>
  OAuth Overview
</Title>
  </Group>

  <SimpleGrid cols={2} spacing='md'>
<Box>
  <Group gap='xs' mb={4}>
<ThemeIcon size='sm' variant='light' color='blue'>
  <IconKey size={14} />
</ThemeIcon>
<Text size='xs' c='dimmed' fw={500}>
  Recent Authorizations
</Text>
  </Group>
  {loading ? (
<Skeleton height={28} width={60} />
  ) : (
<Text size='xl' fw={600} c='blue.7'>
  {metrics?.recent_authorizations || 0}
</Text>
  )}
  <Text size='xs' c='dimmed'>
Last 7 days
  </Text>
</Box>

<Box>
  <Group gap='xs' mb={4}>
<ThemeIcon size='sm' variant='light' color='green'>
  <IconActivity size={14} />
</ThemeIcon>
<Text size='xs' c='dimmed' fw={500}>
  Total API Calls
</Text>
  </Group>
  {loading ? (
<Skeleton height={28} width={60} />
  ) : (
<Text size='xl' fw={600} c='green.7'>
  {metrics?.total_usage || 0}
</Text>
  )}
  <Text size='xs' c='dimmed'>
All time
  </Text>
</Box>

<Box>
  <Group gap='xs' mb={4}>
<ThemeIcon size='sm' variant='light' color='violet'>
  <IconApps size={14} />
</ThemeIcon>
<Text size='xs' c='dimmed' fw={500}>
  Connected Apps
</Text>
  </Group>
  {loading ? (
<Skeleton height={28} width={60} />
  ) : (
<Text size='xl' fw={600} c='violet.7'>
  {metrics?.connected_apps || 0}
</Text>
  )}
  <Text size='xs' c='dimmed'>
Active integrations
  </Text>
</Box>

<Box>
  <Group gap='xs' mb={4}>
<ThemeIcon
  size='sm'
  variant='light'
  color={getSuccessRateColor(successRate)}
>
  <IconCircleCheck size={14} />
</ThemeIcon>
<Text size='xs' c='dimmed' fw={500}>
  Success Rate
</Text>
  </Group>
  {loading ? (
<Skeleton height={28} width={60} />
  ) : (
<Text
  size='xl'
  fw={600}
  c={`${getSuccessRateColor(successRate)}.7`}
>
  {successRate > 0 ? `${successRate.toFixed(1)}%` : 'N/A'}
</Text>
  )}
  <Text size='xs' c='dimmed'>
Last 7 days
  </Text>
</Box>
  </SimpleGrid>

  {!loading && successRate > 0 && (
<Box mt='md'>
  <Progress
value={successRate}
color={getSuccessRateColor(successRate)}
size='sm'
radius='xl'
  />
  <Text size='xs' c='dimmed' mt={4} ta='center'>
{successRate >= 95
  ? 'Excellent performance'
  : successRate >= 90
? 'Good performance'
: 'Performance needs attention'}
  </Text>
</Box>
  )}
</Card>
  );
}
