/**
 * AuthGuard Usage Examples
 *
 * This file demonstrates different ways to use the AuthGuard component
 * for route protection and authentication handling.
 */

import React from 'react';
import { Container, Title, Text, Button, Stack, Card } from '@mantine/core';
import { AuthGuard } from './AuthGuard';

// Example 1: Basic protection with automatic redirect
export function ProtectedPage() {
  return (
<AuthGuard>
  <Container>
<Title>Protected Content</Title>
<Text>This content is only visible to authenticated users.</Text>
  </Container>
</AuthGuard>
  );
}

// Example 2: Custom fallback component instead of redirect
function CustomFallback() {
  return (
<Container size='sm' py='xl'>
  <Card shadow='sm' padding='xl' radius='md' withBorder>
<Stack align='center' gap='md'>
  <Title order={2}>Please Sign In</Title>
  <Text ta='center' c='dimmed'>
You need to be logged in to access your dashboard.
  </Text>
  <Button component='a' href='/login' size='lg'>
Go to Login
  </Button>
</Stack>
  </Card>
</Container>
  );
}

export function DashboardWithFallback() {
  return (
<AuthGuard fallback={CustomFallback}>
  <Container>
<Title>User Dashboard</Title>
<Text>Welcome to your personalized dashboard!</Text>
  </Container>
</AuthGuard>
  );
}

// Example 3: Optional authentication (content available to all users)
export function PublicPageWithOptionalAuth() {
  return (
<AuthGuard requireAuth={false}>
  <Container>
<Title>Public Content</Title>
<Text>This content is available to everyone.</Text>
{/* Use useAuth() hook inside to conditionally render auth-specific content */}
  </Container>
</AuthGuard>
  );
}

// Example 4: Custom redirect path
export function AdminPage() {
  return (
<AuthGuard redirectTo='/admin/login'>
  <Container>
<Title>Admin Panel</Title>
<Text>Administrative content goes here.</Text>
  </Container>
</AuthGuard>
  );
}

// Example 5: Multiple protection levels
export function NestedProtection() {
  return (
<AuthGuard>
  {/* Outer protection for basic auth */}
  <Container>
<Title>User Area</Title>

<AuthGuard
  requireAuth={false}
  fallback={() => (
<Text c='dimmed'>Additional features require premium access.</Text>
  )}
>
  {/* Inner protection for premium features */}
  <Text>Premium feature content here</Text>
</AuthGuard>
  </Container>
</AuthGuard>
  );
}
