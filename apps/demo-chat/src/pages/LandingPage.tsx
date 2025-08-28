/**
 * Landing Page Component - ChatSpace Authentication
 * Handles OAuth flow initiation for TrueNamePath integration with casual chat context
 */

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Center,
  Box,
  Alert,
  Image,
} from '@mantine/core';
import { oauthClient } from '@/services/oauth';
import { brandGradient } from '@/theme';

export const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
try {
  setIsLoading(true);
  setError(null);

  const result = await oauthClient.initiateAuthFlow();
  if (!result.success) {
setError('Authentication failed');
  }
} catch {
  setError('Authentication failed');
} finally {
  setIsLoading(false);
}
  };

  return (
<Box
  h='100vh'
  style={{
background: brandGradient,
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
  }}
>
  <Container size='sm'>
<Center>
  <Stack
align='center'
gap='xl'
maw={{ base: 400, sm: 500 }}
ta='center'
c='white'
  >
{/* Professional Logo Integration */}
<Box
  style={{
position: 'relative',
display: 'flex',
justifyContent: 'center',
alignItems: 'center',
marginBottom: '2rem',
  }}
>
  <Image
src='/demo_chat_logo.png'
alt='TrueNamePath ChatSpace Logo'
w={{ base: 100, sm: 120 }}
h={{ base: 100, sm: 120 }}
style={{
  borderRadius: '50%',
  boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2)',
  filter: 'drop-shadow(0 0 20px rgba(20, 184, 166, 0.3))',
  animation: 'logoGlow 3s ease-in-out infinite alternate',
  border: '3px solid rgba(255, 255, 255, 0.2)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
}}
  />
  <style>
{`
  @keyframes logoGlow {
0% {
  filter: drop-shadow(0 0 20px rgba(20, 184, 166, 0.3));
}
100% {
  filter: drop-shadow(0 0 30px rgba(124, 58, 237, 0.4));
}
  }
`}
  </style>
</Box>

{/* ChatSpace Branding */}
<Title
  order={1}
  fw={700}
  c='white'
  mb='xs'
  fz={{ base: 40, sm: 44, md: 48 }}
  style={{
fontFamily: '"Poppins", sans-serif',
  }}
>
  ChatSpace
</Title>

{/* Simple Tagline */}
<Title
  order={2}
  fw={400}
  c='rgba(255, 255, 255, 0.9)'
  mb='md'
  fz={{ base: 'lg', sm: 'xl', md: 'xxl' }}
>
  Connect with your team in real-time
</Title>

{/* Brief Description */}
<Text
  size='lg'
  c='rgba(255, 255, 255, 0.8)'
  mb='xl'
  maw={400}
  lh={1.6}
  fz={{ base: 'md', sm: 'lg' }}
>
  A modern chat platform designed for seamless team communication
  and collaboration.
</Text>

{/* Error Alert */}
{error && (
  <Alert
color='red'
w='100%'
data-testid='demo-chat-error-alert'
bg='rgba(255, 255, 255, 0.95)'
c='var(--mantine-color-red-7)'
  >
{error}
  </Alert>
)}

{/* Sign In Button */}
<Button
  size='xl'
  radius='lg'
  loading={isLoading}
  loaderProps={{ type: 'dots' }}
  onClick={handleSignIn}
  data-testid='demo-chat-signin-button'
  bg='white'
  c='electric.5'
  fw={600}
  px='xl'
  py='lg'
  style={{
border: 'none',
boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
transition: 'all 0.2s ease',
  }}
  styles={{
root: {
  '&:hover': {
backgroundColor: 'var(--mantine-color-gray-0)',
transform: 'translateY(-2px)',
boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
},
  }}
>
  {isLoading
? 'Connecting to TrueNamePath'
: 'Sign in with TrueNamePath'}
</Button>

<Text size='sm' c='rgba(255, 255, 255, 0.7)' mt='md'>
  Secure chat with context-aware identity
</Text>
  </Stack>
</Center>
  </Container>
</Box>
  );
};
