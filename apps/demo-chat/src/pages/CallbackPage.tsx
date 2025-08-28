/**
 * OAuth Callback Handler Component - ChatSpace
 * Processes OAuth callback with token resolution for chat context
 */

import { useEffect, useRef } from 'react';
import {
  Alert,
  Box,
  Container,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useOAuthToken, useStoredOAuthToken } from '@uni-final/truename-oauth';
import { useLocation, useNavigate } from 'react-router-dom';
import { oauthConfig } from '@/services/oauth';

export const CallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useStoredOAuthToken();
  const hasRedirected = useRef(false);

  // Extract token from callback URL parameters
  const token = (() => {
const params = new URLSearchParams(location.search);
return params.get('token');
  })();

  // Use SWR hook for token resolution (prevents duplicate requests)
  // Enable revalidateOnMount for fresh token resolution in Callback
  const {
data: userData,
error,
isLoading,
  } = useOAuthToken({
token,
enabled: !!token,
revalidateOnMount: true,
...oauthConfig,
  });

  // Handle successful authentication redirect in useEffect to avoid render side effects
  useEffect(() => {
if (userData?.sub && token && !hasRedirected.current) {
  hasRedirected.current = true;
  setToken(token);
  navigate('/chat', { replace: true });
}
  }, [userData?.sub, token, setToken, navigate]);

  // Simple declarative rendering based on hook states
  if (!token) {
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
  <Stack gap='lg' align='center' style={{ textAlign: 'center' }}>
<Alert
  color='red'
  w='100%'
  data-testid='demo-chat-callback-error'
  style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
>
  Invalid callback: Missing authentication token
</Alert>
<Text size='sm' style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
  Please return to the landing page and try again.
</Text>
  </Stack>
</Container>
  </Box>
);
  }

  if (error) {
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
  <Stack gap='lg' align='center' style={{ textAlign: 'center' }}>
<Alert
  color='red'
  w='100%'
  data-testid='demo-chat-callback-error'
  style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
>
  Authentication failed: {error.message}
</Alert>
<Text size='sm' style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
  Please return to the landing page and try again.
</Text>
  </Stack>
</Container>
  </Box>
);
  }

  if (isLoading) {
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
  <Stack
gap='lg'
align='center'
style={{ textAlign: 'center', color: 'white' }}
  >
<Loader
  size='lg'
  color='white'
  type='dots'
  data-testid='demo-chat-callback-loading'
/>
<Title order={3} style={{ color: 'white' }}>
  Resolving Authentication
</Title>
<Text size='md' style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
  Setting up your chat identity...
</Text>
  </Stack>
</Container>
  </Box>
);
  }

  if (userData) {
// Token storage and redirect handled by useEffect
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
  <Stack
gap='lg'
align='center'
style={{ textAlign: 'center', color: 'white' }}
  >
<Loader
  size='lg'
  color='white'
  type='dots'
  data-testid='demo-chat-callback-success-loading'
/>
<Title order={3} style={{ color: 'white' }}>
  Authentication Successful
</Title>
<Text size='md' style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
  Welcome{' '}
  {userData.nickname || userData.given_name || 'to ChatSpace'}!
  Entering chat...
</Text>
  </Stack>
</Container>
  </Box>
);
  }

  // Fallback state
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
<Stack
  gap='lg'
  align='center'
  style={{ textAlign: 'center', color: 'white' }}
>
  <Loader size='lg' color='white' type='dots' />
  <Title order={3} style={{ color: 'white' }}>
Processing Authentication
  </Title>
</Stack>
  </Container>
</Box>
  );
};
