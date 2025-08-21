'use client';

import { useAuth } from '@/utils/context';
import { Button, Group, Skeleton } from '@mantine/core';
import { IconArrowRight, IconDashboard } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function AuthButtons() {
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
setMounted(true);
  }, []);

  // Show skeleton while loading or not mounted (prevents hydration mismatch)
  if (!mounted || loading) {
return (
  <Group gap='lg'>
<Skeleton height={48} width={140} radius='sm' />
<Skeleton height={48} width={100} radius='sm' />
  </Group>
);
  }

  // Authenticated: Show dashboard button
  if (isAuthenticated) {
return (
  <Button
component={Link}
href='/dashboard'
size='lg'
color='brand'
variant='filled'
rightSection={<IconDashboard size={20} />}
  >
View Dashboard
  </Button>
);
  }

  // Not authenticated: Show signup and login buttons
  return (
<Group gap='lg'>
  <Button
component={Link}
href='/auth/signup'
size='lg'
color='brand'
variant='filled'
rightSection={<IconArrowRight size={20} />}
  >
Get Started
  </Button>
  <Button
component={Link}
href='/auth/login'
size='lg'
variant='outline'
color='brand'
  >
Sign In
  </Button>
</Group>
  );
}
