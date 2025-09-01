import { Box, Container, Group, Button, Anchor } from '@mantine/core';
import { IconBook, IconLogin, IconDashboard } from '@tabler/icons-react';
import Link from 'next/link';
import type { Route } from 'next';
import { LogoWithText } from '@/components/branding/LogoWithText';
import { getServerAuth } from '@/utils/auth/server-auth';

export async function HomeNavigation() {
  const { isAuthenticated } = await getServerAuth();

  return (
<Box
  className='navigation-blur'
  pos='sticky'
  top={0}
  style={{ zIndex: 100 }}
>
  <Container size='lg' py='sm'>
<Group justify='space-between' align='center'>
  {/* Logo */}
  <Anchor
component={Link}
href={'/' as Route}
underline='never'
display='flex'
style={{ alignItems: 'center' }}
  >
<LogoWithText size='md' />
  </Anchor>

  {/* Navigation Links & Auth */}
  <Group gap='lg' align='center'>
{/* Documentation Link */}
<Anchor
  component={Link}
  href={'/docs' as Route}
  c='gray.6'
  size='sm'
  fw={500}
  td='none'
>
  <Group gap='xs' align='center'>
<IconBook size={16} />
Documentation
  </Group>
</Anchor>

{/* Auth Buttons */}
{isAuthenticated ? (
  <Button
component={Link}
href={'/dashboard' as Route}
variant='light'
color='brand'
leftSection={<IconDashboard size={16} />}
size='md'
  >
Dashboard
  </Button>
) : (
  <Group gap='sm'>
<Button
  component={Link}
  href={'/auth/login' as Route}
  variant='subtle'
  color='brand'
  leftSection={<IconLogin size={16} />}
  size='md'
>
  Sign In
</Button>
<Button
  component={Link}
  href={'/auth/signup' as Route}
  color='brand'
  size='md'
>
  Get Started
</Button>
  </Group>
)}
  </Group>
</Group>
  </Container>
</Box>
  );
}
