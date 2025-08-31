'use client';

import { Box, Container, Group, Anchor } from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import Link from 'next/link';
import type { Route } from 'next';
import { LogoWithText } from '@/components/branding/LogoWithText';
import { SignOutButton } from './SignOutButton';
import { useAuth } from '@/utils/context';

export function ClientAppNavigation() {
  const { isAuthenticated } = useAuth();

  return (
<Box
  className='navigation-blur'
  pos='sticky'
  top={0}
  style={{ zIndex: 100 }}
>
  <Container size='lg' py='sm'>
<Group justify='space-between' align='center'>
  <Anchor
component={Link}
href={'/' as Route}
underline='never'
display='flex'
style={{ alignItems: 'center' }}
  >
<LogoWithText size='md' />
  </Anchor>

  <Group gap='lg' align='center'>
<Anchor
  c='gray.6'
  size='sm'
  fw={500}
  td='none'
  style={{
cursor: 'not-allowed',
opacity: 0.6,
  }}
>
  <Group gap='xs' align='center'>
<IconBook size={16} />
Documentation
  </Group>
</Anchor>

{isAuthenticated && <SignOutButton />}
  </Group>
</Group>
  </Container>
</Box>
  );
}
