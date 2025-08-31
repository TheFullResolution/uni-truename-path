/**
 * OAuth Callback Handler Component
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
  Progress,
} from '@mantine/core';
import { useOAuthToken, useStoredOAuthToken } from '@uni-final/truename-oauth';
import { useLocation, useNavigate } from 'react-router-dom';
import { oauthConfig } from '@/services/oauth';
import { brandGradient } from '@/theme';

export const CallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useStoredOAuthToken();
  const hasRedirected = useRef(false);

  const token = (() => {
const params = new URLSearchParams(location.search);
return params.get('token');
  })();

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

  useEffect(() => {
if (userData?.sub && token && !hasRedirected.current) {
  hasRedirected.current = true;
  setToken(token);
  navigate('/chat', { replace: true });
}
  }, [userData?.sub, token, setToken, navigate]);

  if (!token) {
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
  <Stack gap='lg' align='center' ta='center'>
<Alert
  color='red'
  w='100%'
  data-testid='demo-chat-callback-error'
  bg='rgba(255, 255, 255, 0.95)'
  c='var(--mantine-color-red-7)'
>
  Invalid callback: Missing authentication token
</Alert>
<Text size='sm' c='rgba(255, 255, 255, 0.8)'>
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
h='100vh'
style={{
  background: brandGradient,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}}
  >
<Container size='sm'>
  <Stack gap='lg' align='center' ta='center'>
<Alert
  color='red'
  w='100%'
  data-testid='demo-chat-callback-error'
  bg='rgba(255, 255, 255, 0.95)'
  c='var(--mantine-color-red-7)'
>
  Authentication failed: {error.message}
</Alert>
<Text size='sm' c='rgba(255, 255, 255, 0.8)'>
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
h='100vh'
style={{
  background: brandGradient,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}}
  >
<Container size='sm'>
  <Stack gap='lg' align='center' ta='center' c='white'>
<Loader
  size='lg'
  color='white'
  type='dots'
  data-testid='demo-chat-callback-loading'
/>
<Title order={3} c='white' fz={{ base: 'lg', sm: 'xl', md: 'xxl' }}>
  Resolving Authentication
</Title>
<Text size='md' c='rgba(255, 255, 255, 0.8)'>
  Setting up your chat identity...
</Text>
<Progress
  value={75}
  color='white'
  size='sm'
  w={250}
  bg='rgba(255, 255, 255, 0.2)'
  animated
/>
  </Stack>
</Container>
  </Box>
);
  }

  if (userData) {
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
  <Stack gap='lg' align='center' ta='center' c='white'>
<Loader
  size='lg'
  color='white'
  type='dots'
  data-testid='demo-chat-callback-success-loading'
/>
<Title order={3} c='white' fz={{ base: 'lg', sm: 'xl', md: 'xxl' }}>
  Authentication Successful
</Title>
<Text size='md' c='rgba(255, 255, 255, 0.8)'>
  Welcome{' '}
  {userData.nickname || userData.given_name || 'to ChatSpace'}!
  Entering chat...
</Text>
<Progress
  value={100}
  color='teal'
  size='sm'
  w={250}
  bg='rgba(255, 255, 255, 0.2)'
/>
  </Stack>
</Container>
  </Box>
);
  }

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
<Stack gap='lg' align='center' ta='center' c='white'>
  <Loader size='lg' color='white' type='dots' />
  <Title
order={3}
c='white'
style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}
  >
Processing Authentication
  </Title>
</Stack>
  </Container>
</Box>
  );
};
