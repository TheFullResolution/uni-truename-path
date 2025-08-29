'use client';

import type { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import { ConnectedAppsTabSkeleton } from '@/components/skeletons/ConnectedAppsTabSkeleton';
import { ContextsTabSkeleton } from '@/components/skeletons/ContextsTabSkeleton';
import { NamesTabSkeleton } from '@/components/skeletons/NamesTabSkeleton';
import { SettingsTabSkeleton } from '@/components/skeletons/SettingsTabSkeleton';

// Dynamic imports for performance optimization
// Dashboard tab loads immediately as it's the main view
import { DashboardTab } from '@/components/tabs/DashboardTab';
import type { AuthenticatedUser } from '@/utils/context';
import { Box, Card, Text } from '@mantine/core';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { SWRErrorBoundary } from './SWRErrorBoundary';

// Other tabs are loaded on demand to reduce initial bundle size
const ContextsTab = dynamic(
  () =>
import('@/components/tabs/ContextsTab').then((mod) => ({
  default: mod.ContextsTab,
})),
  {
loading: () => <ContextsTabSkeleton />,
ssr: false, // Disable SSR for heavy interactive components
  },
);

const ConnectedAppsTab = dynamic(
  () =>
import('@/components/tabs/ConnectedAppsTab').then((mod) => ({
  default: mod.ConnectedAppsTab,
})),
  {
loading: () => <ConnectedAppsTabSkeleton />,
ssr: false,
  },
);

const NamesTab = dynamic(
  () =>
import('@/components/tabs/NamesTab').then((mod) => ({
  default: mod.NamesTab,
})),
  {
loading: () => <NamesTabSkeleton />,
ssr: false,
  },
);

const SettingsTab = dynamic(
  () =>
import('@/components/tabs/SettingsTab').then((mod) => ({
  default: mod.SettingsTab,
})),
  {
loading: () => <SettingsTabSkeleton />,
ssr: false,
  },
);

interface DashboardTabsProps {
  user: AuthenticatedUser | null;
  dashboardStats: DashboardStatsResponse | undefined;
  statsLoading: boolean;
}

export function DashboardTabs({
  user,
  dashboardStats,
  statsLoading,
}: DashboardTabsProps) {
  return (
<SWRErrorBoundary>
  {/* Dashboard Tab - Always loads immediately */}
  <Box pt='md'>
<DashboardTab
  user={user}
  dashboardStats={dashboardStats}
  statsLoading={statsLoading}
/>

{/* Other tabs load on demand with Suspense boundaries */}
<Suspense fallback={<ContextsTabSkeleton />}>
  <ContextsTab user={user} />
</Suspense>

<Suspense fallback={<ConnectedAppsTabSkeleton />}>
  <ConnectedAppsTab />
</Suspense>

<Suspense fallback={<NamesTabSkeleton />}>
  <NamesTab user={user} />
</Suspense>

<Suspense fallback={<SettingsTabSkeleton />}>
  <SettingsTab />
</Suspense>

{/* Footer */}
<Card p='lg' shadow='sm' withBorder radius='lg' mt='xl'>
  <Text size='xs' c='dimmed' ta='center'>
TrueNamePath v1.0.0 - University Final Project (CM3035 Advanced Web
Design)
<br />
Context-Aware Identity Management API Demo
  </Text>
</Card>
  </Box>
</SWRErrorBoundary>
  );
}
