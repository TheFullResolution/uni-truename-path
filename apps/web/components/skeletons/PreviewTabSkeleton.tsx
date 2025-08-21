'use client';

import { Card, Grid, Group, Skeleton, Stack } from '@mantine/core';

/**
 * Preview tab skeleton that mirrors the assignment preview layout
 * Shows how names appear in different contexts
 */
export function PreviewTabSkeleton() {
  return (
<Grid pt='xl'>
  <Grid.Col span={12}>
<Card p='xl' shadow='sm' withBorder radius='lg'>
  <Stack gap='lg'>
{/* Header */}
<Stack gap='xs'>
  <Skeleton height={28} width='50%' radius='sm' />
  <Skeleton height={16} width='85%' radius='sm' />
</Stack>

{/* Preview cards */}
{[1, 2, 3].map((item) => (
  <Card key={item} p='lg' withBorder radius='md' bg='blue.0'>
<Stack gap='md'>
  {/* Context header */}
  <Group justify='space-between'>
<Stack gap='xs'>
  <Skeleton height={20} width='40%' radius='sm' />
  <Skeleton height={14} width='60%' radius='sm' />
</Stack>
<Skeleton height={24} width={60} radius='sm' />
  </Group>

  {/* Name display */}
  <Card p='md' bg='white' radius='sm'>
<Group justify='space-between'>
  <Stack gap='xs'>
<Skeleton height={24} width='70%' radius='sm' />
<Skeleton height={16} width='50%' radius='sm' />
  </Stack>
  <Skeleton height={32} width={80} radius='sm' />
</Group>
  </Card>

  {/* Context details */}
  <Group gap='md'>
<Stack gap='xs' style={{ flex: 1 }}>
  <Skeleton height={14} width='35%' radius='sm' />
  <Skeleton height={16} width='80%' radius='sm' />
</Stack>
<Stack gap='xs' style={{ flex: 1 }}>
  <Skeleton height={14} width='40%' radius='sm' />
  <Skeleton height={16} width='60%' radius='sm' />
</Stack>
  </Group>
</Stack>
  </Card>
))}

{/* Summary section */}
<Card p='md' withBorder radius='md' bg='green.0'>
  <Stack gap='sm'>
<Skeleton height={18} width='40%' radius='sm' />
<Group gap='lg'>
  <Stack gap='xs' style={{ flex: 1 }}>
<Skeleton height={14} width='50%' radius='sm' />
<Skeleton height={20} width='30%' radius='sm' />
  </Stack>
  <Stack gap='xs' style={{ flex: 1 }}>
<Skeleton height={14} width='60%' radius='sm' />
<Skeleton height={20} width='40%' radius='sm' />
  </Stack>
</Group>
  </Stack>
</Card>
  </Stack>
</Card>
  </Grid.Col>
</Grid>
  );
}
