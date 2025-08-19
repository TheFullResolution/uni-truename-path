'use client';

import { Tabs } from '@mantine/core';
import type { AuthenticatedUser } from '@/utils/context';
import { AssignmentPreview } from '@/components/contexts';

interface PreviewTabProps {
  user: AuthenticatedUser | null;
}

export default function PreviewTab({ user }: PreviewTabProps) {
  return (
<Tabs.Panel value='preview' pt='xl' data-testid='tab-content-preview'>
  <AssignmentPreview userId={user?.id || ''} />
</Tabs.Panel>
  );
}
