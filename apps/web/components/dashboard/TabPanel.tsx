import { Box, Group, Tabs, Text, Title } from '@mantine/core';
import { ReactNode } from 'react';

interface TabPanelProps {
  value: string; // The tab value (e.g., 'dashboard', 'contexts')
  title?: string; // Optional tab title (e.g., "Account Settings")
  description?: string; // Optional description text
  actions?: ReactNode; // Optional action buttons (e.g., refresh, add)
  children: ReactNode; // The tab content
}

export function TabPanel({
  value,
  title,
  description,
  actions,
  children,
}: TabPanelProps) {
  return (
<Tabs.Panel value={value}>
  {(title || actions || description) && (
<Box mb='lg'>
  {(title || actions) && (
<Group justify='space-between' mb={description ? 'md' : 'lg'}>
  {title && <Title order={2}>{title}</Title>}
  {actions && actions}
</Group>
  )}

  {description && (
<Text size='sm' c='dimmed' mb='lg'>
  {description}
</Text>
  )}
</Box>
  )}

  {children}
</Tabs.Panel>
  );
}
