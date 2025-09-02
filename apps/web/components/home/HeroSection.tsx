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
import Image from 'next/image';
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
  Context-Aware Identity Management
</Title>

<Text size='xl' c='gray.6' fw={400} lh={1.4}>
  A university research project demonstrating how identity
  management systems could provide{' '}
  <Text component='span' c='brand.6' fw={600}>
context-specific name presentation
  </Text>{' '}
  based on{' '}
  <Text component='span' c='brand.6' fw={600}>
user-configured rules
  </Text>
  .
</Text>
  </Stack>

  {/* Subtitle */}
  <Text size='lg' c='gray.5' maw={600} ta='center'>
Academic prototype exploring the technical feasibility of
audience-specific identity management using existing infrastructure
in a novel configuration.
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
  View Demo
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
  <Group justify='center' gap='xs' pt='xl'>
<Image
  src='/University_of_London.svg.png'
  alt='University of London Logo'
  width={19}
  height={25}
  style={{ verticalAlign: 'middle' }}
/>
<Text size='sm' c='dimmed' ta='center'>
  Academic Project • CM3035 Advanced Web Design • University of
  London
</Text>
  </Group>
</Stack>
  </Container>
</Box>
  );
}
