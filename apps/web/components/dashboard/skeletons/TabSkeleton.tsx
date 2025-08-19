'use client';

import { Skeleton, Grid, Card, Stack } from '@mantine/core';

/**
 * Base tab skeleton component that provides a foundation for all tab loading states
 */
export function TabSkeleton() {
  return (
<Grid pt='xl'>
  <Grid.Col span={12}>
<Card p='xl' shadow='sm' withBorder radius='lg'>
  <Stack gap='md'>
<Skeleton height={28} radius='sm' />
<Skeleton height={20} width='60%' radius='sm' />
<Skeleton height={16} width='80%' radius='sm' />
  </Stack>
</Card>
  </Grid.Col>
</Grid>
  );
}
