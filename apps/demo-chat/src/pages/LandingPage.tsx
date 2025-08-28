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
} from '@mantine/core';
import { oauthClient } from '@/services/oauth';

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
  style={{
minHeight: '100vh',
background: 'linear-gradient(135deg, #7C3AED 0%, #14B8A6 100%)',
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
style={{
  textAlign: 'center',
  color: 'white',
  maxWidth: '500px',
}}
  >
{/* ChatSpace Branding */}
<Title
  order={1}
  size='3rem'
  fw={700}
  style={{
color: 'white',
marginBottom: '0.5rem',
fontFamily: '"Poppins", sans-serif',
  }}
>
  ChatSpace
</Title>

{/* Simple Tagline */}
<Title
  order={2}
  size='1.5rem'
  fw={400}
  style={{
color: 'rgba(255, 255, 255, 0.9)',
marginBottom: '1rem',
  }}
>
  Connect with your team in real-time
</Title>

{/* Brief Description */}
<Text
  size='lg'
  style={{
color: 'rgba(255, 255, 255, 0.8)',
marginBottom: '2rem',
maxWidth: '400px',
lineHeight: 1.6,
  }}
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
style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
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
  style={{
backgroundColor: 'white',
color: '#7C3AED',
fontWeight: 600,
fontSize: '1.1rem',
padding: '1rem 2.5rem',
border: 'none',
boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
transition: 'all 0.2s ease',
  }}
  styles={{
root: {
  '&:hover': {
backgroundColor: '#f8fafc',
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

<Text
  size='sm'
  style={{
color: 'rgba(255, 255, 255, 0.7)',
marginTop: '1rem',
  }}
>
  Secure chat with context-aware identity
</Text>
  </Stack>
</Center>
  </Container>
</Box>
  );
};
