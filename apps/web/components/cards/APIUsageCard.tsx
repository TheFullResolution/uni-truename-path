'use client';

import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { Card, Loader, Text, Group, Stack } from '@mantine/core';

interface APIUsageCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function APIUsageCard({ stats, loading }: APIUsageCardProps) {
  // Extract usage analytics from the new stats structure
  const usageAnalytics = stats?.usage_analytics;
  const performanceMetrics = stats?.performance_metrics;

  return (
<Card withBorder radius='md' p='xl' bg='var(--mantine-color-body)'>
  <Text fz='xs' tt='uppercase' fw={700} c='dimmed'>
Context Usage Analytics
  </Text>

  <Stack gap='xs' mt='sm'>
{/* Primary metric: Total context usages */}
<Group justify='space-between' align='center'>
  <Text fz='lg' fw={500}>
{loading ? (
  <Loader size={16} />
) : (
  `${usageAnalytics?.total_context_usages || 0} context uses`
)}
  </Text>
</Group>

{/* Secondary metrics */}
<Group justify='space-between' align='center'>
  <Text fz='xs' c='dimmed'>
{loading
  ? 'Loading...'
  : `${usageAnalytics?.context_usages_today || 0} uses today`}
  </Text>
  <Text fz='xs' c='dimmed'>
{loading
  ? '...'
  : `${usageAnalytics?.total_applications || 0} apps`}
  </Text>
</Group>

{/* Performance and top usage info */}
{!loading &&
  (usageAnalytics?.top_application_today ||
performanceMetrics?.avg_response_time_today_ms) && (
<Group justify='space-between' align='center' mt='xs'>
  {usageAnalytics?.top_application_today && (
<Text fz='xs' c='dimmed' truncate style={{ maxWidth: '60%' }}>
  Top: {usageAnalytics.top_application_today}
</Text>
  )}
  {performanceMetrics?.avg_response_time_today_ms && (
<Text fz='xs' c='dimmed'>
  {performanceMetrics.avg_response_time_today_ms}ms avg
</Text>
  )}
</Group>
  )}
  </Stack>
</Card>
  );
}
