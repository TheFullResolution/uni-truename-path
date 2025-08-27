'use client';

import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { Card, Loader, Text, Group, Stack, Badge } from '@mantine/core';

interface APIUsageCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function APIUsageCard({ stats, loading }: APIUsageCardProps) {
  // Extract OAuth metrics from the new stats structure
  const oauthMetrics = stats?.oauth_metrics;

  const formatResponseTime = (ms: number | null) => {
if (ms === null) return 'N/A';
return ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const formatSuccessRate = (rate: number | null) => {
if (rate === null) return 'N/A';
return `${rate.toFixed(1)}%`;
  };

  return (
<Card withBorder radius='md' p='xl' bg='var(--mantine-color-body)'>
  <Text fz='xs' tt='uppercase' fw={700} c='dimmed'>
OAuth Performance Metrics
  </Text>

  <Stack gap='xs' mt='sm'>
{/* Primary metric: Total OAuth usage */}
<Group justify='space-between' align='center'>
  <Text fz='lg' fw={500}>
{loading ? (
  <Loader size={16} />
) : (
  `${oauthMetrics?.total_usage || 0} API calls`
)}
  </Text>
</Group>

{/* Performance metrics */}
<Group justify='space-between' align='center'>
  <Text fz='xs' c='dimmed'>
{loading
  ? 'Loading...'
  : `Avg response: ${formatResponseTime(oauthMetrics?.avg_response_time_ms || null)}`}
  </Text>
  <Text fz='xs' c='dimmed'>
{loading
  ? '...'
  : `Success rate: ${formatSuccessRate(oauthMetrics?.success_rate_percent || null)}`}
  </Text>
</Group>

{/* Success rate indicator */}
{!loading &&
  oauthMetrics?.success_rate_percent !== null &&
  oauthMetrics && (
<Group justify='space-between' align='center' mt='xs'>
  <Badge
size='xs'
variant='light'
color={
  (oauthMetrics.success_rate_percent || 0) >= 95
? 'green'
: (oauthMetrics.success_rate_percent || 0) >= 90
  ? 'yellow'
  : 'red'
}
  >
{(oauthMetrics.success_rate_percent || 0) >= 95
  ? 'Excellent'
  : (oauthMetrics.success_rate_percent || 0) >= 90
? 'Good'
: 'Needs attention'}
  </Badge>
  {(oauthMetrics.recent_authorizations || 0) > 0 && (
<Text fz='xs' c='dimmed'>
  {oauthMetrics.recent_authorizations} recent auth
</Text>
  )}
</Group>
  )}
  </Stack>
</Card>
  );
}
