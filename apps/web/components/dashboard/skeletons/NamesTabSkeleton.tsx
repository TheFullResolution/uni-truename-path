'use client';

import { Skeleton, Grid, Card, Stack, Group } from '@mantine/core';

/**
 * Names tab skeleton that mirrors the names tab layout
 * Left side: Name creation form
 * Right side: Name management list
 */
export function NamesTabSkeleton() {
  return (
<Grid pt='xl'>
  {/* Name Creation Form Skeleton */}
  <Grid.Col span={{ base: 12, lg: 5 }}>
<Card p='xl' shadow='sm' withBorder radius='lg'>
  <Stack gap='md'>
{/* Form title */}
<Skeleton height={24} width='50%' radius='sm' />

{/* Full name input */}
<Stack gap='xs'>
  <Skeleton height={16} width='35%' radius='sm' />
  <Skeleton height={36} radius='sm' />
</Stack>

{/* Category select */}
<Stack gap='xs'>
  <Skeleton height={16} width='30%' radius='sm' />
  <Skeleton height={36} radius='sm' />
</Stack>

{/* Pronunciation input */}
<Stack gap='xs'>
  <Skeleton height={16} width='45%' radius='sm' />
  <Skeleton height={36} radius='sm' />
</Stack>

{/* Cultural context input */}
<Stack gap='xs'>
  <Skeleton height={16} width='50%' radius='sm' />
  <Skeleton height={36} radius='sm' />
</Stack>

{/* Submit button */}
<Skeleton height={36} width='100%' radius='sm' />
  </Stack>
</Card>
  </Grid.Col>

  {/* Name Management Skeleton */}
  <Grid.Col span={{ base: 12, lg: 7 }}>
<Card p='xl' shadow='sm' withBorder radius='lg'>
  <Stack gap='lg'>
{/* List header */}
<Group justify='space-between'>
  <Skeleton height={24} width='35%' radius='sm' />
  <Skeleton height={32} width={80} radius='sm' />
</Group>

{/* Name variant items */}
{[1, 2, 3, 4].map((item) => (
  <Card key={item} p='md' withBorder radius='md'>
<Stack gap='sm'>
  <Group justify='space-between' align='flex-start'>
<Stack gap='xs' style={{ flex: 1 }}>
  <Skeleton height={20} width='60%' radius='sm' />
  <Group gap='xs'>
<Skeleton height={16} width={60} radius='sm' />
<Skeleton height={16} width={80} radius='sm' />
  </Group>
  <Skeleton height={14} width='45%' radius='sm' />
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
