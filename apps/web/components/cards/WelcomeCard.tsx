import {
  Card,
  Group,
  Box,
  Title,
  Text,
  SimpleGrid,
  Skeleton,
} from '@mantine/core';
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
  })
: 'Unknown';

  return (
<Card withBorder radius='md' p='md'>
  <Group gap='md' mb='xl'>
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
<Box>
  <Title order={2} c='gray.8' mb='xs'>
OAuth Integration Dashboard
  </Title>
  <Text size='sm' c='gray.6'>
{user?.email || 'Unknown user'}
  </Text>
</Box>
  </Group>

  <SimpleGrid cols={3} spacing='md'>
<Box>
  {loading ? (
<Skeleton height={28} width={40} />
  ) : (
<Text size='xl' fw={600} c='brand.7'>
  {stats?.oauth_metrics?.connected_apps || 0}
</Text>
  )}
  <Text size='xs' c='gray.6'>
Connected Apps
  </Text>
</Box>
<Box>
  {loading ? (
<Skeleton height={28} width={40} />
  ) : (
<Text size='xl' fw={600} c='blue.7'>
  {stats?.oauth_metrics?.recent_authorizations || 0}
</Text>
  )}
  <Text size='xs' c='gray.6'>
Recent Authorizations
  </Text>
</Box>
<Box>
  {loading ? (
<Skeleton height={28} width={40} />
  ) : (
<Text size='xl' fw={600} c='green.7'>
  {stats?.oauth_metrics?.total_usage || 0}
</Text>
  )}
  <Text size='xs' c='gray.6'>
Total API Usage
  </Text>
</Box>
  </SimpleGrid>

  <Group gap='xs' mt='xl'>
<Text size='xs' c='gray.6'>
  Member since
</Text>
{loading ? (
  <Skeleton height={14} width={80} />
) : (
  <Text size='xs' c='gray.6'>
{memberSince}
  </Text>
)}
  </Group>
</Card>
  );
}
