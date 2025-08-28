/**
 * Dashboard Component - Professional HR Employee Portal
 * Enhanced for Step 16.4.4 - Complete OIDC Claims Display with Professional HR Layout
 * Simplified to use two-hook architecture with clean SWR token management
 * Demonstrates context-aware identity management in corporate environment
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Title,
  Text,
  Button,
  Stack,
  Group,
  Alert,
  Loader,
  Paper,
} from '@mantine/core';
import {
  IconUserCheck,
  IconBuildingStore,
  IconAlertCircle,
  IconRefresh,
} from '@tabler/icons-react';
import { PageLayout } from './shared/PageLayout';
import { paperStyles, cardStyles } from './shared/styles';
import { EmployeeProfileSection } from './sections/EmployeeProfileSection';
import { AuthenticationDetailsSection } from './sections/AuthenticationDetailsSection';
import { ContextAwarenessSection } from './sections/ContextAwarenessSection';
import { clearOAuthCache } from '@/utils/oauth-cache-provider';
import { useStoredOAuthToken } from '@/hooks/useStoredOAuthToken';
import { useOAuthToken } from '@/hooks/useOAuthToken';

export const Dashboard = () => {
  const navigate = useNavigate();

  // Two-hook architecture: token management + data fetching
  const { token, clearToken } = useStoredOAuthToken();
  const {
data: userData,
error,
isLoading,
  } = useOAuthToken({
token,
enabled: !!token,
  });

  // Handle navigation in effect to avoid render-phase side effects
  useEffect(() => {
if (!token && !isLoading) {
  navigate('/', { replace: true });
}
  }, [token, isLoading, navigate]);

  const handleLogout = () => {
clearToken(); // Clear token via SWR
clearOAuthCache(); // Clear cache provider storage
navigate('/', { replace: true });
  };

  // Simple conditional rendering without side effects
  if (!token && !isLoading) {
return null; // Effect will handle navigation
  }

  if (error) {
// Show error state instead of immediate navigation
return (
  <PageLayout>
<Paper {...paperStyles} style={cardStyles}>
  <Stack gap='lg' align='center'>
<Alert
  color='red'
  icon={<IconAlertCircle size={16} />}
  w='100%'
  data-testid='demo-hr-dashboard-error'
>
  Authentication error occurred
</Alert>
<Text size='sm' c='gray.6' ta='center'>
  Your session has expired or there was an authentication error.
  Please sign in again.
</Text>
<Button
  color='corporate'
  variant='outline'
  leftSection={<IconRefresh size={16} />}
  onClick={() => navigate('/', { replace: true })}
  data-testid='demo-hr-return-signin-button'
>
  Return to Sign In
</Button>
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
<Loader size='xl' type='dots' color='corporate' />
<Title order={3} c='gray.7'>
  Loading Dashboard
</Title>
<Text size='md' c='gray.6' ta='center'>
  Retrieving your professional identity and context information...
</Text>
  </Stack>
</Paper>
  </PageLayout>
);
  }

  if (!userData) {
return (
  <PageLayout>
<Paper {...paperStyles} style={cardStyles}>
  <Stack gap='lg' align='center'>
<Alert
  color='red'
  icon={<IconAlertCircle size={16} />}
  w='100%'
  data-testid='demo-hr-dashboard-error'
>
  Failed to load your dashboard information
</Alert>
<Text size='sm' c='gray.6' ta='center'>
  There was an issue retrieving your professional identity data.
  Please try signing in again.
</Text>
<Button
  color='corporate'
  variant='outline'
  leftSection={<IconRefresh size={16} />}
  onClick={handleLogout}
  data-testid='demo-hr-retry-button'
>
  Return to Sign In
</Button>
  </Stack>
</Paper>
  </PageLayout>
);
  }

  return (
<PageLayout size='md' centered={false}>
  <Stack gap='xl' data-testid='demo-hr-dashboard'>
{/* Header with Welcome Message */}
<Group justify='space-between' align='flex-start'>
  <Stack gap='xs'>
<Title order={1} c='corporate.5'>
  Enterprise HR Portal
</Title>
<Group gap='sm' align='center'>
  <IconUserCheck
size={20}
color='var(--mantine-color-corporate-5)'
  />
  <Text
size='lg'
fw={500}
c='gray.7'
data-testid='demo-hr-employee-name'
  >
Welcome, {userData.given_name}!
  </Text>
</Group>
  </Stack>
  <Button
variant='outline'
color='corporate'
onClick={handleLogout}
leftSection={<IconBuildingStore size={16} />}
data-testid='demo-hr-logout-button'
  >
Sign Out
  </Button>
</Group>

{/* Professional Context Notice */}
<Alert
  variant='light'
  color='corporate'
  icon={<IconUserCheck size={16} />}
>
  <Text size='sm'>
You are viewing your <strong>professional identity</strong> as
configured for workplace contexts. This demonstrates context-aware
identity management in enterprise environments.
  </Text>
</Alert>

{/* Main Content Sections */}
<Stack gap='lg'>
  <EmployeeProfileSection userData={userData} />
  <Group align='flex-start' grow>
<AuthenticationDetailsSection userData={userData} />
<ContextAwarenessSection userData={userData} />
  </Group>
</Stack>
  </Stack>
</PageLayout>
  );
};
