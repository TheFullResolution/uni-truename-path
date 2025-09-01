'use client';

import type { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { WelcomeCard } from '@/components/cards/WelcomeCard';
import { OAuthOverviewCard } from '@/components/cards/OAuthOverviewCard';
import { ConnectedAppsCard } from '@/components/cards/NameVariantsCard';
import { APIUsageCard } from '@/components/cards/APIUsageCard';
import { ActivityTimelineCard } from '@/components/cards/ActivityTimelineCard';
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
{/* Row 1: Welcome Card */}
<Grid.Col span={12}>
  <WelcomeCard
user={user}
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>

{/* Row 2: OAuth Overview | Connected Apps */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <OAuthOverviewCard
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>
<Grid.Col span={{ base: 12, md: 6 }}>
  <ConnectedAppsCard
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>

{/* Row 3: Performance Metrics | Activity Timeline */}
<Grid.Col span={{ base: 12, md: 4 }}>
  <APIUsageCard stats={dashboardStats || null} loading={statsLoading} />
</Grid.Col>
<Grid.Col span={{ base: 12, md: 8 }}>
  <ActivityTimelineCard
stats={dashboardStats || null}
loading={statsLoading}
  />
</Grid.Col>
  </Grid>
</TabPanel>
  );
}
