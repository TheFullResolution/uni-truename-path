'use client';

import { useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import {
  Container,
  Grid,
  Paper,
  Title,
  Text,
  Box,
  List,
  Center,
  Group,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconApi, IconRocket, IconBuilding } from '@tabler/icons-react';
import { LoginForm } from '@/components/forms/LoginForm';
import { useAuth } from '@/utils/context';
import { LogoWithText } from '@/components/branding/LogoWithText';
import { Logo } from '@/components/branding/Logo';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, loading } = useAuth();

  // Handle redirect logic
  useEffect(() => {
if (!loading && isAuthenticated) {
  // User is already authenticated, redirect them
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  notifications.show({
title: 'Already signed in',
message: `Welcome back, ${user?.email || 'user'}!`,
color: 'blue',
autoClose: 2000,
  });

  router.replace(returnUrl as Route);
}
  }, [isAuthenticated, loading, user, router, searchParams]);

  // Handle successful login
  const handleLoginSuccess = useCallback(() => {
const returnUrl = searchParams.get('returnUrl') || '/dashboard';

router.replace(returnUrl as Route);
  }, [router, searchParams]);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
notifications.show({
  title: 'Forgot Password',
  message: 'Password reset functionality is coming soon.',
  color: 'blue',
  autoClose: 4000,
});
  }, []);

  // Handle create account navigation
  const handleCreateAccount = useCallback(() => {
const returnUrl = searchParams.get('returnUrl');
const signupUrl = returnUrl
  ? `/auth/signup?returnUrl=${encodeURIComponent(returnUrl)}`
  : '/auth/signup';

router.push(signupUrl as Route);
  }, [router, searchParams]);

  // Show loading state while checking authentication
  if (loading) {
return (
  <Box bg='gray.0' style={{ minHeight: '100vh' }}>
<Container size='lg' py='xl'>
  <Center style={{ minHeight: '60vh' }}>
<Box style={{ textAlign: 'center' }}>
  <Box mb='lg'>
<LogoWithText size='md' />
  </Box>
  <Text size='sm' c='dimmed'>
Checking authentication...
  </Text>
</Box>
  </Center>
</Container>
  </Box>
);
  }

  // Don't render login form if user is authenticated (redirect is in progress)
  if (isAuthenticated) {
return null;
  }

  return (
<Box
  style={{
minHeight: '100vh',
background:
  'linear-gradient(135deg, rgba(74, 127, 231, 0.05) 0%, rgba(195, 217, 247, 0.1) 100%)',
  }}
>
  <Container size='lg' py='xl'>
<Paper
  shadow='lg'
  radius='lg'
  style={{ overflow: 'hidden', backgroundColor: 'white' }}
>
  {/* Brand Header */}
  <Box
py='xl'
px='xl'
style={{
  textAlign: 'center',
  background:
'linear-gradient(135deg, rgba(74, 127, 231, 0.08) 0%, rgba(195, 217, 247, 0.15) 100%)',
  borderBottom: '1px solid rgba(74, 127, 231, 0.1)',
}}
  >
<Center mb='md'>
  <Logo size='xl' />
</Center>
<Title order={1} size='h2' fw={600} c='brand.8'>
  TrueNamePath
</Title>
<Text size='lg' c='gray.7'>
  Context-Aware Identity Management
</Text>
  </Box>

  {/* Two-column layout */}
  <Grid gutter={0} style={{ minHeight: '500px' }}>
{/* Left Panel - Marketing Content */}
<Grid.Col
  span={{ base: 12, md: 6 }}
  style={{
backgroundColor: '#f8f9fa',
borderRight: '1px solid #dee2e6',
  }}
>
  <Box p='xl'>
<Title order={2} c='gray.8' mb='xs'>
  Welcome to TrueNamePath
</Title>
<Text c='gray.6' size='lg' mb='lg'>
  &quot;Context-Aware Identity API for the Modern Web&quot;
</Text>

<Group gap='xs' mb='md'>
  <IconApi size={20} color='#4A7FE7' />
  <Title order={3} c='gray.7' size='h4'>
Enterprise-Ready Identity API
  </Title>
</Group>
<List
  spacing='xs'
  size='sm'
  c='gray.7'
  mb='xl'
  styles={{
itemWrapper: {
  alignItems: 'flex-start',
},
itemIcon: {
  color: '#4A7FE7',
  marginTop: '2px',
},
  }}
>
  <List.Item>
Powered by Supabase with enterprise authentication
  </List.Item>
  <List.Item>
RESTful API with secure cookie-based session management
  </List.Item>
  <List.Item>
Edge Functions for real-time name resolution
  </List.Item>
  <List.Item>
GDPR-compliant with comprehensive audit trails
  </List.Item>
</List>

{/* Developer highlight box */}
<Box
  style={{
backgroundColor: 'rgba(74, 127, 231, 0.1)',
border: '1px solid rgba(74, 127, 231, 0.2)',
borderRadius: '8px',
padding: '16px',
  }}
  mb='md'
>
  <Group gap='xs' mb='xs'>
<IconRocket size={16} color='#4A7FE7' />
<Text fw={600} size='sm' c='brand.7'>
  For Developers
</Text>
  </Group>
  <Text size='xs' c='gray.7'>
RESTful API integration with secure cookie-based sessions.
Standard claims, no proprietary APIs. Edge Functions handle
the complexity - you get clean, context-aware names.
  </Text>
</Box>

{/* Enterprise highlight box */}
<Box
  style={{
backgroundColor: 'rgba(46, 204, 113, 0.1)',
border: '1px solid rgba(46, 204, 113, 0.2)',
borderRadius: '8px',
padding: '16px',
  }}
  mb='xl'
>
  <Group gap='xs' mb='xs'>
<IconBuilding size={16} color='#27ae60' />
<Text fw={600} size='sm' c='green.7'>
  For Enterprises
</Text>
  </Group>
  <Text size='xs' c='gray.7'>
Enterprise-ready authentication. GDPR compliant by design.
Seamless integration with existing infrastructure. No major
architecture changes required.
  </Text>
</Box>
  </Box>
</Grid.Col>

{/* Right Panel - Login Form */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <Box p='xl'>
<Title order={2} c='gray.8' mb='xl'>
  Sign In
</Title>

{/* Integrated LoginForm component */}
<LoginForm
  onSuccess={handleLoginSuccess}
  onForgotPassword={handleForgotPassword}
  onCreateAccount={handleCreateAccount}
  showCreateAccount={true}
/>
  </Box>
</Grid.Col>
  </Grid>
</Paper>
  </Container>
</Box>
  );
}

export default function LoginPage() {
  return (
<Suspense
  fallback={
<Box bg='gray.0' style={{ minHeight: '100vh' }}>
  <Container size='lg' py='xl'>
<Center style={{ minHeight: '60vh' }}>
  <Box style={{ textAlign: 'center' }}>
<Box mb='lg'>
  <LogoWithText size='md' />
</Box>
<Text size='sm' c='dimmed'>
  Loading...
</Text>
  </Box>
</Center>
  </Container>
</Box>
  }
>
  <LoginPageContent />
</Suspense>
  );
}
