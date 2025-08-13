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
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconTarget,
  IconShield,
  IconTool,
  IconLock,
  IconEye,
  IconBook,
} from '@tabler/icons-react';
import { SignupForm } from '../../../components/SignupForm';
import { useAuth } from '../../../lib/context/AuthProvider';

function SignupPageContent() {
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

  // Handle successful signup
  const handleSignupSuccess = useCallback(() => {
const returnUrl = searchParams.get('returnUrl') || '/dashboard';

// Small delay to let the success notification show
setTimeout(() => {
  router.replace(returnUrl);
}, 1000);
  }, [router, searchParams]);

  // Handle back to login navigation
  const handleBackToLogin = useCallback(() => {
const returnUrl = searchParams.get('returnUrl');
const loginUrl = returnUrl
  ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
  : '/auth/login';

router.push(loginUrl);
  }, [router, searchParams]);

  // Handle demo navigation
  const handleViewDemo = useCallback(() => {
router.push('/demo');
  }, [router]);

  // Handle privacy policy (placeholder)
  const handlePrivacyPolicy = useCallback(() => {
notifications.show({
  title: 'Privacy Policy',
  message:
'Privacy Policy documentation is available in the project repository.',
  color: 'blue',
  autoClose: 4000,
});
  }, []);

  // Handle API documentation (placeholder)
  const handleApiDocs = useCallback(() => {
notifications.show({
  title: 'API Documentation',
  message: 'OpenAPI 3.1 documentation will be available after Step 17.',
  color: 'blue',
  autoClose: 4000,
});
  }, []);

  // Show loading state while checking authentication
  if (loading) {
return (
  <Box bg='gray.0' style={{ minHeight: '100vh' }}>
<Container size='lg' py='xl'>
  <Center style={{ minHeight: '60vh' }}>
<Box style={{ textAlign: 'center' }}>
  <IconTarget
size={48}
color='#27ae60'
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

  // Don't render signup form if user is authenticated (redirect is in progress)
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
  {/* Green Header for Signup */}
  <Box
bg='green.5'
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
  Create Your Account
</Text>
  </Box>

  {/* Two-column layout */}
  <Grid gutter={0} style={{ minHeight: '600px' }}>
{/* Left Panel - Privacy & Features Content */}
<Grid.Col
  span={{ base: 12, md: 6 }}
  style={{
backgroundColor: '#f8f9fa',
borderRight: '1px solid #dee2e6',
  }}
>
  <Box p='xl'>
<Title order={2} c='gray.8' mb='xs'>
  Your Privacy Matters
</Title>
<Text c='gray.6' size='lg' mb='lg'>
  We believe you should control how your name appears in
  different contexts.
</Text>

{/* Privacy by Design section */}
<Box
  style={{
backgroundColor: 'rgba(40, 167, 69, 0.1)',
border: '1px solid rgba(40, 167, 69, 0.2)',
borderRadius: '8px',
padding: '20px',
  }}
  mb='xl'
>
  <Title order={3} c='green.7' mb='md' size='h4'>
<IconShield size={20} style={{ marginRight: '8px' }} />
What you get:
  </Title>
  <List
spacing='xs'
size='sm'
c='gray.7'
mb='md'
styles={{
  itemWrapper: {
alignItems: 'flex-start',
  },
  itemIcon: {
color: '#28a745',
marginTop: '2px',
  },
}}
  >
<List.Item>Multiple name variants per context</List.Item>
<List.Item>Granular consent management</List.Item>
<List.Item>Complete audit trail</List.Item>
<List.Item>GDPR data portability</List.Item>
<List.Item>Context-aware name resolution</List.Item>
  </List>
</Box>

{/* Privacy by Design section */}
<Title order={3} c='gray.7' mb='md' size='h4'>
  <IconLock size={20} style={{ marginRight: '8px' }} />
  Privacy by Design
</Title>
<Text size='sm' c='gray.7' mb='xl'>
  GDPR compliant from day one. Context detection automatically
  adapts while you maintain full control over name disclosure.
  Built-in audit trails for compliance.
</Text>

{/* Enterprise Security section */}
<Title order={3} c='gray.7' mb='md' size='h4'>
  <IconTool size={20} style={{ marginRight: '8px' }} />
  Enterprise Security
</Title>
<Text size='sm' c='gray.7' mb='xl'>
  Built on Supabase&apos;s enterprise-grade infrastructure with
  Edge Functions. Standard JWT implementation means no
  proprietary integrations required.
</Text>

{/* Academic Project Badge */}
<Box
  style={{
backgroundColor: 'rgba(52, 152, 219, 0.1)',
border: '1px solid rgba(52, 152, 219, 0.2)',
borderRadius: '8px',
padding: '16px',
  }}
  mb='xl'
>
  <Badge variant='light' color='blue' size='sm' mb='xs'>
University Project
  </Badge>
  <Text size='xs' c='gray.7'>
This is a demonstration project for CM3035 Advanced Web
Design, showcasing context-aware identity management
capabilities.
  </Text>
</Box>

{/* Action buttons */}
<Box>
  <Title order={3} c='gray.7' mb='md' size='h4'>
Learn More
  </Title>

  <Button
variant='subtle'
color='green'
fullWidth
mb='xs'
justify='flex-start'
leftSection={<IconEye size={16} />}
onClick={handleViewDemo}
styles={{
  root: {
'height': 'auto',
'padding': '12px 16px',
'whiteSpace': 'normal',
'&:hover': {
  backgroundColor: 'rgba(40, 167, 69, 0.1)',
},
  },
  inner: {
justifyContent: 'flex-start',
  },
}}
  >
<Box style={{ textAlign: 'left' }}>
  <Text fw={600} size='sm'>
Try Live Demo
  </Text>
  <Text size='xs' c='gray.6'>
See context-aware name resolution in action
  </Text>
</Box>
  </Button>

  <Button
variant='subtle'
color='gray'
fullWidth
mb='xs'
justify='flex-start'
leftSection={<IconShield size={16} />}
onClick={handlePrivacyPolicy}
styles={{
  root: {
'height': 'auto',
'padding': '12px 16px',
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
View Privacy Policy
  </Text>
  <Text size='xs' c='gray.6'>
GDPR-compliant privacy practices
  </Text>
</Box>
  </Button>

  <Button
variant='subtle'
color='gray'
fullWidth
justify='flex-start'
leftSection={<IconBook size={16} />}
onClick={handleApiDocs}
styles={{
  root: {
'height': 'auto',
'padding': '12px 16px',
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
API Documentation
  </Text>
  <Text size='xs' c='gray.6'>
RESTful API with JWT authentication
  </Text>
</Box>
  </Button>
</Box>
  </Box>
</Grid.Col>

{/* Right Panel - Signup Form */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <Box p='xl'>
<Title order={2} c='gray.8' mb='xl'>
  Create Account
</Title>

{/* Integrated SignupForm component */}
<SignupForm
  onSuccess={handleSignupSuccess}
  onBackToLogin={handleBackToLogin}
  showBackToLogin={true}
/>
  </Box>
</Grid.Col>
  </Grid>
</Paper>
  </Container>
</Box>
  );
}

export default function SignupPage() {
  return (
<Suspense
  fallback={
<Box bg='gray.0' style={{ minHeight: '100vh' }}>
  <Container size='lg' py='xl'>
<Center style={{ minHeight: '60vh' }}>
  <Box style={{ textAlign: 'center' }}>
<IconTarget
  size={48}
  color='#27ae60'
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
  <SignupPageContent />
</Suspense>
  );
}
