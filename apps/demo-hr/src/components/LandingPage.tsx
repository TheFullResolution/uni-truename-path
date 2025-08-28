/**
 * Landing Page Component - HR Portal Authentication (Refactored for Academic Compliance)
 * Handles OAuth flow initiation for TrueNamePath integration
 */

import { useState } from 'react';
import { Paper, Title, Text, Button, Stack, Alert } from '@mantine/core';
import { PageLayout } from './shared/PageLayout';
import { paperStyles, buttonStyles } from './shared/styles';
import { oauthClient } from '@/oauth-client';

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
<PageLayout>
  <Stack gap='xl' align='center'>
{/* Combined Header and Login Card */}
<Paper
  {...paperStyles}
  maw={{ base: '100%', xs: 400 }}
  mx={{ base: 'sm', xs: 'auto' }}
  style={{ textAlign: 'center', width: '100%' }}
>
  <Stack gap='lg' align='center'>
<Title order={1} size='h1' c='corporate.5'>
  Enterprise HR Portal
</Title>
<Text size='lg' c='gray.7' fw={500}>
  Human Resources Management System
</Text>

<Text size='md' c='gray.6' ta='center'>
  Please sign in to access HR services and employee resources.
</Text>

{error && (
  <Alert color='red' w='100%' data-testid='demo-hr-error-alert'>
{error}
  </Alert>
)}

<Button
  size='lg'
  color='corporate'
  fullWidth
  loading={isLoading}
  loaderProps={{ type: 'dots' }}
  onClick={handleSignIn}
  styles={buttonStyles}
  data-testid='demo-hr-signin-button'
>
  {isLoading
? 'Connecting to TrueNamePath'
: 'Sign in with TrueNamePath'}
</Button>

<Text size='sm' c='gray.5' ta='center'>
  Secure enterprise identity management
</Text>
  </Stack>
</Paper>
  </Stack>
</PageLayout>
  );
};
