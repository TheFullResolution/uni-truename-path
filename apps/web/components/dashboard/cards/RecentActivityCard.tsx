'use client';

import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconActivity } from '@tabler/icons-react';
import useSWR from 'swr';
import { useAuth } from '../../../utils/context';
import { swrFetcher } from '../../../utils/swr-fetcher';
import { formatActivityAction, getActivityIcon } from '../../../utils/utils';
import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';

// Simple Activity type for this component
interface Activity {
  id: string;
  action: string;
  created_at: string;
  metadata?: {
context_name?: string;
resolved_name?: string;
[key: string]: unknown;
  };
  [key: string]: unknown;
}

interface RecentActivityCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export default function RecentActivityCard({
  stats,
  loading,
}: RecentActivityCardProps) {
  const { user } = useAuth();

  // SWR data fetching for recent activities
  const {
data: activities = [],
error: activitiesError,
isLoading: activitiesLoading,
  } = useSWR<Activity[]>(
user?.profile?.id ? `/api/audit/${user.profile.id}?limit=5&days=7` : null,
swrFetcher,
  );

  // Handle SWR errors for activities
  if (activitiesError) {
console.error('Failed to fetch activities:', activitiesError);
  }

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconActivity size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Recent Activity
</Title>
{stats?.activity_metrics.recent_activity_count && (
  <Badge variant='light' color='blue' size='sm'>
{stats.activity_metrics.recent_activity_count} in last 7 days
  </Badge>
)}
  </Group>

  {loading || activitiesLoading ? (
<Stack gap='xs'>
  <Skeleton height={40} />
  <Skeleton height={40} />
  <Skeleton height={40} />
</Stack>
  ) : activities.length > 0 ? (
<Stack gap='md'>
  {activities.map((activity: Activity, index: number) => (
<Paper key={index} p='md' withBorder radius='md' bg='gray.0'>
  <Group gap='sm'>
{getActivityIcon(activity.action)}
<Box flex={1}>
  <Group justify='space-between' mb='xs'>
<Text size='sm' fw={500}>
  {formatActivityAction(activity.action)}
</Text>
<Text size='xs' c='gray.6'>
  {new Date(activity.created_at).toLocaleDateString()}
</Text>
  </Group>

  {activity.metadata?.context_name && (
<Text size='xs' c='gray.6'>
  Context: {activity.metadata.context_name}
</Text>
  )}

  {activity.metadata?.resolved_name && (
<Text size='xs' c='green.6'>
  Resolved to: &quot;{activity.metadata.resolved_name}&quot;
</Text>
  )}
</Box>
  </Group>
</Paper>
  ))}

  <Button
variant='subtle'
color='brand'
size='sm'
onClick={() => {
  notifications.show({
title: 'Coming Soon',
message:
  'Full activity log will be available in the next update',
color: 'blue',
autoClose: 4000,
  });
}}
  >
View Full Activity Log
  </Button>
</Stack>
  ) : (
<Text size='sm' c='gray.6' ta='center' py='xl'>
  No recent activity found
</Text>
  )}
</Paper>
  );
}
