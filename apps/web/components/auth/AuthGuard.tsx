'use client';

import { useAuth } from '@/utils/context';
import { Card, Center, Container, Loader, Stack, Text } from '@mantine/core';
import React from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * AuthGuard component for handling authentication UI states
 *
 * OPTIMIZED: Route protection is now handled by middleware for better performance.
 * This component focuses purely on UI states and loading indicators.
 *
 * Features:
 * - Loading state while checking authentication status
 * - Error handling for authentication failures
 * - Custom fallback component support
 * - Clean integration with AuthProvider context
 * - Optimized for middleware-first authentication architecture
 *
 * @param children - Content to render when authenticated
 * @param fallback - Custom component to render when not authenticated
 * @param requireAuth - Whether authentication is required (default: true)
 * @param redirectTo - Kept for backward compatibility (not used - middleware handles redirects)
 */
export function AuthGuard({
  children,
  fallback: FallbackComponent,
  requireAuth = true,
  redirectTo = '/login', // eslint-disable-line @typescript-eslint/no-unused-vars
}: AuthGuardProps) {
  const { isAuthenticated, loading, user, error } = useAuth();
  // Router no longer needed - middleware handles redirects

  // Note: Redirect logic removed - middleware now handles all route protection
  // This eliminates duplicate authentication checks and improves performance

  // Show loading state while checking authentication
  if (loading) {
return (
  <Container size='sm' py='xl'>
<Center>
  <Card shadow='sm' padding='xl' radius='md' withBorder>
<Stack align='center' gap='md'>
  <Loader size='lg' />
  <Text size='lg' fw={500}>
Checking authentication...
  </Text>
  <Text size='sm' c='dimmed'>
Please wait while we verify your session
  </Text>
</Stack>
  </Card>
</Center>
  </Container>
);
  }

  // Handle authentication error state
  if (error && requireAuth) {
return (
  <Container size='sm' py='xl'>
<Center>
  <Card shadow='sm' padding='xl' radius='md' withBorder>
<Stack align='center' gap='md'>
  <Text size='lg' fw={500} c='red'>
Authentication Error
  </Text>
  <Text size='sm' c='dimmed' ta='center'>
There was a problem with your authentication. Please try logging
in again.
  </Text>
</Stack>
  </Card>
</Center>
  </Container>
);
  }

  // If authentication is not required, always render children
  if (!requireAuth) {
return <>{children}</>;
  }

  // If authenticated, render children
  // Note: Middleware ensures this component only loads for authenticated users on protected routes
  if (isAuthenticated && user) {
return <>{children}</>;
  }

  // If custom fallback provided and not authenticated, render fallback
  if (FallbackComponent && !isAuthenticated) {
return <FallbackComponent />;
  }

  // Fallback UI for unauthenticated state
  // This should rarely be seen since middleware handles redirects
  return (
<Container size='sm' py='xl'>
  <Center>
<Card shadow='sm' padding='xl' radius='md' withBorder>
  <Stack align='center' gap='md'>
<Text size='lg' fw={500}>
  Access Restricted
</Text>
<Text size='sm' c='dimmed' ta='center'>
  You need to be logged in to access this page.
</Text>
  </Stack>
</Card>
  </Center>
</Container>
  );
}
