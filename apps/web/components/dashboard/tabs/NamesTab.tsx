'use client';

import { Grid, Tabs } from '@mantine/core';
import type { AuthenticatedUser } from '@/utils/context';
import { NameCreationForm, NameManagement } from '@/components/contexts';

interface NamesTabProps {
  user: AuthenticatedUser | null;
}

export default function NamesTab({ user }: NamesTabProps) {
  return (
<Tabs.Panel value='names' pt='xl' data-testid='tab-content-names'>
  <Grid>
{/* Name Creation Form */}
<Grid.Col span={{ base: 12, lg: 5 }}>
  <NameCreationForm />
</Grid.Col>

{/* Name Management */}
<Grid.Col span={{ base: 12, lg: 7 }}>
  <NameManagement userId={user?.id || ''} />
</Grid.Col>
  </Grid>
</Tabs.Panel>
  );
}
