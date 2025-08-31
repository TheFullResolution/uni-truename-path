'use client';

import { ConnectedAppsPanel } from '@/components/connected-apps/ConnectedAppsPanel';
import { TabPanel } from '@/components/dashboard/TabPanel';

export function ConnectedAppsTab() {
  return (
<TabPanel
  value='connected-apps'
  title='Connected Applications'
  description='Manage OAuth applications that have access to your identity information'
>
  <ConnectedAppsPanel />
</TabPanel>
  );
}
