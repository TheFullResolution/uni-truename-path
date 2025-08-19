'use client';

import { Grid, Tabs } from '@mantine/core';
import type { AuthenticatedUser } from '@/utils/context';
import type { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import {
  APIUsageCard,
  NameVariantsCard,
  PrivacyScoreCard,
  RecentActivityCard,
  WelcomeCard,
} from '../cards';

interface DashboardTabProps {
  user: AuthenticatedUser | null;
  dashboardStats: DashboardStatsResponse | undefined;
  statsLoading: boolean;
}

export default function DashboardTab({
  user,
  dashboardStats,
  statsLoading,
}: DashboardTabProps) {
  return (
<Tabs.Panel value='dashboard' pt='xl' data-testid='tab-content-dashboard'>
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
  <APIUsageCard stats={dashboardStats || null} loading={statsLoading} />
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
  );
}
