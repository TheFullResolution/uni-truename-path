'use client';

import type { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Logo } from '@/components/branding/Logo';
import { useAuth } from '@/utils/context';
import { formatSWRError, swrFetcher } from '@/utils/swr-fetcher';
import { CACHE_KEYS } from '@/utils/swr-keys';
import { createLogoutHandler } from '@/utils/utils';
import {
  Box,
  Button,
  Container,
  Group,
  Paper,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconDashboard,
  IconLogout,
  IconSettings,
  IconShieldCheck,
  IconTags,
  IconUser,
  IconCode,
} from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { DashboardTabs } from './DashboardTabs';

type ValidTab =
  | 'dashboard'
  | 'names'
  | 'contexts'
  | 'oidc-preview'
  | 'consents'
  | 'settings';

interface DashboardContentProps {
  initialTab: ValidTab;
}

export function DashboardContent({ initialTab }: DashboardContentProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const { user, logout, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<ValidTab>(initialTab);

  // SWR data fetching for dashboard statistics
  const {
data: dashboardStats,
error: statsError,
isLoading: statsLoading,
  } = useSWR<DashboardStatsResponse>(
user?.profile?.id ? CACHE_KEYS.STATS : null,
swrFetcher,
  );

  // Synchronize tab state with URL parameter
  useEffect(() => {
setActiveTab(initialTab);
  }, [initialTab]);

  // Handle SWR errors
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

  // Handle logout using utility function
  const handleLogout = useCallback(
() => createLogoutHandler(logout, router)(),
[logout, router],
  );

  // Handle tab changes with URL updates
  const handleTabChange = useCallback(
(value: string | null) => {
  if (
value &&
[
  'dashboard',
  'names',
  'contexts',
  'oidc-preview',
  'consents',
  'settings',
].includes(value)
  ) {
const newTab = value as ValidTab;
setActiveTab(newTab);

// Preserve search parameters during navigation
const params = new URLSearchParams(urlSearchParams.toString());
const queryString = params.toString();

// Update URL without full page reload
const newUrl =
  newTab === 'dashboard'
? `/dashboard${queryString ? `?${queryString}` : ''}`
: `/dashboard/${newTab}${queryString ? `?${queryString}` : ''}`;

router.push(newUrl, { scroll: false });
  }
},
[router, urlSearchParams],
  );

  return (
<AuthGuard>
  <Box
data-testid='dashboard-content'
style={{
  minHeight: '100vh',
  background:
'linear-gradient(135deg, rgba(74, 127, 231, 0.05) 0%, rgba(195, 217, 247, 0.1) 100%)',
}}
  >
<Container size='xl' py='md'>
  {/* Header */}
  <Paper p='xl' mb='xl' shadow='lg' radius='lg'>
<Group justify='space-between' align='center'>
  <Group>
<Logo size='lg' />
<Box>
  <Title order={1} size='h2' c='brand.8'>
TrueNamePath Dashboard
  </Title>
  <Text size='sm' c='gray.6'>
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
  value='oidc-preview'
  leftSection={<IconCode size={16} />}
  data-testid='tab-oidc-preview'
>
  OIDC Preview
</Tabs.Tab>
<Tabs.Tab
  value='consents'
  leftSection={<IconShieldCheck size={16} />}
  data-testid='tab-consents'
>
  Consents
</Tabs.Tab>
<Tabs.Tab
  value='settings'
  leftSection={<IconSettings size={16} />}
  data-testid='tab-settings'
>
  Settings
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
</AuthGuard>
  );
}
