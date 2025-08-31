import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import {
  Badge,
  Group,
  Card,
  Skeleton,
  Text,
  Title,
  Stack,
  ScrollArea,
} from '@mantine/core';
import { IconActivity, IconCheck, IconX } from '@tabler/icons-react';

interface OAuthActivityCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

/**
 * OAuth Activity Card Component
 *
 * Displays recent OAuth operations and activity timeline.
 * Shows recent API calls, authorizations, and their success/failure status.
 * Provides a real-time view of OAuth integration activity.
 */
export function OAuthActivityCard({ stats, loading }: OAuthActivityCardProps) {
  const recentActivity = stats?.oauth_metrics?.recent_activity || [];
  const hasActivity = recentActivity.length > 0;

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

  return (
<Card withBorder radius='md' p='md' data-testid='oauth-activity-card'>
  <Group gap='sm' mb='md'>
<IconActivity size={20} color='var(--mantine-color-brand-6)' />
<Title order={3} c='gray.8'>
  OAuth Activity
</Title>
  </Group>

  {loading ? (
<Stack gap='sm'>
  <Skeleton height={20} />
  <Skeleton height={20} width='80%' />
  <Skeleton height={20} width='60%' />
</Stack>
  ) : hasActivity ? (
<ScrollArea h={150}>
  <Stack gap='xs'>
{recentActivity.slice(0, 5).map((activity, index) => (
  <Group key={index} justify='space-between' align='center'>
<Group gap='xs'>
  {activity.success ? (
<IconCheck size={14} color='green' />
  ) : (
<IconX size={14} color='red' />
  )}
  <Text fz='sm' truncate maw='120px'>
{activity.app_name}
  </Text>
  <Badge size='xs' variant='light' color='blue'>
{activity.action}
  </Badge>
</Group>
<Text fz='xs' c='dimmed'>
  {formatTimeAgo(activity.created_at)}
</Text>
  </Group>
))}
  </Stack>
</ScrollArea>
  ) : (
<Text fz='sm' c='dimmed' ta='center' py='md'>
  No OAuth activity yet
</Text>
  )}

  <Badge
variant='light'
color={hasActivity ? 'green' : 'gray'}
fullWidth
size='lg'
mt='md'
data-testid='active-sessions-count'
  >
{loading
  ? 'Loading activity...'
  : hasActivity
? `${recentActivity.length} recent operations`
: 'Waiting for first OAuth integration'}
  </Badge>
</Card>
  );
}
