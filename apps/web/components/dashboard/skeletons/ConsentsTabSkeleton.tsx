'use client';

import { Skeleton, Grid, Card, Stack, Group } from '@mantine/core';

/**
 * Consents tab skeleton that mirrors the consent management layout
 * GDPR-compliant consent interface
 */
export function ConsentsTabSkeleton() {
  return (
<Grid pt='xl'>
  <Grid.Col span={12}>
<Card p='xl' shadow='sm' withBorder radius='lg'>
  <Stack gap='lg'>
{/* Header */}
<Stack gap='xs'>
  <Skeleton height={28} width='45%' radius='sm' />
  <Skeleton height={16} width='90%' radius='sm' />
</Stack>

{/* Consent management interface */}
<Grid>
  {/* Active consents */}
  <Grid.Col span={{ base: 12, md: 6 }}>
<Card p='lg' withBorder radius='md'>
  <Stack gap='md'>
<Group justify='space-between'>
  <Skeleton height={20} width='50%' radius='sm' />
  <Skeleton height={24} width={60} radius='sm' />
</Group>

{[1, 2].map((item) => (
  <Card
key={item}
p='md'
withBorder
radius='sm'
bg='green.0'
  >
<Stack gap='sm'>
  <Group justify='space-between'>
<Skeleton height={18} width='60%' radius='sm' />
<Skeleton height={16} width={50} radius='sm' />
  </Group>
  <Skeleton height={14} width='80%' radius='sm' />
  <Group gap='xs'>
<Skeleton height={12} width='40%' radius='sm' />
<Skeleton height={12} width='50%' radius='sm' />
  </Group>
</Stack>
  </Card>
))}
  </Stack>
</Card>
  </Grid.Col>

  {/* Pending consent requests */}
  <Grid.Col span={{ base: 12, md: 6 }}>
<Card p='lg' withBorder radius='md'>
  <Stack gap='md'>
<Group justify='space-between'>
  <Skeleton height={20} width='60%' radius='sm' />
  <Skeleton height={24} width={70} radius='sm' />
</Group>

{[1].map((item) => (
  <Card
key={item}
p='md'
withBorder
radius='sm'
bg='yellow.0'
  >
<Stack gap='sm'>
  <Group justify='space-between'>
<Skeleton height={18} width='55%' radius='sm' />
<Skeleton height={16} width={60} radius='sm' />
  </Group>
  <Skeleton height={14} width='90%' radius='sm' />
  <Group gap='xs'>
<Skeleton height={28} width={60} radius='sm' />
<Skeleton height={28} width={60} radius='sm' />
  </Group>
</Stack>
  </Card>
))}
  </Stack>
</Card>
  </Grid.Col>
</Grid>

{/* Privacy controls */}
<Card p='lg' withBorder radius='md' bg='blue.0'>
  <Stack gap='md'>
<Skeleton height={20} width='40%' radius='sm' />
<Group gap='lg'>
  <Stack gap='xs' style={{ flex: 1 }}>
<Skeleton height={16} width='70%' radius='sm' />
<Skeleton height={32} width='100%' radius='sm' />
  </Stack>
  <Stack gap='xs' style={{ flex: 1 }}>
<Skeleton height={16} width='60%' radius='sm' />
<Skeleton height={32} width='100%' radius='sm' />
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
