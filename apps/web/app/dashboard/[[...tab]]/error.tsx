'use client';

import { useEffect } from 'react';
import { Button, Text, Box, Paper } from '@mantine/core';
import { Logo } from '@/components/branding';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
console.error('Dashboard error:', error);
// Report to error tracking service in production
  }, [error]);

  return (
<Box
  style={{
minHeight: '100vh',
background:
  'linear-gradient(135deg, rgba(74, 127, 231, 0.05) 0%, rgba(195, 217, 247, 0.1) 100%)',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
  }}
>
  <Paper p='xl' shadow='lg' radius='lg' maw={400}>
<Box ta='center'>
  <Box mb='lg'>
<Logo size='lg' />
  </Box>
  <Text size='lg' fw={500} mb='md'>
Something went wrong with the dashboard
  </Text>
  <Text c='dimmed' mb='lg'>
{error.message || 'An unexpected error occurred'}
  </Text>
  <Button onClick={reset} variant='light' color='brand'>
Try again
  </Button>
</Box>
  </Paper>
</Box>
  );
}
