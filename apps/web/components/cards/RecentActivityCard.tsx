'use client';

import { AuditLogResponseData } from '@/app/api/audit/types';
import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { JSendSuccess } from '@/types/api';
import { useAuth } from '@/utils/context';
import { swrFetcher } from '@/utils/swr-fetcher';
import { formatActivityAction, getActivityIcon } from '@/utils/utils';
import {
  Box,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconActivity } from '@tabler/icons-react';
import useSWR from 'swr';

interface RecentActivityCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function RecentActivityCard({ loading }: RecentActivityCardProps) {
  const { user } = useAuth();

  // Fetch recent activity data - expect JSend response with AuditLogResponseData
  // SECURITY: Use secure endpoint that gets user ID from auth context
  const { data: auditResponse, isLoading: activitiesLoading } = useSWR<
JSendSuccess<AuditLogResponseData>
  >(
user ? `/api/audit?limit=3` : null,
swrFetcher<JSendSuccess<AuditLogResponseData>>,
  );

  const isLoadingData = loading || activitiesLoading;

  // Extract entries from the JSend response structure
  const recentActivities = auditResponse?.data?.entries || [];

  return (
<Paper withBorder radius='md' p='xl'>
  <Group gap='sm' mb='md'>
<IconActivity size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Recent Activity
</Title>
  </Group>

  {isLoadingData ? (
<Stack gap='sm'>
  <Skeleton height={20} />
  <Skeleton height={20} />
  <Skeleton height={20} />
</Stack>
  ) : recentActivities.length === 0 ? (
<Text size='sm' c='gray.6' ta='center' py='xl'>
  No recent activity found
</Text>
  ) : (
<Stack gap='sm'>
  {recentActivities.map((activity) => (
<Group
  key={activity.requester_user_id}
  justify='apart'
  wrap='nowrap'
>
  <div style={{ flex: 1 }}>
<Text fz='sm' lineClamp={1}>
  {formatActivityAction
? formatActivityAction(activity.action)
: activity.action}
</Text>
<Text fz='xs' c='dimmed'>
  {new Date(activity.accessed_at).toLocaleDateString()}
</Text>
  </div>
  {getActivityIcon && <Box>{getActivityIcon(activity.action)}</Box>}
</Group>
  ))}
  <Button variant='light' size='sm' fullWidth mt='sm'>
View Full Activity Log
  </Button>
</Stack>
  )}
</Paper>
  );
}
