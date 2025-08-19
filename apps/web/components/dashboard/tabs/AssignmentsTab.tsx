'use client';

import { Tabs } from '@mantine/core';
import { ContextAssignmentPanel } from '@/components/contexts';

interface AssignmentsTabProps {
  onRefreshContexts: () => void;
}

export default function AssignmentsTab({
  onRefreshContexts,
}: AssignmentsTabProps) {
  return (
<Tabs.Panel value='assign' pt='xl' data-testid='tab-content-assign'>
  <ContextAssignmentPanel
onRefresh={() => {
  onRefreshContexts();
}}
  />
</Tabs.Panel>
  );
}
