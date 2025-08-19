'use client';

import { Tabs } from '@mantine/core';
import { SettingsPanel } from '../panels';

export default function SettingsTab() {
  return (
<Tabs.Panel value='settings' pt='xl' data-testid='tab-content-settings'>
  <SettingsPanel />
</Tabs.Panel>
  );
}
