'use client';

import { useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Grid,
  Paper,
  Title,
  Text,
  Box,
  List,
  Button,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTarget } from '@tabler/icons-react';
import { LoginForm } from '../../../components/LoginForm';
import { useAuth } from '../../../lib/context/AuthProvider';

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

  router.replace(returnUrl);
}
  }, [isAuthenticated, loading, user, router, searchParams]);

  // Handle successful login
  const handleLoginSuccess = useCallback(() => {
const returnUrl = searchParams.get('returnUrl') || '/dashboard';

// Small delay to let the success notification show
setTimeout(() => {
  router.replace(returnUrl);
}, 1000);
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

router.push(signupUrl);
  }, [router, searchParams]);

  // Show loading state while checking authentication
  if (loading) {
return (
  <Box bg='gray.0' style={{ minHeight: '100vh' }}>
<Container size='lg' py='xl'>
  <Center style={{ minHeight: '60vh' }}>
<Box style={{ textAlign: 'center' }}>
  <IconTarget
size={48}
color='#3498db'
style={{ marginBottom: '1rem' }}
  />
  <Title order={2} c='gray.7' mb='md'>
TrueNamePath
  </Title>
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
<Box bg='gray.0' style={{ minHeight: '100vh' }}>
  <Container size='lg' py='xl'>
<Paper
  shadow='md'
  radius='md'
  style={{ overflow: 'hidden', backgroundColor: 'white' }}
>
  {/* Blue Header */}
  <Box
bg='blue.5'
py='lg'
px='xl'
style={{ textAlign: 'center', color: 'white' }}
  >
<Center mb='xs'>
  <IconTarget size={32} />
</Center>
<Title order={1} size='h2' fw={600}>
  TrueNamePath
</Title>
<Text size='lg' opacity={0.9}>
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

<Title order={3} c='gray.7' mb='md' size='h4'>
  🔗 Enterprise-Ready Identity API:
</Title>
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
  color: '#3498db',
  marginTop: '2px',
},
  }}
>
  <List.Item>
Powered by Supabase with enterprise authentication
  </List.Item>
  <List.Item>
RESTful API with comprehensive JWT token handling
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
backgroundColor: 'rgba(52, 152, 219, 0.1)',
border: '1px solid rgba(52, 152, 219, 0.2)',
borderRadius: '8px',
padding: '16px',
  }}
  mb='md'
>
  <Text fw={600} size='sm' mb='xs' c='blue.7'>
🚀 For Developers:
  </Text>
  <Text size='xs' c='gray.7'>
RESTful API integration with JWT authentication. Standard
claims, no proprietary APIs. Edge Functions handle the
complexity - you get clean, context-aware names.
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
  <Text fw={600} size='sm' mb='xs' c='green.7'>
🏢 For Enterprises:
  </Text>
  <Text size='xs' c='gray.7'>
Enterprise-ready authentication. GDPR compliant by design.
Seamless integration with existing infrastructure. No major
architecture changes required.
  </Text>
</Box>

{/* Demo section */}
<Box>
  <Title order={3} c='gray.7' mb='md' size='h4'>
🚀 Try Live Examples
  </Title>

  <Button
variant='subtle'
color='gray'
fullWidth
mb='xs'
justify='flex-start'
onClick={() => router.push('/demo')}
styles={{
  root: {
'height': 'auto',
'padding': '15px',
'whiteSpace': 'normal',
'&:hover': {
  backgroundColor: '#e9ecef',
},
  },
  inner: {
justifyContent: 'flex-start',
  },
}}
  >
<Box style={{ textAlign: 'left' }}>
  <Text fw={600} size='sm'>
👨‍💻 JJ&apos;s Slack Integration
  </Text>
  <Text size='xs' c='gray.6'>
Team context: Automatically serves &quot;JJ&quot; for
casual team communication
  </Text>
</Box>
  </Button>

  <Button
variant='subtle'
color='gray'
fullWidth
mb='xs'
justify='flex-start'
onClick={() => router.push('/demo')}
styles={{
  root: {
'height': 'auto',
'padding': '15px',
'whiteSpace': 'normal',
'&:hover': {
  backgroundColor: '#e9ecef',
},
  },
  inner: {
justifyContent: 'flex-start',
  },
}}
  >
<Box style={{ textAlign: 'left' }}>
  <Text fw={600} size='sm'>
🏢 JJ&apos;s HR System Access
  </Text>
  <Text size='xs' c='gray.6'>
Legal context: Automatically serves &quot;Jędrzej
Lewandowski&quot; for HiBob
  </Text>
</Box>
  </Button>

  <Button
variant='subtle'
color='gray'
fullWidth
mb='xs'
justify='flex-start'
onClick={() => router.push('/demo')}
styles={{
  root: {
'height': 'auto',
'padding': '15px',
'whiteSpace': 'normal',
'&:hover': {
  backgroundColor: '#e9ecef',
},
  },
  inner: {
justifyContent: 'flex-start',
  },
}}
  >
<Box style={{ textAlign: 'left' }}>
  <Text fw={600} size='sm'>
💻 JJ&apos;s GitHub Profile
  </Text>
  <Text size='xs' c='gray.6'>
Professional context: Automatically serves &quot;J.
Lewandowski&quot; for code contributions
  </Text>
</Box>
  </Button>
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
<IconTarget
  size={48}
  color='#3498db'
  style={{ marginBottom: '1rem' }}
/>
<Title order={2} c='gray.7' mb='md'>
  TrueNamePath
</Title>
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
