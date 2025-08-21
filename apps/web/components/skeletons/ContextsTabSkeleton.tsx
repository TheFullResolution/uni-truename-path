'use client';

import { Card, Grid, Group, Skeleton, Stack } from '@mantine/core';

/**
 * Contexts tab skeleton that mirrors the contexts tab layout
 * Left side: Context creation form
 * Right side: Context list
 */
export function ContextsTabSkeleton() {
  return (
<Grid pt='xl'>
  {/* Create Context Form Skeleton */}
  <Grid.Col span={{ base: 12, lg: 5 }}>
<Card p='xl' shadow='sm' withBorder radius='lg'>
  <Stack gap='md'>
{/* Form title */}
<Skeleton height={24} width='60%' radius='sm' />

{/* Context name input */}
<Stack gap='xs'>
  <Skeleton height={16} width='40%' radius='sm' />
  <Skeleton height={36} radius='sm' />
</Stack>

{/* Description input */}
<Stack gap='xs'>
  <Skeleton height={16} width='35%' radius='sm' />
  <Skeleton height={72} radius='sm' />
</Stack>

{/* Submit button */}
<Skeleton height={36} width='100%' radius='sm' />
  </Stack>
</Card>
  </Grid.Col>

  {/* Context List Skeleton */}
  <Grid.Col span={{ base: 12, lg: 7 }}>
<Card p='xl' shadow='sm' withBorder radius='lg'>
  <Stack gap='lg'>
{/* List header */}
<Group justify='space-between'>
  <Skeleton height={24} width='40%' radius='sm' />
  <Skeleton height={32} width={80} radius='sm' />
</Group>

{/* Context items */}
{[1, 2, 3].map((item) => (
  <Card key={item} p='md' withBorder radius='md'>
<Stack gap='sm'>
  <Group justify='space-between' align='flex-start'>
<Stack gap='xs' style={{ flex: 1 }}>
  <Skeleton height={20} width='70%' radius='sm' />
  <Skeleton height={16} width='90%' radius='sm' />
  <Skeleton height={14} width='40%' radius='sm' />
</Stack>
<Group gap='xs'>
  <Skeleton height={28} width={60} radius='sm' />
  <Skeleton height={28} width={60} radius='sm' />
</Group>
  </Group>
</Stack>
  </Card>
))}
  </Stack>
</Card>
  </Grid.Col>
</Grid>
  );
}
