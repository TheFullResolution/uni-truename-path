'use client';

import { ConsentsTabSkeleton } from '@/components/skeletons/ConsentsTabSkeleton';
import { Stack, Tabs, Text } from '@mantine/core';

export function ConsentsTab() {
  return (
<Tabs.Panel value='consents'>
  <Stack gap='lg'>
<Text size='sm' c='dimmed'>
  Manage consent relationships with other users
</Text>
<ConsentsTabSkeleton />
  </Stack>
</Tabs.Panel>
  );
}
