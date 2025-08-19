'use client';

import { Card, Text, Tabs } from '@mantine/core';

export default function ConsentsTab() {
  return (
<Tabs.Panel value='consents' pt='xl' data-testid='tab-content-consents'>
  <Card p='xl' shadow='sm' withBorder radius='lg'>
<Text size='lg' fw={500} mb='md'>
  Consent Management
</Text>
<Text c='dimmed'>
  Consent management functionality will be implemented in future
  iterations. This will allow users to manage GDPR-compliant consent for
  data sharing across different contexts.
</Text>
  </Card>
</Tabs.Panel>
  );
}
