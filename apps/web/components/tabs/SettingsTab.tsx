'use client';

import { Grid } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  AccountSection,
  SecuritySection,
  PrivacySection,
  DangerZone,
} from '@/components/settings';
import { DeleteAccountModal } from '@/components/modals/DeleteAccountModal';
import { TabPanel } from '@/components/dashboard/TabPanel';

export function SettingsTab() {
  const [
deleteModalOpened,
{ open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  return (
<TabPanel
  value='settings'
  title='Account Settings'
  description='Manage your account preferences and security settings'
>
  <Grid gutter='lg'>
<Grid.Col span={{ base: 12, md: 6 }}>
  <AccountSection />
</Grid.Col>
<Grid.Col span={{ base: 12, md: 6 }}>
  <SecuritySection />
</Grid.Col>
<Grid.Col span={12}>
  <PrivacySection />
</Grid.Col>
<Grid.Col span={12}>
  <DangerZone onDeleteAccount={openDeleteModal} />
</Grid.Col>
  </Grid>

  <DeleteAccountModal
opened={deleteModalOpened}
onClose={closeDeleteModal}
  />
</TabPanel>
  );
}
