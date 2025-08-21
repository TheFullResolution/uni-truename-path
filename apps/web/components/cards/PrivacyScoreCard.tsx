import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import {
  Badge,
  Box,
  Center,
  Group,
  Paper,
  Skeleton,
  Text,
  Title,
} from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

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
export function PrivacyScoreCard({ stats, loading }: PrivacyScoreCardProps) {
  // Use privacy score from stats or calculate fallback
  const privacyScore = loading
? 0
: stats?.privacy_metrics?.privacy_score ||
  Math.min(
100,
Math.max(
  0,
  (stats?.context_statistics?.active_consents || 0) * 10 +
(stats?.context_statistics?.custom_contexts || 0) * 5 +
50,
),
  );

  const isCompliant = privacyScore >= 70;

  return (
<Paper withBorder radius='md' p='xl'>
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
