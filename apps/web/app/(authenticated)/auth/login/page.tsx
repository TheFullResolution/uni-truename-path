'use client';

import { Logo } from '@/components/branding/Logo';
import { LogoWithText } from '@/components/branding/LogoWithText';
import { LoginForm } from '@/components/forms/LoginForm';
import { useAuth } from '@/utils/context';
import {
  Box,
  Center,
  Container,
  Paper,
  Text,
  Title,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect } from 'react';
import { IconCheck, IconInfoCircle } from '@tabler/icons-react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  const isFromSignup = searchParams.get('signup') === 'success';

  useEffect(() => {
if (!loading && isAuthenticated) {
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  router.replace(returnUrl as Route);
}
  }, [isAuthenticated, loading, router, searchParams]);

  const handleLoginSuccess = useCallback(() => {
const returnUrl = searchParams.get('returnUrl') || '/dashboard';

router.replace(returnUrl as Route);
  }, [router, searchParams]);

  const handleForgotPassword = useCallback(() => {
notifications.show({
  title: 'Password Reset',
  message: 'Password reset functionality is coming soon.',
  color: 'blue',
  icon: <IconInfoCircle size={16} />,
  autoClose: 4000,
});
  }, []);

  const handleCreateAccount = useCallback(() => {
const returnUrl = searchParams.get('returnUrl');
const signupUrl = returnUrl
  ? `/auth/signup?returnUrl=${encodeURIComponent(returnUrl)}`
  : '/auth/signup';

router.push(signupUrl as Route);
  }, [router, searchParams]);

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

  <Box
p={{ base: 'xl', md: '3rem' }}
style={{ maxWidth: '450px', margin: '0 auto' }}
  >
<Title order={2} c='gray.8' mb='md' ta='center'>
  {isFromSignup ? 'Welcome to TrueNamePath!' : 'Welcome Back'}
</Title>

{isFromSignup && (
  <Alert
variant='light'
color='green'
icon={<IconCheck size={16} />}
mb='xl'
styles={{
  root: {
backgroundColor: 'rgba(46, 204, 113, 0.1)',
border: '1px solid rgba(46, 204, 113, 0.3)',
  },
}}
  >
<Text size='sm' fw={500}>
  Account created successfully! Please log in with your new
  credentials.
</Text>
  </Alert>
)}

<Text size='md' c='gray.6' ta='center' mb='xl'>
  {isFromSignup
? 'Use your email and password to sign in'
: 'Sign in to manage your context-aware identity'}
</Text>

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
