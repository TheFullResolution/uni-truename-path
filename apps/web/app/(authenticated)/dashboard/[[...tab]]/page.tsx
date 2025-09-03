import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

type ValidTab =
  | 'dashboard'
  | 'names'
  | 'contexts'
  | 'connected-apps'
  | 'settings'
  | 'activity';

const VALID_TABS: ValidTab[] = [
  'dashboard',
  'names',
  'contexts',
  'connected-apps',
  'settings',
  'activity',
];

interface PageProps {
  params: Promise<{ tab?: string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tab } = await params;
  const resolvedTab = validateAndResolveTab(tab);

  return {
title: `${resolvedTab.charAt(0).toUpperCase() + resolvedTab.slice(1)} | TrueNamePath Dashboard`,
description: `Manage your ${resolvedTab} in TrueNamePath context-aware identity system`,
  };
}

/**
 * Validates URL parameters and resolves to valid tab
 */
function validateAndResolveTab(tabParam: string[] | undefined): ValidTab {
  if (!tabParam || tabParam.length === 0) {
return 'dashboard';
  }

  const requestedTab = tabParam[0];

  if (!requestedTab || requestedTab === '') {
return 'dashboard';
  }

  if (!VALID_TABS.includes(requestedTab as ValidTab)) {
return 'dashboard';
  }

  return requestedTab as ValidTab;
}

export default async function DashboardPage({ params }: PageProps) {
  const { tab } = await params;

  if (tab?.[0] && !VALID_TABS.includes(tab[0] as ValidTab)) {
notFound();
  }

  const resolvedTab = validateAndResolveTab(tab);

  return (
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardContent initialTab={resolvedTab} />
</Suspense>
  );
}
