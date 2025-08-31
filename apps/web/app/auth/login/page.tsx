'use client';

import { Logo } from '@/components/branding/Logo';
import { LogoWithText } from '@/components/branding/LogoWithText';
import { LoginForm } from '@/components/forms/LoginForm';
import { useAuth } from '@/utils/context';
import { Box, Center, Container, Paper, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect } from 'react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  // Handle redirect logic
  useEffect(() => {
if (!loading && isAuthenticated) {
  // User is already authenticated, redirect them
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  router.replace(returnUrl as Route);
}
  }, [isAuthenticated, loading, router, searchParams]);

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

  {/* Centered single-column layout */}
  <Box
p={{ base: 'xl', md: '3rem' }}
style={{ maxWidth: '450px', margin: '0 auto' }}
  >
<Title order={2} c='gray.8' mb='md' ta='center'>
  Welcome Back
</Title>

<Text size='md' c='gray.6' ta='center' mb='xl'>
  Sign in to manage your context-aware identity
</Text>

{/* Integrated LoginForm component */}
<LoginForm
  onSuccess={handleLoginSuccess}
  onForgotPassword={handleForgotPassword}
  onCreateAccount={handleCreateAccount}
  showCreateAccount={true}
/>
  </Box>
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
