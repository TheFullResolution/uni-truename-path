'use client';

import type { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { APIUsageCard } from '@/components/cards/APIUsageCard';
import { ConnectedAppsCard } from '@/components/cards/NameVariantsCard';
import { OAuthActivityCard } from '@/components/cards/PrivacyScoreCard';
import { RecentActivityCard } from '@/components/cards/RecentActivityCard';
import { WelcomeCard } from '@/components/cards/WelcomeCard';
import { TabPanel } from '@/components/dashboard/TabPanel';
import type { AuthenticatedUser } from '@/utils/context';
import { Grid } from '@mantine/core';

interface DashboardTabProps {
  user: AuthenticatedUser | null;
  dashboardStats: DashboardStatsResponse | undefined;
  statsLoading: boolean;
}

export function DashboardTab({
  user,
  dashboardStats,
  statsLoading,
}: DashboardTabProps) {
  return (
<TabPanel value='dashboard' title='Overview'>
  <Grid>
{/* Welcome Card */}
<Grid.Col span={12}>
  <WelcomeCard
user={user}
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>

{/* OAuth Activity Card */}
<Grid.Col span={{ base: 12, md: 4 }}>
  <OAuthActivityCard
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>

{/* API Usage Statistics */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <APIUsageCard stats={dashboardStats || null} loading={statsLoading} />
</Grid.Col>

{/* Connected Apps Overview */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <ConnectedAppsCard
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
</TabPanel>
  );
}
