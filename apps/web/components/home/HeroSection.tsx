import {
  Container,
  Title,
  Text,
  Stack,
  Box,
  Button,
  Group,
} from '@mantine/core';
import { IconArrowRight, IconDashboard } from '@tabler/icons-react';
import Link from 'next/link';
import type { Route } from 'next';
import { LogoWithText } from '@/components/branding/LogoWithText';
import { getServerAuth } from '@/utils/auth/server-auth';

export async function HeroSection() {
  const { isAuthenticated } = await getServerAuth();

  return (
<Box
  className='hero-gradient-background'
  display='flex'
  style={{ alignItems: 'center' }}
>
  <Container size='lg' py='xl'>
<Stack gap='xl' align='center' ta='center'>
  {/* Logo */}
  <Box pt='xl'>
<LogoWithText size='xl' />
  </Box>

  {/* Main Tagline */}
  <Stack gap='md' maw={800}>
<Title
  order={1}
  size='3.5rem'
  fw={700}
  lh={1.1}
  className='hero-text-gradient'
>
  Your Identity, Your Rules
</Title>

<Text size='xl' c='gray.6' fw={400} lh={1.4}>
  The first context-aware identity management API that ensures the{' '}
  <Text component='span' c='brand.6' fw={600}>
right name
  </Text>{' '}
  appears to the{' '}
  <Text component='span' c='brand.6' fw={600}>
right audience
  </Text>{' '}
  every time.
</Text>
  </Stack>

  {/* Subtitle */}
  <Text size='lg' c='gray.5' maw={600} ta='center'>
Stop forcing your identity into rigid systems. TrueNamePath gives
you complete control over how your name appears across different
platforms and contexts.
  </Text>

  {/* CTA Buttons */}
  <Box pt='md'>
{isAuthenticated ? (
  <Button
component={Link}
href={'/dashboard' as Route}
size='lg'
color='brand'
leftSection={<IconDashboard size={20} />}
  >
View Dashboard
  </Button>
) : (
  <Group gap='lg' justify='center'>
<Button
  component={Link}
  href={'/auth/signup' as Route}
  size='lg'
  color='brand'
  rightSection={<IconArrowRight size={20} />}
>
  Get Started Free
</Button>
<Button
  component={Link}
  href={'/auth/login' as Route}
  size='lg'
  variant='outline'
  color='brand'
>
  Sign In
</Button>
  </Group>
)}
  </Box>

  {/* Trust Indicator */}
  <Text size='sm' c='dimmed' ta='center' pt='xl'>
GDPR Compliant • OAuth 2.0 Compatible • Privacy by Design
  </Text>
</Stack>
  </Container>
</Box>
  );
}
