'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card, Text } from '@mantine/core';
import type { AuthenticatedUser } from '@/utils/context';
import type { DashboardStatsResponse } from '@/app/api/dashboard/stats/types';
import type { ContextWithStats } from '@/app/api/contexts/types';
import { SWRErrorBoundary } from './SWRErrorBoundary';
import {
  ContextsTabSkeleton,
  NamesTabSkeleton,
  AssignmentsTabSkeleton,
  PreviewTabSkeleton,
  ConsentsTabSkeleton,
  SettingsTabSkeleton,
} from './skeletons';

// Dynamic imports for performance optimization
// Dashboard tab loads immediately as it's the main view
import DashboardTab from './tabs/DashboardTab';

// Other tabs are loaded on demand to reduce initial bundle size
const ContextsTab = dynamic(() => import('./tabs/ContextsTab'), {
  loading: () => <ContextsTabSkeleton />,
  ssr: false, // Disable SSR for heavy interactive components
});

const NamesTab = dynamic(() => import('./tabs/NamesTab'), {
  loading: () => <NamesTabSkeleton />,
});

const AssignmentsTab = dynamic(() => import('./tabs/AssignmentsTab'), {
  loading: () => <AssignmentsTabSkeleton />,
  ssr: false, // Disable SSR for complex interactive components
});

const PreviewTab = dynamic(() => import('./tabs/PreviewTab'), {
  loading: () => <PreviewTabSkeleton />,
});

const ConsentsTab = dynamic(() => import('./tabs/ConsentsTab'), {
  loading: () => <ConsentsTabSkeleton />,
});

const SettingsTab = dynamic(() => import('./tabs/SettingsTab'), {
  loading: () => <SettingsTabSkeleton />,
});

interface DashboardTabsProps {
  user: AuthenticatedUser | null;
  dashboardStats: DashboardStatsResponse | undefined;
  statsLoading: boolean;
  contexts: ContextWithStats[];
  contextsLoading: boolean;
  contextsError: Error | null;
  onEditContext: (context: ContextWithStats) => void;
  onDeleteContext: (context: ContextWithStats) => void;
  onRefreshContexts: () => void;
}

export function DashboardTabs({
  user,
  dashboardStats,
  statsLoading,
  contexts,
  contextsLoading,
  contextsError,
  onEditContext,
  onDeleteContext,
  onRefreshContexts,
}: DashboardTabsProps) {
  return (
<SWRErrorBoundary>
  {/* Dashboard Tab - Always loads immediately */}
  <DashboardTab
user={user}
dashboardStats={dashboardStats}
statsLoading={statsLoading}
  />

  {/* Other tabs load on demand with Suspense boundaries */}
  <Suspense fallback={<ContextsTabSkeleton />}>
<ContextsTab
  contexts={contexts}
  contextsLoading={contextsLoading}
  contextsError={contextsError}
  onEditContext={onEditContext}
  onDeleteContext={onDeleteContext}
  onRefreshContexts={onRefreshContexts}
/>
  </Suspense>

  <Suspense fallback={<NamesTabSkeleton />}>
<NamesTab user={user} />
  </Suspense>

  <Suspense fallback={<AssignmentsTabSkeleton />}>
<AssignmentsTab onRefreshContexts={onRefreshContexts} />
  </Suspense>

  <Suspense fallback={<PreviewTabSkeleton />}>
<PreviewTab user={user} />
  </Suspense>

  <Suspense fallback={<ConsentsTabSkeleton />}>
<ConsentsTab />
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
</SWRErrorBoundary>
  );
}
