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
import { IconShield, IconLock } from '@tabler/icons-react';
import {
  SignupStep1Form,
  type SignupStep1Data,
} from '@/components/forms/SignupStep1Form';
import { SignupStep2Form } from '@/components/forms/SignupStep2Form';
import { useAuth } from '@/utils/context';
import { LogoWithText } from '@/components/branding/LogoWithText';
import { Logo } from '@/components/branding/Logo';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<SignupStep1Data | null>(null);

  useEffect(() => {
if (!loading && isAuthenticated) {
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  router.replace(returnUrl as Route);
}
  }, [isAuthenticated, loading, router, searchParams]);

  const handleStep1Complete = useCallback((data: SignupStep1Data) => {
setStep1Data(data);
setCurrentStep(2);
  }, []);

  const handleStep2Complete = useCallback(() => {
const returnUrl = searchParams.get('returnUrl') || '/dashboard';
router.replace(returnUrl as Route);
  }, [router, searchParams]);

  const handleBackToStep1 = useCallback(() => {
setCurrentStep(1);
  }, []);

  const handleBackToLogin = useCallback(() => {
const returnUrl = searchParams.get('returnUrl');
const loginUrl = returnUrl
  ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
  : '/auth/login';

router.push(loginUrl as Route);
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
  Get Started
</Text>
  </Box>

  <Grid gutter={0} style={{ minHeight: '600px' }}>
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

<Grid.Col span={{ base: 12, md: 6 }}>
  <Box p='xl'>
<Title order={2} c='gray.8' mb='xl'>
  Create Account
</Title>

{currentStep === 1 ? (
  <SignupStep1Form
onStepComplete={handleStep1Complete}
onBackToLogin={handleBackToLogin}
showBackToLogin={true}
loading={loading}
  />
) : (
  step1Data && (
<SignupStep2Form
  step1Data={step1Data}
  onComplete={handleStep2Complete}
  onBack={handleBackToStep1}
/>
  )
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
