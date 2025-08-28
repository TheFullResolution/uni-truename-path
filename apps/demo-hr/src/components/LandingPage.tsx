/**
 * Landing Page Component - HR Portal Authentication (Refactored for Academic Compliance)
 * Handles OAuth flow initiation for TrueNamePath integration
 */

import { oauthClient } from '@/services/oauth';
import { Alert, Button, Paper, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { PageLayout } from './shared/PageLayout';
import { buttonStyles, paperStyles } from './shared/styles';

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
<Text size='lg' c='gray.7' fw={500} ta='center'>
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
