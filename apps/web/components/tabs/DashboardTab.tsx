'use client';

import type { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { APIUsageCard } from '@/components/cards/APIUsageCard';
import { NameVariantsCard } from '@/components/cards/NameVariantsCard';
import { PrivacyScoreCard } from '@/components/cards/PrivacyScoreCard';
import { RecentActivityCard } from '@/components/cards/RecentActivityCard';
import { WelcomeCard } from '@/components/cards/WelcomeCard';
import type { AuthenticatedUser } from '@/utils/context';
import { Grid, Tabs } from '@mantine/core';

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
<Tabs.Panel value='dashboard'>
  <Grid>
{/* Welcome Card */}
<Grid.Col span={12}>
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
