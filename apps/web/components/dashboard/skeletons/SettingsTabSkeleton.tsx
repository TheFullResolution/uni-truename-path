'use client';

import { Skeleton, Grid, Card, Stack, Group } from '@mantine/core';

/**
 * Settings tab skeleton that mirrors the settings panel layout
 * User preferences and account management
 */
export function SettingsTabSkeleton() {
  return (
<Grid pt='xl'>
  <Grid.Col span={12}>
<Stack gap='lg'>
  {/* Account settings */}
  <Card p='xl' shadow='sm' withBorder radius='lg'>
<Stack gap='lg'>
  <Skeleton height={24} width='40%' radius='sm' />

  <Grid>
<Grid.Col span={{ base: 12, md: 6 }}>
  <Stack gap='md'>
<Stack gap='xs'>
  <Skeleton height={16} width='30%' radius='sm' />
  <Skeleton height={36} radius='sm' />
</Stack>
<Stack gap='xs'>
  <Skeleton height={16} width='25%' radius='sm' />
  <Skeleton height={36} radius='sm' />
</Stack>
  </Stack>
</Grid.Col>

<Grid.Col span={{ base: 12, md: 6 }}>
  <Stack gap='md'>
<Stack gap='xs'>
  <Skeleton height={16} width='35%' radius='sm' />
  <Skeleton height={36} radius='sm' />
</Stack>
<Stack gap='xs'>
  <Skeleton height={16} width='40%' radius='sm' />
  <Skeleton height={36} radius='sm' />
</Stack>
  </Stack>
</Grid.Col>
  </Grid>

  <Group justify='flex-end'>
<Skeleton height={36} width={120} radius='sm' />
  </Group>
</Stack>
  </Card>

  {/* Privacy preferences */}
  <Card p='xl' shadow='sm' withBorder radius='lg'>
<Stack gap='lg'>
  <Skeleton height={24} width='45%' radius='sm' />

  {[1, 2, 3].map((item) => (
<Group key={item} justify='space-between' p='md'>
  <Stack gap='xs' style={{ flex: 1 }}>
<Skeleton height={18} width='60%' radius='sm' />
<Skeleton height={14} width='80%' radius='sm' />
  </Stack>
  <Skeleton height={24} width={44} radius='sm' />
</Group>
  ))}
</Stack>
  </Card>

  {/* Notification settings */}
  <Card p='xl' shadow='sm' withBorder radius='lg'>
<Stack gap='lg'>
  <Skeleton height={24} width='50%' radius='sm' />

  {[1, 2, 3, 4].map((item) => (
<Group key={item} justify='space-between' p='md'>
  <Stack gap='xs' style={{ flex: 1 }}>
<Skeleton height={18} width='55%' radius='sm' />
<Skeleton height={14} width='75%' radius='sm' />
  </Stack>
  <Skeleton height={24} width={44} radius='sm' />
</Group>
  ))}
</Stack>
  </Card>

  {/* Danger zone */}
  <Card
p='xl'
shadow='sm'
withBorder
radius='lg'
style={{ borderColor: 'var(--mantine-color-red-3)' }}
  >
<Stack gap='lg'>
  <Skeleton height={24} width='35%' radius='sm' />

  <Group justify='space-between' p='md'>
<Stack gap='xs' style={{ flex: 1 }}>
  <Skeleton height={18} width='40%' radius='sm' />
  <Skeleton height={14} width='90%' radius='sm' />
</Stack>
<Skeleton height={36} width={100} radius='sm' />
  </Group>
</Stack>
  </Card>
</Stack>
  </Grid.Col>
</Grid>
  );
}
