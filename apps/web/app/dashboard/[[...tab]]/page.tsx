import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

type ValidTab =
  | 'dashboard'
  | 'names'
  | 'contexts'
  | 'oidc-assign'
  | 'oidc-preview'
  | 'consents'
  | 'settings';

const VALID_TABS: ValidTab[] = [
  'dashboard',
  'names',
  'contexts',
  'oidc-assign',
  'oidc-preview',
  'consents',
  'settings',
];

interface PageProps {
  params: Promise<{ tab?: string[] }>;
}

export async function generateStaticParams() {
  // Pre-render only the root dashboard path for optimal SEO
  return VALID_TABS.map((tab) => ({ tab: tab === 'dashboard' ? [] : [tab] }));
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
 * Handles all edge cases: empty params, invalid tabs, default routing
 */
function validateAndResolveTab(tabParam: string[] | undefined): ValidTab {
  // No tab parameter or empty array: default to dashboard overview
  if (!tabParam || tabParam.length === 0) {
return 'dashboard';
  }

  const requestedTab = tabParam[0];

  // Empty string: default to dashboard
  if (!requestedTab || requestedTab === '') {
return 'dashboard';
  }

  // Validate against allowed tabs
  if (!VALID_TABS.includes(requestedTab as ValidTab)) {
// Invalid tab triggers 404
return 'dashboard'; // Won't be reached due to notFound()
  }

  return requestedTab as ValidTab;
}

export default async function DashboardPage({ params }: PageProps) {
  const { tab } = await params;

  // Validate tab parameter and trigger 404 for invalid tabs
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
