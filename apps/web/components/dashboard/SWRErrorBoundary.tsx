'use client';

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { mutate } from 'swr';
import { Button, Text, Box, Alert, Stack } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface SWRErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function SWRErrorFallback({
  error,
  resetErrorBoundary,
}: SWRErrorFallbackProps) {
  const handleRetry = async () => {
try {
  // Clear all SWR cache entries
  await mutate(() => true, undefined, { revalidate: false });

  // Reset the error boundary
  resetErrorBoundary();

  notifications.show({
title: 'Cache Cleared',
message: 'Data cache has been cleared and will be reloaded.',
color: 'blue',
  });
} catch (retryError) {
  console.error('Error during cache clearing:', retryError);
  notifications.show({
title: 'Retry Failed',
message: 'Failed to clear cache. Please refresh the page.',
color: 'red',
  });
}
  };

  const handleRefreshPage = () => {
window.location.reload();
  };

  return (
<Box p='xl'>
  <Alert
icon={<IconAlertTriangle size={16} />}
color='red'
title='Data Loading Error'
variant='light'
  >
<Stack gap='md'>
  <Text size='sm'>
{error.message || 'Something went wrong while loading data'}
  </Text>

  <Text size='xs' c='dimmed'>
This error occurred while fetching data. You can try clearing the
cache or refreshing the page.
  </Text>

  <Stack gap='xs'>
<Button
  onClick={handleRetry}
  variant='light'
  size='sm'
  leftSection={<IconRefresh size={14} />}
>
  Clear Cache & Retry
</Button>

<Button
  onClick={handleRefreshPage}
  variant='outline'
  size='sm'
  color='gray'
>
  Refresh Page
</Button>
  </Stack>
</Stack>
  </Alert>
</Box>
  );
}

interface SWRErrorBoundaryProps {
  children: React.ReactNode;
}

export function SWRErrorBoundary({ children }: SWRErrorBoundaryProps) {
  return (
<ErrorBoundary
  FallbackComponent={SWRErrorFallback}
  onReset={() => {
console.log('SWR Error boundary reset');
  }}
  onError={(error) => {
console.error('SWR Error boundary caught error:', error);
  }}
>
  {children}
</ErrorBoundary>
  );
}
