import {
  Container,
  Text,
  Box,
  Group,
  Divider,
  Anchor,
  Stack,
} from '@mantine/core';
import { IconSchool, IconCode } from '@tabler/icons-react';
import Link from 'next/link';
import type { Route } from 'next';
import { LogoWithText } from '@/components/branding/LogoWithText';
import { getServerAuth } from '@/utils/auth/server-auth';

export async function SharedFooter() {
  const { isAuthenticated } = await getServerAuth();
  const currentYear = new Date().getFullYear();

  return (
<Box className='footer-background' py='xl'>
  <Container size='lg'>
<Stack gap='xl'>
  <Group justify='space-between' align='flex-start'>
<Stack gap='md' maw={400}>
  <Box p='sm' className='footer-logo-container'>
<LogoWithText size='md' />
  </Box>
  <Text size='sm' c='gray.3' lh={1.5}>
Context-aware identity management that puts you in control.
Present the right name to the right audience, every time.
  </Text>
</Stack>

<Stack gap='sm'>
  <Text size='sm' fw={600} c='white' mb='xs'>
Quick Links
  </Text>
  {!isAuthenticated ? (
<>
  <Anchor
component={Link}
href={'/auth/signup' as Route}
size='sm'
c='gray.3'
td='none'
className='footer-link'
  >
Get Started
  </Anchor>
  <Anchor
component={Link}
href={'/auth/login' as Route}
size='sm'
c='gray.3'
td='none'
className='footer-link'
  >
Sign In
  </Anchor>
</>
  ) : (
<>
  <Anchor
component={Link}
href={'/dashboard' as Route}
size='sm'
c='gray.3'
td='none'
className='footer-link'
  >
Dashboard
  </Anchor>
  <Anchor
component={Link}
href={'/dashboard/settings' as Route}
size='sm'
c='gray.3'
td='none'
className='footer-link'
  >
Settings
  </Anchor>
</>
  )}
  <Anchor
size='sm'
c='gray.3'
style={{
  textDecoration: 'none',
  cursor: 'not-allowed',
  opacity: 0.6,
}}
  >
Documentation
  </Anchor>
</Stack>
  </Group>

  <Divider color='gray.6' />

  <Stack gap='md'>
<Group justify='center' gap='xs'>
  <IconSchool size={16} color='#4A7FE7' />
  <Text size='sm' c='gray.3' fw={500}>
Built with{' '}
<Text component='span' c='#e74c3c' fw={600}>
  passion
</Text>{' '}
at University of London
  </Text>
</Group>

<Text size='xs' c='gray.4' ta='center'>
  CM3070 BSc Computer Science Final Project • {currentYear}
</Text>

<Group justify='center' gap='xs' pt='sm'>
  <IconCode size={14} color='#4A7FE7' />
  <Text size='xs' c='gray.4' ta='center' fs='italic'>
Demonstrating advanced web design principles with context-aware
identity management
  </Text>
</Group>

<Text size='xs' c='gray.5' ta='center' pt='md'>
  © {currentYear} TrueNamePath. Academic project for educational
  purposes.
</Text>
  </Stack>
</Stack>
  </Container>
</Box>
  );
}
