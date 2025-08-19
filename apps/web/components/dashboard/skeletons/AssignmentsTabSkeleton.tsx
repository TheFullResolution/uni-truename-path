'use client';

import { Skeleton, Grid, Card, Stack, Group } from '@mantine/core';

/**
 * Assignments tab skeleton that mirrors the context assignment panel layout
 * Assignment interface for mapping names to contexts
 */
export function AssignmentsTabSkeleton() {
  return (
<Grid pt='xl'>
  <Grid.Col span={12}>
<Card p='xl' shadow='sm' withBorder radius='lg'>
  <Stack gap='lg'>
{/* Header */}
<Group justify='space-between'>
  <Stack gap='xs'>
<Skeleton height={28} width='60%' radius='sm' />
<Skeleton height={16} width='80%' radius='sm' />
  </Stack>
  <Skeleton height={32} width={100} radius='sm' />
</Group>

{/* Assignment interface */}
<Grid>
  {/* Left side - Names list */}
  <Grid.Col span={{ base: 12, md: 6 }}>
<Card p='lg' withBorder radius='md'>
  <Stack gap='md'>
<Skeleton height={20} width='40%' radius='sm' />

{[1, 2, 3].map((item) => (
  <Group key={item} justify='space-between' p='sm'>
<Stack gap='xs' style={{ flex: 1 }}>
  <Skeleton height={18} width='70%' radius='sm' />
  <Skeleton height={14} width='50%' radius='sm' />
</Stack>
<Skeleton height={24} width={24} radius='sm' />
  </Group>
))}
  </Stack>
</Card>
  </Grid.Col>

  {/* Right side - Contexts assignment */}
  <Grid.Col span={{ base: 12, md: 6 }}>
<Card p='lg' withBorder radius='md'>
  <Stack gap='md'>
<Skeleton height={20} width='50%' radius='sm' />

{[1, 2, 3].map((item) => (
  <Group key={item} justify='space-between' p='sm'>
<Stack gap='xs' style={{ flex: 1 }}>
  <Skeleton height={18} width='65%' radius='sm' />
  <Skeleton height={14} width='40%' radius='sm' />
</Stack>
<Skeleton height={32} width={80} radius='sm' />
  </Group>
))}
  </Stack>
</Card>
  </Grid.Col>
</Grid>

{/* Assignment summary */}
<Card p='md' withBorder radius='md' bg='gray.0'>
  <Stack gap='sm'>
<Skeleton height={18} width='45%' radius='sm' />
<Skeleton height={16} width='90%' radius='sm' />
<Skeleton height={16} width='70%' radius='sm' />
  </Stack>
</Card>
  </Stack>
</Card>
  </Grid.Col>
</Grid>
  );
}
