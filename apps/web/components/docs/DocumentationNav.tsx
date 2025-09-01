'use client';

import { Tabs } from '@mantine/core';
import { IconBook, IconRocket, IconCode } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { Route } from 'next';

type DocTab = 'overview' | 'quick-start' | 'technical';

export function DocumentationNav() {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab from pathname
  const getActiveTab = (): DocTab => {
if (pathname.includes('/docs/quick-start')) {
  return 'quick-start';
}
if (pathname.includes('/docs/technical')) {
  return 'technical';
}
return 'overview';
  };

  const activeTab = getActiveTab();

  // Handle tab changes with URL navigation
  const handleTabChange = useCallback(
(value: string | null) => {
  if (value && ['overview', 'quick-start', 'technical'].includes(value)) {
const newTab = value as DocTab;
const newUrl = `/docs/${newTab}`;
router.push(newUrl as Route, { scroll: false });
  }
},
[router],
  );

  return (
<Tabs value={activeTab} onChange={handleTabChange}>
  <Tabs.List>
<Tabs.Tab
  value='overview'
  leftSection={<IconBook size={16} />}
  data-testid='tab-overview'
>
  Overview
</Tabs.Tab>
<Tabs.Tab
  value='quick-start'
  leftSection={<IconRocket size={16} />}
  data-testid='tab-quick-start'
>
  Quick Start
</Tabs.Tab>
<Tabs.Tab
  value='technical'
  leftSection={<IconCode size={16} />}
  data-testid='tab-technical'
>
  Technical Details
</Tabs.Tab>
  </Tabs.List>
</Tabs>
  );
}
