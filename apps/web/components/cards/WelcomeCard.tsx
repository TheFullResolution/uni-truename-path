import { Card, Group, Box, Title, Text, Badge, Skeleton } from '@mantine/core';
import { IconPlug } from '@tabler/icons-react';

import { DashboardUser } from '@/types/ui';
import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';

interface WelcomeCardProps {
  user: DashboardUser | null;
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export function WelcomeCard({ user, stats, loading }: WelcomeCardProps) {
  const memberSince = stats?.user_profile?.member_since
? new Date(stats.user_profile.member_since).toLocaleDateString('en-US', {
year: 'numeric',
month: 'long',
day: 'numeric',
  })
: 'Unknown';

  const connectedApps = stats?.oauth_metrics?.connected_apps || 0;

  return (
<Card withBorder radius='md' p='lg'>
  <Group gap='md' align='center'>
<Box
  className='icon-gradient-container'
  w={60}
  h={60}
  style={{
borderRadius: '50%',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
  }}
>
  <IconPlug size={24} color='var(--mantine-color-brand-6)' />
</Box>
<Box style={{ flex: 1 }}>
  <Title order={2} c='gray.8' mb='xs'>
Welcome to TrueNamePath
  </Title>
  <Group gap='sm'>
<Text size='sm' c='gray.6'>
  {user?.email || 'Unknown user'}
</Text>
{loading ? (
  <Skeleton height={20} width={100} />
) : (
  connectedApps > 0 && (
<Badge variant='light' color='blue'>
  {connectedApps} {connectedApps === 1 ? 'app' : 'apps'}{' '}
  connected
</Badge>
  )
)}
  </Group>
  <Text size='xs' c='dimmed' mt='xs'>
Member since {loading ? '...' : memberSince}
  </Text>
</Box>
  </Group>
</Card>
  );
}
