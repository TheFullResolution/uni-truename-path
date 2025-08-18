import {
  Paper,
  Group,
  Title,
  Text,
  Center,
  Box,
  Badge,
  Skeleton,
} from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';

interface PrivacyScoreCardProps {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}

/**
 * Privacy Score Card Component
 *
 * Displays the user's privacy score with color-coded scoring and GDPR compliance status.
 * Shows a large privacy score (0-100) with appropriate color coding:
 * - Green (>=70): Good privacy score
 * - Yellow (>=50): Fair privacy score
 * - Red (<50): Poor privacy score
 *
 * Also displays GDPR compliance badge with appropriate status.
 */
export default function PrivacyScoreCard({
  stats,
  loading,
}: PrivacyScoreCardProps) {
  const privacyScore = stats?.privacy_metrics.privacy_score || 0;
  const isCompliant =
stats?.privacy_metrics.gdpr_compliance_status === 'compliant';
  return (
<Paper p='xl' shadow='md' radius='lg' style={{ height: '100%' }}>
  <Group gap='sm' mb='md'>
<IconLock size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Privacy Score
</Title>
  </Group>
  <Center mb='xl'>
{loading ? (
  <Skeleton circle height={80} />
) : (
  <Box ta='center'>
<Text
  size='40'
  fw={700}
  c={
privacyScore >= 70
  ? 'green.6'
  : privacyScore >= 50
? 'yellow.6'
: 'red.6'
  }
>
  {privacyScore}
</Text>
<Text size='xs' c='gray.6'>
  out of 100
</Text>
  </Box>
)}
  </Center>
  <Badge
variant='light'
color={loading ? 'gray' : isCompliant ? 'green' : 'yellow'}
fullWidth
size='lg'
  >
{loading
  ? 'Loading...'
  : isCompliant
? 'GDPR Compliant'
: 'Needs Attention'}
  </Badge>
</Paper>
  );
}
