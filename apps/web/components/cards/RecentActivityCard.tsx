'use client';

import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import {
  Badge,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconActivity,
  IconCheck,
  IconKey,
  IconTrash,
} from '@tabler/icons-react';

interface RecentActivityCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function RecentActivityCard({
  stats,
  loading,
}: RecentActivityCardProps) {
  const recentActivities = stats?.oauth_metrics?.recent_activity || [];

  const getActionIcon = (action: string) => {
switch (action.toLowerCase()) {
  case 'authorize':
return <IconKey size={16} color='blue' />;
  case 'resolve':
return <IconCheck size={16} color='green' />;
  case 'revoke':
return <IconTrash size={16} color='red' />;
  default:
return <IconActivity size={16} color='gray' />;
}
  };

  const formatTimeAgo = (timestamp: string) => {
const date = new Date(timestamp);
const now = new Date();
const diffMs = now.getTime() - date.getTime();
const diffMins = Math.floor(diffMs / 60000);

if (diffMins < 1) return 'Just now';
if (diffMins < 60) return `${diffMins}m ago`;
const diffHours = Math.floor(diffMins / 60);
if (diffHours < 24) return `${diffHours}h ago`;
const diffDays = Math.floor(diffHours / 24);
return `${diffDays}d ago`;
  };

  const formatActionText = (action: string) => {
switch (action.toLowerCase()) {
  case 'authorize':
return 'OAuth Authorization';
  case 'resolve':
return 'Identity Resolution';
  case 'revoke':
return 'Access Revocation';
  case 'assign_context':
return 'Context Assignment';
  default:
return action;
}
  };

  return (
<Paper withBorder radius='md' p='xl'>
  <Group gap='sm' mb='md'>
<IconActivity size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Recent OAuth Operations
</Title>
  </Group>

  {loading ? (
<Stack gap='sm'>
  <Skeleton height={20} />
  <Skeleton height={20} />
  <Skeleton height={20} />
</Stack>
  ) : recentActivities.length === 0 ? (
<Text size='sm' c='gray.6' ta='center' py='xl'>
  No OAuth activity yet. Start by connecting your first application.
</Text>
  ) : (
<Stack gap='sm'>
  {recentActivities.slice(0, 4).map((activity, index) => (
<Group key={index} justify='space-between' align='center'>
  <Group gap='sm'>
{getActionIcon(activity.action)}
<div>
  <Text fz='sm' fw={500}>
{formatActionText(activity.action)}
  </Text>
  <Group gap='xs'>
<Text fz='xs' c='dimmed'>
  {activity.app_name}
</Text>
<Badge
  size='xs'
  variant='light'
  color={activity.success ? 'green' : 'red'}
>
  {activity.success ? 'Success' : 'Failed'}
</Badge>
  </Group>
</div>
  </Group>
  <Text fz='xs' c='dimmed'>
{formatTimeAgo(activity.created_at)}
  </Text>
</Group>
  ))}
</Stack>
  )}
</Paper>
  );
}
