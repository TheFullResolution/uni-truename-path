'use client';

import { ConnectedAppsData } from '@/types/oauth';
import {
  swrFetcher,
  formatSWRError,
  swrFocusConfig,
} from '@/utils/swr-fetcher';
import {
  Grid,
  Stack,
  Title,
  Text,
  Center,
  Loader,
  Alert,
  Group,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconClock,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { useAuth } from '@/utils/context';
import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { CACHE_KEYS } from '@/utils/swr-keys';
import { ConnectedAppCard } from './ConnectedAppCard';
import { EmptyConnectedApps } from './EmptyConnectedApps';

export function ConnectedAppsPanel() {
  const { user } = useAuth();
  const userId = user?.id;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch connected apps with focus-based revalidation
  const {
data: appsResponse,
error: appsError,
isLoading,
mutate,
  } = useSWR<ConnectedAppsData>(
userId ? '/api/oauth/connected-apps' : null,
swrFetcher,
swrFocusConfig,
  );

  // Update timestamp when data changes
  useEffect(() => {
if (appsResponse) {
  setLastUpdated(new Date());
}
  }, [appsResponse]);

  // Handle app revocation with proper error handling and rollback
  const handleAppRevoke = async (clientId: string) => {
if (!appsResponse) return;

// Store original data for rollback
const originalResponse = appsResponse;

try {
  // Optimistic update - remove the app from the list immediately
  const updatedApps = appsResponse.connected_apps.filter(
(app) => app.client_id !== clientId,
  );

  const optimisticResponse = {
...appsResponse,
connected_apps: updatedApps,
  };

  // Update cache optimistically without revalidation
  await mutate(optimisticResponse, false);

  // The actual revocation happens in AppRevocationButton
  // If it succeeds, we revalidate to get fresh data
  await mutate();
} catch (error) {
  // Rollback on any cache operation error
  console.error('Cache update error:', error);
  await mutate(originalResponse, false);
}
  };

  // Handle context assignment changes with optimistic updates
  const handleContextChange = async (
clientId: string,
newContextId: string,
  ) => {
if (!appsResponse) return;

// Find the app and context name being updated
const currentApp = appsResponse.connected_apps.find(
  (a) => a.client_id === clientId,
);
if (!currentApp) return;

// Store original data for rollback
const originalResponse = appsResponse;

try {
  // Optimistically update ONLY that specific app in the cache
  const optimisticResponse = {
...appsResponse,
connected_apps: appsResponse.connected_apps.map((app) =>
  app.client_id === clientId
? { ...app, context_id: newContextId, context_name: 'Updating...' }
: app,
),
  };

  // Update cache optimistically without revalidation
  await mutate(optimisticResponse, false);

  // Make the API call
  const response = await fetch(`/api/oauth/assignments/${clientId}`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ context_id: newContextId }),
  });

  if (!response.ok) {
throw new Error('Failed to update context assignment');
  }

  // Success notification
  notifications.show({
title: 'Context Updated',
message: `Context assignment updated successfully for ${currentApp.display_name}`,
color: 'green',
icon: <IconCheck size={16} />,
autoClose: 3000,
  });

  // Revalidate to get fresh data with correct context names
  await mutate();

  // Invalidate related caches for demo apps
  const { mutate: globalMutate } = await import('swr');
  await Promise.all([
globalMutate(CACHE_KEYS.STATS),
globalMutate(CACHE_KEYS.OIDC_ASSIGNMENTS),
globalMutate(
  (key) => typeof key === 'string' && key.startsWith('oauth-token-'),
),
  ]);
} catch (error) {
  console.error('Failed to update context:', error);

  // Rollback optimistic update
  await mutate(originalResponse, false);

  // Error notification
  notifications.show({
title: 'Update Failed',
message: 'Failed to update context assignment. Please try again.',
color: 'red',
icon: <IconX size={16} />,
autoClose: 5000,
  });
}
  };

  const connectedApps = appsResponse?.connected_apps || [];

  return (
<Stack gap='lg'>
  <div>
<Group justify='space-between' align='flex-start'>
  <div>
<Title order={2}>Connected Apps</Title>
<Text size='sm' c='dimmed'>
  Manage applications that have access to your identity information.
  You can change contexts or revoke access at any time.
</Text>
  </div>
  {lastUpdated && (
<Group gap='xs' c='dimmed'>
  <IconClock size={14} />
  <Text size='xs'>Updated {lastUpdated.toLocaleTimeString()}</Text>
</Group>
  )}
</Group>
  </div>

  {/* Connected Apps List */}
  {isLoading ? (
<Center p='xl'>
  <Stack align='center'>
<Loader size='md' />
<Text size='sm' c='dimmed'>
  Loading connected apps...
</Text>
  </Stack>
</Center>
  ) : appsError ? (
<Alert
  color='red'
  title='Error Loading Connected Apps'
  icon={<IconAlertTriangle size={16} />}
>
  <Text size='sm'>{formatSWRError(appsError)}</Text>
</Alert>
  ) : connectedApps.length === 0 ? (
<EmptyConnectedApps />
  ) : (
<Grid>
  {connectedApps.map((app) => (
<Grid.Col key={app.client_id} span={{ base: 12, md: 6, lg: 4 }}>
  <ConnectedAppCard
app={app}
onRevoke={handleAppRevoke}
onContextChange={handleContextChange}
  />
</Grid.Col>
  ))}
</Grid>
  )}
</Stack>
  );
}
