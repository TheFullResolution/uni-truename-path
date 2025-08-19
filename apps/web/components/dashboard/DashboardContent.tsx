'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconDashboard,
  IconLogout,
  IconSettings,
  IconShieldCheck,
  IconTags,
  IconUser,
  IconUserCheck,
  IconEye,
} from '@tabler/icons-react';
import useSWR from 'swr';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Logo } from '@/components/branding';
import { useAuth } from '@/utils/context';
import { formatSWRError, swrFetcher } from '@/utils/swr-fetcher';
import { createLogoutHandler } from '@/utils/utils';
import { CACHE_KEYS } from '@/utils/swr-keys';
import type { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import type { ContextWithStats } from '@/app/api/contexts/types';
import { DashboardTabs } from './DashboardTabs';
import {
  EditContextModal,
  DeleteContextModal,
} from '@/components/contexts/modals';

type ValidTab =
  | 'dashboard'
  | 'names'
  | 'contexts'
  | 'assign'
  | 'preview'
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
  const [selectedContext, setSelectedContext] =
useState<ContextWithStats | null>(null);
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Modal states for context management
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
useDisclosure(false);
  const [
deleteModalOpened,
{ open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  // SWR data fetching for dashboard statistics
  const {
data: dashboardStats,
error: statsError,
isLoading: statsLoading,
  } = useSWR<DashboardStatsResponse>(
user?.profile?.id ? CACHE_KEYS.STATS : null,
swrFetcher,
  );

  // SWR hook for contexts data
  const {
data: contextsData,
error: contextsError,
mutate: mutateContexts,
  } = useSWR<ContextWithStats[]>(
user?.id ? CACHE_KEYS.CONTEXTS : null,
swrFetcher,
  );

  // Derived state from SWR
  const contexts = contextsData || [];
  const contextsLoading = !contextsData && !contextsError;

  // Handle welcome notification when contexts data changes
  useEffect(() => {
if (contextsData && contextsData.length > 0 && !welcomeShown) {
  const contexts = contextsData;
  // Show onboarding notification for users with only default contexts
  const defaultContextNames = ['Professional', 'Social', 'Public'];
  const hasOnlyDefaultContexts =
contexts.length === 3 &&
contexts.every((ctx: ContextWithStats) =>
  defaultContextNames.includes(ctx.context_name),
);

  if (contexts.length === 0 || hasOnlyDefaultContexts) {
notifications.show({
  title: 'Welcome to Context Management!',
  message: hasOnlyDefaultContexts
? "We've created three starter contexts for you: Professional, Social, and Public. You can customize these names, create new contexts, or assign your name variants to these contexts to control how different audiences see your name."
: 'Create your first context to organize how different audiences see your name. Start with something like "Work Colleagues" or "HR Systems" to get going.',
  color: 'blue',
  autoClose: false,
});
setWelcomeShown(true);
  }
}
  }, [contextsData, welcomeShown]);

  // Synchronize tab state with URL parameter
  useEffect(() => {
setActiveTab(initialTab);
  }, [initialTab]);

  // Handle SWR errors
  if (statsError) {
notifications.show({
  title: 'Error Loading Dashboard',
  message: formatSWRError(statsError),
  color: 'red',
  autoClose: 5000,
});
  }

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
  'assign',
  'preview',
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

  // Handle edit context
  const handleEditContext = (context: ContextWithStats) => {
setSelectedContext(context);
openEditModal();
  };

  // Handle delete context
  const handleDeleteContext = (context: ContextWithStats) => {
setSelectedContext(context);
openDeleteModal();
  };

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
  value='assign'
  leftSection={<IconUserCheck size={16} />}
  data-testid='tab-assign'
>
  Assignments
</Tabs.Tab>
<Tabs.Tab
  value='preview'
  leftSection={<IconEye size={16} />}
  data-testid='tab-preview'
>
  Preview
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
contexts={contexts}
contextsLoading={contextsLoading}
contextsError={contextsError}
onEditContext={handleEditContext}
onDeleteContext={handleDeleteContext}
onRefreshContexts={mutateContexts}
  />
</Tabs>
  </Paper>
</Container>

{/* Edit Modal */}
<EditContextModal
  opened={editModalOpened}
  onClose={closeEditModal}
  context={selectedContext}
/>

{/* Delete Modal */}
<DeleteContextModal
  opened={deleteModalOpened}
  onClose={closeDeleteModal}
  context={selectedContext}
/>
  </Box>
</AuthGuard>
  );
}
