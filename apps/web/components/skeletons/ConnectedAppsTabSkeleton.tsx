'use client';

import { Card, Grid, Group, Skeleton, Stack } from '@mantine/core';

/**
 * Connected Apps tab skeleton that mirrors the connected apps panel layout
 * Shows grid of app cards with name, domain, context, and action buttons
 */
export function ConnectedAppsTabSkeleton() {
  return (
<Stack gap='lg'>
  {/* Header skeleton */}
  <div>
<Skeleton height={32} width='35%' radius='sm' mb='xs' />
<Skeleton height={16} width='85%' radius='sm' />
  </div>

  {/* Connected apps grid skeleton */}
  <Grid>
{[1, 2, 3, 4, 5, 6].map((item) => (
  <Grid.Col key={item} span={{ base: 12, md: 6, lg: 4 }}>
<Card p='md' withBorder>
  <Stack gap='sm'>
{/* App name, domain, and context badges */}
<Group gap='xs' align='center' mb={4}>
  <Skeleton height={20} width='50%' radius='sm' />
  <Skeleton height={20} width={60} radius='sm' />
  <Skeleton height={20} width={70} radius='sm' />
</Group>

{/* Context dropdown and revoke button */}
<Group justify='space-between' align='center'>
  <Skeleton height={36} width='60%' radius='sm' />
  <Skeleton height={36} width={80} radius='sm' />
</Group>
  </Stack>
</Card>
  </Grid.Col>
))}
  </Grid>
</Stack>
  );
}
