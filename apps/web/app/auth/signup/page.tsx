'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
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
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconShield, IconLock } from '@tabler/icons-react';
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

  router.replace(returnUrl as Route);
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
// Create the Supabase account with email/password and metadata
// The enhanced signup trigger will automatically process the metadata
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
// Store OIDC name properties for database trigger processing
given_name: step2Data.given_name,
family_name: step2Data.family_name,
display_name: step2Data.display_name,
nickname: step2Data.nickname,
preferred_username: step2Data.preferred_username,
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

// Success! The database trigger handles name creation automatically
notifications.show({
  title: 'Welcome to TrueNamePath!',
  message: 'Account created successfully with your name variants',
  color: 'green',
  autoClose: 5000,
});

const returnUrl = searchParams.get('returnUrl') || '/dashboard';
router.replace(returnUrl as Route);
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

router.push(loginUrl as Route);
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
  Get Started
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
  Create Your Account
</Title>
<Text c='gray.6' size='lg' mb='xl'>
  Take control of how your identity appears across different
  contexts.
</Text>

{/* Key Benefits */}
<Box
  style={{
backgroundColor: 'rgba(74, 127, 231, 0.08)',
border: '1px solid rgba(74, 127, 231, 0.15)',
borderRadius: '12px',
padding: '24px',
  }}
  mb='xl'
>
  <Title order={3} c='brand.7' mb='md' size='h4'>
<IconShield size={20} style={{ marginRight: '8px' }} />
What You Get
  </Title>
  <List
spacing='sm'
size='sm'
c='gray.7'
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
<List.Item>Context-aware name management</List.Item>
<List.Item>Privacy-first design</List.Item>
<List.Item>Complete control over your identity</List.Item>
  </List>
</Box>

{/* Privacy Statement */}
<Box
  style={{
backgroundColor: 'rgba(46, 204, 113, 0.08)',
border: '1px solid rgba(46, 204, 113, 0.15)',
borderRadius: '12px',
padding: '20px',
  }}
  mb='xl'
>
  <Title order={3} c='green.7' mb='sm' size='h5'>
<IconLock size={18} style={{ marginRight: '8px' }} />
Your Privacy is Protected
  </Title>
  <Text size='sm' c='gray.7'>
GDPR compliant with full audit trails. You maintain complete
control over how your name appears in different contexts.
  </Text>
</Box>

{/* Academic Project Info */}
<Box
  style={{
backgroundColor: 'rgba(52, 152, 219, 0.08)',
border: '1px solid rgba(52, 152, 219, 0.15)',
borderRadius: '12px',
padding: '16px',
  }}
>
  <Badge variant='light' color='blue' size='sm' mb='xs'>
Academic Demo
  </Badge>
  <Text size='xs' c='gray.7'>
University project demonstrating advanced identity
management concepts.
  </Text>
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
