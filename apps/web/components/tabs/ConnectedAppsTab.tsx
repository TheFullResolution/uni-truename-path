'use client';

import { ConnectedAppsPanel } from '@/components/dashboard/connected-apps/ConnectedAppsPanel';
import { Tabs } from '@mantine/core';

export function ConnectedAppsTab() {
  return (
<Tabs.Panel value='connected-apps'>
  <ConnectedAppsPanel />
</Tabs.Panel>
  );
}
