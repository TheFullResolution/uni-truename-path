'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Box,
  Button,
  Group,
  Stack,
  Card,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconLogout,
  IconUser,
  IconShieldCheck,
  IconRocket,
  IconSettings,
} from '@tabler/icons-react';
import { useAuth } from '../../lib/context/AuthProvider';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { Logo } from '../../components/branding';
import { ICON_SIZES, ICON_COLORS } from '../../components/icons';

function DashboardContent() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  // Handle logout
  const handleLogout = useCallback(async () => {
try {
  const result = await logout();

  if (!result.error) {
notifications.show({
  title: 'Signed out successfully',
  message: 'You have been signed out of TrueNamePath',
  color: 'blue',
  autoClose: 3000,
});

// Redirect to login page
router.replace('/auth/login');
  } else {
notifications.show({
  title: 'Logout failed',
  message: result.error,
  color: 'red',
  autoClose: 5000,
});
  }
} catch (error) {
  notifications.show({
title: 'Logout error',
message:
  error instanceof Error
? error.message
: 'An unexpected error occurred during logout',
color: 'red',
autoClose: 5000,
  });
}
  }, [logout, router]);

  return (
<Box
  style={{
minHeight: '100vh',
background:
  'linear-gradient(135deg, rgba(74, 127, 231, 0.05) 0%, rgba(195, 217, 247, 0.1) 100%)',
  }}
>
  <Container size='lg' py='xl'>
{/* Header */}
<Paper p='xl' mb='xl' shadow='lg'>
  <Group justify='space-between' align='center'>
<Group>
  <Logo size='lg' />
  <Box>
<Title order={1} size='h2' c='gray.8'>
  TrueNamePath Dashboard
</Title>
<Text size='sm' c='dimmed'>
  Context-Aware Identity Management
</Text>
  </Box>
</Group>
<Button
  leftSection={<IconLogout size={16} />}
  variant='light'
  color='red'
  onClick={handleLogout}
  loading={loading}
  disabled={loading}
>
  Sign Out
</Button>
  </Group>
</Paper>

{/* Welcome Section */}
<Paper p='xl' mb='xl' shadow='md'>
  <Group gap='sm' mb='md'>
<IconUser size={ICON_SIZES.lg} color={ICON_COLORS.brand} />
<Title order={2} c='gray.8'>
  Welcome back!
</Title>
  </Group>

  <Stack gap='md'>
<Group>
  <Text fw={500} size='sm' c='gray.7'>
Email:
  </Text>
  <Badge variant='light' color='blue' size='lg'>
{user?.email}
  </Badge>
</Group>

<Group>
  <Text fw={500} size='sm' c='gray.7'>
User ID:
  </Text>
  <Text size='sm' c='dimmed' ff='monospace'>
{user?.id}
  </Text>
</Group>

{user?.profile && (
  <Group>
<Text fw={500} size='sm' c='gray.7'>
  Profile ID:
</Text>
<Text size='sm' c='dimmed' ff='monospace'>
  {user?.profile?.id}
</Text>
  </Group>
)}
  </Stack>
</Paper>

{/* Authentication Status */}
<Paper p='xl' mb='xl' shadow='md'>
  <Group gap='sm' mb='md'>
<IconShieldCheck size={ICON_SIZES.lg} color={ICON_COLORS.success} />
<Title order={3} c='gray.8'>
  Authentication Status
</Title>
  </Group>

  <Stack gap='md'>
<Group>
  <Badge variant='filled' color='green' size='lg'>
✓ Authenticated
  </Badge>
  <Text size='sm' c='gray.6'>
You are successfully signed in to TrueNamePath
  </Text>
</Group>

<Group>
  <Badge variant='light' color='blue'>
JWT Token Active
  </Badge>
  <Text size='sm' c='gray.6'>
Your session is secure and valid
  </Text>
</Group>
  </Stack>
</Paper>

{/* Quick Actions */}
<Paper p='xl' mb='xl' shadow='md'>
  <Title order={3} c='gray.8' mb='lg'>
Quick Actions
  </Title>

  <Stack gap='sm'>
<Button
  variant='light'
  color='blue'
  fullWidth
  onClick={() => router.push('/demo')}
  justify='flex-start'
>
  <Box style={{ textAlign: 'left' }}>
<Group gap='sm'>
  <IconRocket size={ICON_SIZES.sm} color={ICON_COLORS.brand} />
  <Text fw={500} size='sm'>
Try Context Engine Demo
  </Text>
</Group>
<Text size='xs' c='dimmed'>
  Experience context-aware name resolution in action
</Text>
  </Box>
</Button>

<Button
  variant='light'
  color='gray'
  fullWidth
  onClick={() => {
notifications.show({
  title: 'Coming Soon',
  message:
'User settings and context management will be available in the next release',
  color: 'blue',
  autoClose: 4000,
});
  }}
  justify='flex-start'
>
  <Box style={{ textAlign: 'left' }}>
<Group gap='sm'>
  <IconSettings
size={ICON_SIZES.sm}
color={ICON_COLORS.neutral}
  />
  <Text fw={500} size='sm'>
Manage Your Contexts
  </Text>
</Group>
<Text size='xs' c='dimmed'>
  Create and configure custom contexts for different audiences
</Text>
  </Box>
</Button>

<Button
  variant='light'
  color='gray'
  fullWidth
  onClick={() => {
notifications.show({
  title: 'Coming Soon',
  message:
'Name management interface will be available in the next release',
  color: 'blue',
  autoClose: 4000,
});
  }}
  justify='flex-start'
>
  <Box style={{ textAlign: 'left' }}>
<Group gap='sm'>
  <IconUser size={ICON_SIZES.sm} color={ICON_COLORS.neutral} />
  <Text fw={500} size='sm'>
Manage Your Names
  </Text>
</Group>
<Text size='xs' c='dimmed'>
  Add, edit, and organize your different name variants
</Text>
  </Box>
</Button>
  </Stack>
</Paper>

{/* Developer Info */}
<Card p='lg' shadow='sm' withBorder>
  <Text size='xs' c='dimmed' ta='center'>
TrueNamePath v1.0.0 - University Final Project (CM3035 Advanced Web
Design)
<br />
Context-Aware Identity Management API Demo
  </Text>
</Card>
  </Container>
</Box>
  );
}

export default function DashboardPage() {
  return (
<AuthGuard redirectTo='/auth/login'>
  <DashboardContent />
</AuthGuard>
  );
}
