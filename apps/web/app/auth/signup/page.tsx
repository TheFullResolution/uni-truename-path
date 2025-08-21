'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
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
import { IconShield, IconTool, IconLock, IconBook } from '@tabler/icons-react';
import {
  SignupStep1Form,
  type SignupStep1Data,
} from '@/components/forms/SignupStep1Form';
import {
  SignupStep2Form,
  type SignupStep2Data,
} from '@/components/forms/SignupStep2Form';
import { useAuth } from '@/utils/context';
import { LogoWithText } from '@/components/branding/LogoWithText';
import { Logo } from '@/components/branding/Logo';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, loading } = useAuth();

  // Two-step signup state management
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<SignupStep1Data | null>(null);
  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

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

  // Handle step 1 completion (email/password/consent)
  const handleStep1Complete = useCallback((data: SignupStep1Data) => {
setStep1Data(data);
setCurrentStep(2);
setStep2Error(null);
  }, []);

  // Handle step 2 completion (OIDC name properties)
  const handleStep2Complete = useCallback(
async (step2Data: SignupStep2Data) => {
  if (!step1Data) {
setStep2Error('Step 1 data is missing. Please start over.');
return;
  }

  setStep2Loading(true);
  setStep2Error(null);

  try {
// First, create the Supabase account with email/password
const { createClient } = await import('@/utils/supabase/client');
const supabase = createClient();

const { data: authData, error: authError } = await supabase.auth.signUp(
  {
email: step1Data.email,
password: step1Data.password,
options: {
  data: {
// Store consent data in user metadata
agreeToTerms: step1Data.agreeToTerms,
consentToProcessing: step1Data.consentToProcessing,
allowMarketing: step1Data.allowMarketing || false,
  },
},
  },
);

if (authError) {
  setStep2Error(authError.message);
  return;
}

if (!authData.user) {
  setStep2Error('Account creation failed. Please try again.');
  return;
}

// Wait for the session to be established before calling the API
// This ensures the authentication middleware can recognize the user
await new Promise((resolve) => setTimeout(resolve, 1000));

// Verify session is established
const {
  data: { session },
} = await supabase.auth.getSession();
if (!session) {
  setStep2Error(
'Session not established. Please try logging in manually.',
  );
  return;
}

// Then, complete the signup with OIDC name properties
const response = await fetch('/api/auth/complete-signup', {
  method: 'POST',
  headers: {
'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(step2Data),
});

const result = await response.json();

if (!response.ok) {
  setStep2Error(result.message || 'Failed to complete registration');
  return;
}

// Success! Show notification and redirect
notifications.show({
  title: 'Welcome to TrueNamePath!',
  message: `Account created successfully with ${result.data.created_names.length} name variants`,
  color: 'green',
  autoClose: 5000,
});

const returnUrl = searchParams.get('returnUrl') || '/dashboard';
router.replace(returnUrl);
  } catch (error) {
const errorMessage =
  error instanceof Error
? error.message
: 'An unexpected error occurred';
setStep2Error(errorMessage);
  } finally {
setStep2Loading(false);
  }
},
[step1Data, router, searchParams],
  );

  // Handle back to step 1
  const handleBackToStep1 = useCallback(() => {
setCurrentStep(1);
setStep2Error(null);
  }, []);

  // Handle back to login navigation
  const handleBackToLogin = useCallback(() => {
const returnUrl = searchParams.get('returnUrl');
const loginUrl = returnUrl
  ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
  : '/auth/login';

router.push(loginUrl);
  }, [router, searchParams]);

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

  // Don't render signup form if user is authenticated (redirect is in progress)
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
backgroundColor: 'rgba(74, 127, 231, 0.1)',
border: '1px solid rgba(74, 127, 231, 0.2)',
borderRadius: '8px',
padding: '20px',
  }}
  mb='xl'
>
  <Title order={3} c='brand.7' mb='md' size='h4'>
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
color: '#4A7FE7',
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
  Edge Functions. Standard cookie-based session management means
  no proprietary integrations required.
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
RESTful API with secure session management
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

{/* Two-Step Signup Flow */}
{currentStep === 1 ? (
  <SignupStep1Form
onStepComplete={handleStep1Complete}
onBackToLogin={handleBackToLogin}
showBackToLogin={true}
loading={loading}
  />
) : (
  <SignupStep2Form
onComplete={handleStep2Complete}
onBack={handleBackToStep1}
loading={step2Loading}
error={step2Error}
  />
)}
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
  <SignupPageContent />
</Suspense>
  );
}
