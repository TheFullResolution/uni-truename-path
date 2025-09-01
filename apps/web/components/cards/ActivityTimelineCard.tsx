'use client';

import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import {
  Badge,
  Group,
  Card,
  Skeleton,
  Stack,
  Text,
  Title,
  ScrollArea,
  Timeline,
  ThemeIcon,
} from '@mantine/core';
import {
  IconActivity,
  IconCheck,
  IconX,
  IconKey,
  IconTrash,
  IconLink,
} from '@tabler/icons-react';

interface ActivityTimelineCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function ActivityTimelineCard({
  stats,
  loading,
}: ActivityTimelineCardProps) {
  const recentActivities = stats?.oauth_metrics?.recent_activity || [];

  const getActionIcon = (action: string, success: boolean) => {
const color = success ? 'green' : 'red';
switch (action.toLowerCase()) {
  case 'authorize':
return (
  <ThemeIcon color='blue' size={24} radius='xl'>
<IconKey size={14} />
  </ThemeIcon>
);
  case 'resolve':
return (
  <ThemeIcon color={color} size={24} radius='xl'>
{success ? <IconCheck size={14} /> : <IconX size={14} />}
  </ThemeIcon>
);
  case 'revoke':
return (
  <ThemeIcon color='red' size={24} radius='xl'>
<IconTrash size={14} />
  </ThemeIcon>
);
  case 'assign_context':
return (
  <ThemeIcon color='violet' size={24} radius='xl'>
<IconLink size={14} />
  </ThemeIcon>
);
  default:
return (
  <ThemeIcon color='gray' size={24} radius='xl'>
<IconActivity size={14} />
  </ThemeIcon>
);
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
if (diffDays < 7) return `${diffDays}d ago`;

// For older items, show the date
return date.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
});
  };

  const formatActionText = (action: string) => {
switch (action.toLowerCase()) {
  case 'authorize':
return 'New Authorization';
  case 'resolve':
return 'Identity Resolved';
  case 'revoke':
return 'Access Revoked';
  case 'assign_context':
return 'Context Assigned';
  default:
return action;
}
  };

  return (
<Card withBorder radius='md' p='md' h='100%'>
  <Group gap='sm' mb='md'>
<IconActivity size={20} color='var(--mantine-color-brand-6)' />
<Title order={3} c='gray.8'>
  Activity Timeline
</Title>
{!loading && recentActivities.length > 0 && (
  <Badge variant='light' color='gray' size='sm'>
{recentActivities.length} recent
  </Badge>
)}
  </Group>

  {loading ? (
<Stack gap='sm'>
  <Skeleton height={50} />
  <Skeleton height={50} />
  <Skeleton height={50} />
</Stack>
  ) : recentActivities.length === 0 ? (
<Text size='sm' c='gray.6' ta='center' py='xl'>
  No activity yet. OAuth operations will appear here.
</Text>
  ) : (
<ScrollArea h={300}>
  <Timeline bulletSize={24} lineWidth={2}>
{recentActivities.slice(0, 10).map((activity, index) => (
  <Timeline.Item
key={index}
bullet={getActionIcon(activity.action, activity.success)}
title={
  <Group gap='xs'>
<Text size='sm' fw={500}>
  {formatActionText(activity.action)}
</Text>
{!activity.success && (
  <Badge size='xs' color='red' variant='light'>
Failed
  </Badge>
)}
  </Group>
}
  >
<Text size='xs' c='dimmed'>
  {activity.app_name}
</Text>
<Text size='xs' c='dimmed'>
  {formatTimeAgo(activity.created_at)}
</Text>
  </Timeline.Item>
))}
  </Timeline>
</ScrollArea>
  )}

  {!loading && recentActivities.length > 0 && (
<Text size='xs' c='dimmed' ta='center' mt='md'>
  Showing last {Math.min(10, recentActivities.length)} operations
</Text>
  )}
</Card>
  );
}
