'use client';

import type { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { ClientAppNavigation } from '@/components/layout/ClientAppNavigation';
import { useAuth } from '@/utils/context';
import { formatSWRError, swrFetcher } from '@/utils/swr-fetcher';
import { CACHE_KEYS } from '@/utils/swr-keys';
import type { Route } from 'next';
import { Box, Container, Paper, Tabs } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconDashboard,
  IconHistory,
  IconPlug,
  IconSettings,
  IconTags,
  IconUser,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { DashboardTabs } from './DashboardTabs';

type ValidTab =
  | 'dashboard'
  | 'names'
  | 'contexts'
  | 'connected-apps'
  | 'settings'
  | 'activity';

interface DashboardContentProps {
  initialTab: ValidTab;
}

export function DashboardContent({ initialTab }: DashboardContentProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ValidTab>(initialTab);

  // SWR data fetching for dashboard statistics
  // Use user.id instead of user.profile.id since the API works with auth user ID
  const {
data: dashboardStats,
error: statsError,
isLoading: statsLoading,
  } = useSWR<DashboardStatsResponse>(
user?.id ? CACHE_KEYS.STATS : null,
swrFetcher,
  );

  // Synchronize tab state with URL parameter
  useEffect(() => {
setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
if (statsError) {
  notifications.show({
title: 'Error Loading Dashboard',
message: formatSWRError(statsError),
color: 'red',
autoClose: 5000,
  });
}
  }, [statsError]);

  const handleTabChange = useCallback(
(value: string | null) => {
  if (
value &&
[
  'dashboard',
  'names',
  'contexts',
  'connected-apps',
  'oidc-preview',
  'settings',
  'activity',
].includes(value)
  ) {
const newTab = value as ValidTab;
setActiveTab(newTab);

// Preserve search parameters during navigation
const params = new URLSearchParams(urlSearchParams.toString());
const queryString = params.toString();

const newUrl =
  newTab === 'dashboard'
? `/dashboard${queryString ? `?${queryString}` : ''}`
: `/dashboard/${newTab}${queryString ? `?${queryString}` : ''}`;

router.push(newUrl as Route, { scroll: false });
  }
},
[router, urlSearchParams],
  );

  return (
<>
  <ClientAppNavigation />
  <Box data-testid='dashboard-content'>
<Container size='xl' py='md'>
  {/* Navigation Tabs */}
  <Paper p='md' mb='xl' shadow='md' radius='lg'>
<Tabs value={activeTab} onChange={handleTabChange}>
  <Tabs.List>
<Tabs.Tab
  value='dashboard'
  leftSection={<IconDashboard size={16} />}
  data-testid='tab-dashboard'
>
  Dashboard
</Tabs.Tab>
<Tabs.Tab
  value='contexts'
  leftSection={<IconTags size={16} />}
  data-testid='tab-contexts'
>
  Contexts
</Tabs.Tab>
<Tabs.Tab
  value='names'
  leftSection={<IconUser size={16} />}
  data-testid='tab-names'
>
  Names
</Tabs.Tab>
<Tabs.Tab
  value='connected-apps'
  leftSection={<IconPlug size={16} />}
  data-testid='tab-connected-apps'
>
  Connected Apps
</Tabs.Tab>
<Tabs.Tab
  value='settings'
  leftSection={<IconSettings size={16} />}
  data-testid='tab-settings'
>
  Settings
</Tabs.Tab>
<Tabs.Tab
  value='activity'
  leftSection={<IconHistory size={16} />}
  data-testid='tab-activity'
>
  Activity
</Tabs.Tab>
  </Tabs.List>

  {/* Tab content components */}
  <DashboardTabs
user={user}
dashboardStats={dashboardStats}
statsLoading={statsLoading}
  />
</Tabs>
  </Paper>
</Container>
  </Box>
</>
  );
}
