'use client';

import {
  Box,
  Container,
  Grid,
  Group,
  Paper,
  Skeleton,
  Tabs,
} from '@mantine/core';

export function DashboardSkeleton() {
  return (
<Box bg='gray.0'>
  <Container size='xl' py='md'>
{/* Header Skeleton */}
<Paper p='xl' mb='xl' shadow='lg' radius='lg'>
  <Group justify='space-between' align='center'>
<Group>
  <Skeleton height={40} width={40} radius='md' />
  <Box>
<Skeleton height={32} width={250} mb='xs' />
<Skeleton height={16} width={200} />
  </Box>
</Group>
<Skeleton height={36} width={100} />
  </Group>
</Paper>

{/* Navigation Tabs Skeleton */}
<Paper p='md' mb='xl' shadow='md' radius='lg'>
  <Tabs value='dashboard'>
<Tabs.List>
  <Skeleton height={42} width={120} mr='md' />
  <Skeleton height={42} width={100} mr='md' />
  <Skeleton height={42} width={80} mr='md' />
  <Skeleton height={42} width={110} mr='md' />
  <Skeleton height={42} width={90} mr='md' />
  <Skeleton height={42} width={100} mr='md' />
  <Skeleton height={42} width={90} />
</Tabs.List>

{/* Content Skeleton */}
<Box pt='xl'>
  <Grid>
{/* Welcome Card Skeleton */}
<Grid.Col span={{ base: 12, md: 8 }}>
  <Paper p='xl' shadow='sm' withBorder radius='lg'>
<Skeleton height={24} width={200} mb='md' />
<Skeleton height={16} width='100%' mb='xs' />
<Skeleton height={16} width='80%' mb='lg' />
<Group>
  <Skeleton height={32} width={80} />
  <Skeleton height={32} width={100} />
</Group>
  </Paper>
</Grid.Col>

{/* Privacy Score Card Skeleton */}
<Grid.Col span={{ base: 12, md: 4 }}>
  <Paper p='xl' shadow='sm' withBorder radius='lg'>
<Skeleton height={20} width={150} mb='md' />
<Skeleton height={48} width={80} mb='sm' />
<Skeleton height={14} width='100%' />
  </Paper>
</Grid.Col>

{/* API Usage Card Skeleton */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <Paper p='xl' shadow='sm' withBorder radius='lg'>
<Skeleton height={20} width={120} mb='md' />
<Group mb='sm'>
  <Skeleton height={32} width={60} />
  <Skeleton height={16} width={80} />
</Group>
<Skeleton height={14} width='90%' />
  </Paper>
</Grid.Col>

{/* Name Variants Card Skeleton */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <Paper p='xl' shadow='sm' withBorder radius='lg'>
<Skeleton height={20} width={140} mb='md' />
<Group mb='sm'>
  <Skeleton height={32} width={40} />
  <Skeleton height={16} width={100} />
</Group>
<Skeleton height={14} width='85%' />
  </Paper>
</Grid.Col>

{/* Recent Activity Card Skeleton */}
<Grid.Col span={12}>
  <Paper p='xl' shadow='sm' withBorder radius='lg'>
<Skeleton height={20} width={160} mb='lg' />
{[...Array(3)].map((_, i) => (
  <Group key={i} mb='md'>
<Skeleton height={40} width={40} radius='md' />
<Box flex={1}>
  <Skeleton height={16} width='70%' mb='xs' />
  <Skeleton height={12} width='50%' />
</Box>
<Skeleton height={12} width={80} />
  </Group>
))}
  </Paper>
</Grid.Col>
  </Grid>
</Box>
  </Tabs>
</Paper>

{/* Footer Skeleton */}
<Paper p='lg' shadow='sm' withBorder radius='lg'>
  <Skeleton height={12} width={300} mx='auto' mb='xs' />
  <Skeleton height={12} width={250} mx='auto' />
</Paper>
  </Container>
</Box>
  );
}
