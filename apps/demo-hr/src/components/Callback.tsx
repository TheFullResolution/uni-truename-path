/**
 * OAuth Callback Handler Component - Simplified Declarative Architecture
 * Processes OAuth callback using declarative rendering with our two-hook architecture.
 * Token storage and user data fetching are handled by separate SWR hooks.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Paper, Title, Text, Stack, Loader, Alert } from '@mantine/core';
import { PageLayout } from './shared/PageLayout';
import { paperStyles, cardStyles } from './shared/styles';
import { useOAuthToken, useStoredOAuthToken } from '@uni-final/truename-oauth';
import { oauthConfig } from '@/services/oauth';

export const Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useStoredOAuthToken();
  const redirectHandledRef = useRef(false);

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
revalidateOnMount: true, // Fresh tokens need to be resolved
...oauthConfig,
  });

  // Handle token storage and redirect in useEffect to avoid side effects during render
  useEffect(() => {
if (userData?.sub && token && !redirectHandledRef.current) {
  redirectHandledRef.current = true;
  setToken(token);
  navigate('/dashboard', { replace: true });
}
  }, [userData?.sub, token, setToken, navigate]);

  // Simple declarative rendering based on hook states
  if (!token) {
return (
  <PageLayout>
<Paper {...paperStyles} style={cardStyles}>
  <Stack gap='lg' align='center'>
<Alert color='red' w='100%' data-testid='demo-hr-callback-error'>
  Invalid callback: Missing authentication token
</Alert>
<Text size='sm' c='gray.6'>
  Please return to the landing page and try again.
</Text>
  </Stack>
</Paper>
  </PageLayout>
);
  }

  if (error) {
return (
  <PageLayout>
<Paper {...paperStyles} style={cardStyles}>
  <Stack gap='lg' align='center'>
<Alert color='red' w='100%' data-testid='demo-hr-callback-error'>
  Authentication failed: {error.message}
</Alert>
<Text size='sm' c='gray.6'>
  Please return to the landing page and try again.
</Text>
  </Stack>
</Paper>
  </PageLayout>
);
  }

  if (isLoading) {
return (
  <PageLayout>
<Paper {...paperStyles} style={cardStyles}>
  <Stack gap='lg' align='center'>
<Loader
  size='lg'
  color='corporate'
  type='dots'
  data-testid='demo-hr-callback-loading'
/>
<Title order={3} c='gray.7'>
  Resolving Authentication
</Title>
<Text size='md' c='gray.6'>
  Using SWR for secure token resolution...
</Text>
  </Stack>
</Paper>
  </PageLayout>
);
  }

  if (userData) {
// Token storage and redirect handled by useEffect
return (
  <PageLayout>
<Paper {...paperStyles} style={cardStyles}>
  <Stack gap='lg' align='center'>
<Loader
  size='lg'
  color='corporate'
  type='dots'
  data-testid='demo-hr-callback-success-loading'
/>
<Title order={3} c='gray.7'>
  Authentication Successful
</Title>
<Text size='md' c='gray.6'>
  Welcome {userData.given_name}! Redirecting to dashboard...
</Text>
  </Stack>
</Paper>
  </PageLayout>
);
  }

  // Fallback state
  return (
<PageLayout>
  <Paper {...paperStyles} style={cardStyles}>
<Stack gap='lg' align='center'>
  <Loader size='lg' color='corporate' type='dots' />
  <Title order={3} c='gray.7'>
Processing Authentication
  </Title>
</Stack>
  </Paper>
</PageLayout>
  );
};
