'use client';

import { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
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
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { Logo } from '@/components/branding';
import {
  APIUsageCard,
  NameVariantsCard,
  PrivacyScoreCard,
  RecentActivityCard,
  SettingsPanel,
  WelcomeCard,
} from '../../components/dashboard';
import { useAuth } from '@/utils/context';
import { formatSWRError, swrFetcher } from '@/utils/swr-fetcher';
import { createLogoutHandler } from '@/utils/utils';

function DashboardContent() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // SWR data fetching for dashboard statistics
  const {
data: dashboardStats,
error: statsError,
isLoading: statsLoading,
  } = useSWR<DashboardStatsResponse>(
user?.profile?.id ? '/api/dashboard/stats' : null,
swrFetcher,
  );

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

  return (
<Box
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
  <Tabs
value={activeTab}
onChange={(value) => value && setActiveTab(value)}
  >
<Tabs.List>
  <Tabs.Tab
value='dashboard'
leftSection={<IconDashboard size={16} />}
  >
Dashboard
  </Tabs.Tab>
  <Tabs.Tab value='names' leftSection={<IconUser size={16} />}>
Names
  </Tabs.Tab>
  <Tabs.Tab value='contexts' leftSection={<IconTags size={16} />}>
Contexts
  </Tabs.Tab>
  <Tabs.Tab
value='consents'
leftSection={<IconShieldCheck size={16} />}
  >
Consents
  </Tabs.Tab>
  <Tabs.Tab
value='settings'
leftSection={<IconSettings size={16} />}
  >
Settings
  </Tabs.Tab>
</Tabs.List>

{/* Dashboard Tab Content */}
<Tabs.Panel value='dashboard' pt='xl'>
  <Grid>
{/* Welcome Card */}
<Grid.Col span={{ base: 12, md: 8 }}>
  <WelcomeCard
user={user}
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>

{/* Privacy Score Card */}
<Grid.Col span={{ base: 12, md: 4 }}>
  <PrivacyScoreCard
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>

{/* API Usage Statistics */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <APIUsageCard
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>

{/* Name Variants Overview */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <NameVariantsCard
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>

{/* Recent Activity */}
<Grid.Col span={12}>
  <RecentActivityCard
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>
  </Grid>
</Tabs.Panel>

{/* Names Tab Content */}
<Tabs.Panel value='names' pt='xl'>
  <div></div>
</Tabs.Panel>

{/* Contexts Tab Content */}
<Tabs.Panel value='contexts' pt='xl'>
  <div></div>
</Tabs.Panel>

{/* Consents Tab Content */}
<Tabs.Panel value='consents' pt='xl'>
  <div></div>
</Tabs.Panel>

{/* Settings Tab Content */}
<Tabs.Panel value='settings' pt='xl'>
  <SettingsPanel />
</Tabs.Panel>
  </Tabs>
</Paper>

{/* Footer */}
<Card p='lg' shadow='sm' withBorder radius='lg'>
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
