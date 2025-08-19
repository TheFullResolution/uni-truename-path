'use client';

import { Grid, Tabs } from '@mantine/core';
import type { ContextWithStats } from '@/app/api/contexts/types';
import { ContextForm, ContextList } from '@/components/contexts';

interface ContextsTabProps {
  contexts: ContextWithStats[];
  contextsLoading: boolean;
  contextsError: Error | null;
  onEditContext: (context: ContextWithStats) => void;
  onDeleteContext: (context: ContextWithStats) => void;
  onRefreshContexts: () => void;
}

export default function ContextsTab({
  contexts,
  contextsLoading,
  contextsError,
  onEditContext,
  onDeleteContext,
  onRefreshContexts,
}: ContextsTabProps) {
  return (
<Tabs.Panel value='contexts' pt='xl' data-testid='tab-content-contexts'>
  <Grid>
{/* Create Context Form */}
<Grid.Col span={{ base: 12, lg: 5 }}>
  <ContextForm />
</Grid.Col>

{/* Context List */}
<Grid.Col span={{ base: 12, lg: 7 }}>
  <ContextList
contexts={contexts}
loading={contextsLoading}
error={contextsError}
onEdit={onEditContext}
onDelete={onDeleteContext}
onRefresh={onRefreshContexts}
  />
</Grid.Col>
  </Grid>
</Tabs.Panel>
  );
}
