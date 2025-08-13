'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Text, Loader, Center, Card } from '@mantine/core';
import { useAuth } from '../../lib/context/AuthProvider';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * AuthGuard component for protecting routes and handling authentication states
 *
 * Features:
 * - Automatic redirect to login page for unauthenticated users
 * - Loading state while checking authentication status
 * - Custom fallback component support
 * - Optional redirect destination configuration
 * - Clean integration with AuthProvider context
 *
 * @param children - Content to render when authenticated
 * @param fallback - Custom component to render when not authenticated (instead of redirecting)
 * @param requireAuth - Whether authentication is required (default: true)
 * @param redirectTo - Custom redirect path (default: '/login')
 */
export function AuthGuard({
  children,
  fallback: FallbackComponent,
  requireAuth = true,
  redirectTo = '/login',
}: AuthGuardProps) {
  const { isAuthenticated, loading, user, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
// Only handle redirects if authentication is required
if (!requireAuth) return;

// Don't redirect while still loading
if (loading) return;

// If not authenticated and no custom fallback, redirect to login
if (!isAuthenticated && !FallbackComponent) {
  // Preserve current path for redirect after login
  const currentPath =
typeof window !== 'undefined' ? window.location.pathname : '';
  const redirectUrl = `${redirectTo}${currentPath !== '/' ? `?returnUrl=${encodeURIComponent(currentPath)}` : ''}`;
  router.push(redirectUrl);
}
  }, [
isAuthenticated,
loading,
requireAuth,
FallbackComponent,
redirectTo,
router,
  ]);

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
  if (isAuthenticated && user) {
return <>{children}</>;
  }

  // If custom fallback provided and not authenticated, render fallback
  if (FallbackComponent && !isAuthenticated) {
return <FallbackComponent />;
  }

  // Default fallback for unauthenticated state (shouldn't reach here due to redirect)
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

export default AuthGuard;
