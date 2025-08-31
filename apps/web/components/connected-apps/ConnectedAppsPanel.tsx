'use client';

import { ConnectedAppsData } from '@/types/oauth';
import { ContextWithStats } from '@/app/api/contexts/types';
import {
  swrFetcher,
  formatSWRError,
  swrFocusConfig,
} from '@/utils/swr-fetcher';
import { Grid, Stack, Text, Center, Loader, Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useAuth } from '@/utils/context';
import useSWR from 'swr';
import { ConnectedAppCard } from './ConnectedAppCard';
import { EmptyConnectedApps } from './EmptyConnectedApps';

export function ConnectedAppsPanel() {
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch connected apps with focus-based revalidation (following NamesTab pattern)
  const {
data: appsResponse,
error: appsError,
mutate: revalidateApps,
  } = useSWR<ConnectedAppsData>(
userId ? '/api/oauth/connected-apps' : null,
swrFetcher,
swrFocusConfig,
  );

  // Fetch contexts with completeness data for the new selector
  const {
data: contextsResponse,
error: contextsError,
isLoading: contextsLoading,
  } = useSWR<ContextWithStats[]>(
userId ? '/api/contexts?filter=complete' : null,
swrFetcher,
swrFocusConfig,
  );

  const availableContexts = contextsResponse || [];
  const availableApps = appsResponse?.connected_apps || [];

  // Combined loading state
  const isLoading = (!appsResponse && !appsError) || contextsLoading;

  // Combined error handling
  const error = appsError || contextsError;

  return (
<Stack gap='lg'>
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
  ) : error ? (
<Alert
  color='red'
  title='Error Loading Data'
  icon={<IconAlertTriangle size={16} />}
>
  <Text size='sm'>{formatSWRError(error)}</Text>
</Alert>
  ) : availableApps.length === 0 ? (
<EmptyConnectedApps />
  ) : (
<Grid>
  {availableApps.map((app) => (
<Grid.Col key={app.client_id} span={{ base: 12, md: 6, lg: 4 }}>
  <ConnectedAppCard
app={app}
availableContexts={availableContexts}
onRevalidate={revalidateApps}
  />
</Grid.Col>
  ))}
</Grid>
  )}
</Stack>
  );
}
