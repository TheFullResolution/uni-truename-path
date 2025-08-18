import {
  Paper,
  Group,
  Box,
  Title,
  Text,
  SimpleGrid,
  Skeleton,
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';

import { DashboardUser } from '@/types/ui';
import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';

interface WelcomeCardProps {
  user: DashboardUser | null;
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

export default function WelcomeCard({
  user,
  stats,
  loading,
}: WelcomeCardProps) {
  const memberSince = stats?.user_profile?.member_since
? new Date(stats.user_profile.member_since).toLocaleDateString()
: 'Unknown';

  return (
<Paper p='xl' shadow='md' radius='lg' style={{ height: '100%' }}>
  <Group gap='md' mb='xl'>
<Box
  style={{
width: 60,
height: 60,
borderRadius: '50%',
background:
  'linear-gradient(135deg, rgba(74, 127, 231, 0.1) 0%, rgba(195, 217, 247, 0.2) 100%)',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
  }}
>
  <IconUser size={24} color='#4A7FE7' />
</Box>
<Box>
  <Title order={2} c='gray.8' mb='xs'>
Welcome back!
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
  {stats?.name_statistics.total_names || 0}
</Text>
  )}
  <Text size='xs' c='gray.6'>
Name Variants
  </Text>
</Box>
<Box>
  {loading ? (
<Skeleton height={28} width={40} />
  ) : (
<Text size='xl' fw={600} c='blue.7'>
  {stats?.context_statistics.custom_contexts || 0}
</Text>
  )}
  <Text size='xs' c='gray.6'>
Custom Contexts
  </Text>
</Box>
<Box>
  {loading ? (
<Skeleton height={28} width={40} />
  ) : (
<Text size='xl' fw={600} c='green.7'>
  {stats?.activity_metrics.total_api_calls || 0}
</Text>
  )}
  <Text size='xs' c='gray.6'>
API Calls
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
</Paper>
  );
}
