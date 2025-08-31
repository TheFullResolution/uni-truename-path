/**
 * Dashboard Component - Professional HR Employee Portal
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
import { OAuthResponseSection } from './sections/OAuthResponseSection';
import {
  clearOAuthCache,
  useStoredOAuthToken,
  useOAuthToken,
} from '@uni-final/truename-oauth';
import { oauthConfig } from '@/services/oauth';

export const Dashboard = () => {
  const navigate = useNavigate();

  const { token, clearToken } = useStoredOAuthToken();
  const {
data: userData,
error,
isLoading,
isValidating,
mutate,
  } = useOAuthToken({
token,
enabled: !!token,
...oauthConfig,
  });

  useEffect(() => {
if (!token && !isLoading) {
  navigate('/', { replace: true });
}
  }, [token, isLoading, navigate]);

  const handleLogout = () => {
clearToken();
clearOAuthCache();
navigate('/', { replace: true });
  };

  if (!token && !isLoading) {
return null;
  }

  if (error) {
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
  Retrieving your identity and context information...
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
  There was an issue retrieving your identity data. Please try
  signing in again.
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
<Group justify='space-between' align='flex-start'>
  <Stack gap='xs'>
<Title order={1} c='corporate.5' fz={{ base: 'xl', sm: '2rem' }}>
  Enterprise HR Portal
</Title>
<Group gap='sm' align='center'>
  <IconUserCheck
size={20}
style={{ color: 'var(--mantine-color-corporate-5)' }}
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
  <Group gap='sm'>
<Button
  variant='light'
  color='corporate'
  size='sm'
  onClick={() => mutate()}
  loading={isValidating}
  leftSection={<IconRefresh size={16} />}
  data-testid='demo-hr-refresh-button'
>
  Refresh Data
</Button>
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
</Group>

<Alert
  variant='light'
  color='corporate'
  icon={<IconUserCheck size={16} />}
>
  <Text size='sm'>
You are viewing your identity as configured for the{' '}
<strong>{userData.context_name}</strong> context. This demonstrates
context-aware identity management in enterprise environments.
  </Text>
</Alert>
<Stack gap='lg'>
  <EmployeeProfileSection userData={userData} />
  <Group align='flex-start' grow preventGrowOverflow>
<AuthenticationDetailsSection userData={userData} />
<ContextAwarenessSection userData={userData} />
  </Group>
  <OAuthResponseSection userData={userData} />
</Stack>
  </Stack>
</PageLayout>
  );
};
