'use client';

import { ConnectedApp } from '@/types/oauth';
import { ContextWithStats } from '@/app/api/contexts/types';
import { Badge, Card, Divider, Group, Stack, Text } from '@mantine/core';
import { ContextSelectorFiltered } from './ContextSelectorFiltered';
import { AppRevocationButton } from './AppRevocationButton';

interface ConnectedAppCardProps {
  app: ConnectedApp;
  availableContexts: ContextWithStats[];
  onRevalidate?: () => void;
}

export function ConnectedAppCard({
  app,
  availableContexts,
  onRevalidate,
}: ConnectedAppCardProps) {
  const lastUsed = app.last_used_at
? new Date(app.last_used_at).toLocaleDateString()
: 'Never';

  return (
<Card p='md' withBorder>
  <Stack gap='sm'>
<Group gap='xs' align='center' mb={4}>
  <Text fw={600} size='lg' data-testid='connected-app-title'>
{app.display_name}
  </Text>
  <Badge size='sm' variant='light' color='blue'>
{app.publisher_domain}
  </Badge>
  <Badge size='sm' variant='light' color='cyan'>
{app.context_name}
  </Badge>
</Group>

<Group justify='space-between' align='center'>
  <Stack gap={2}>
<ContextSelectorFiltered
  clientId={app.client_id}
  currentContextId={app.context_id}
  availableContexts={availableContexts}
  appName={app.display_name}
  onRevalidate={onRevalidate}
/>
<Text size='xs' c='dimmed'>
  Complete contexts only
</Text>
  </Stack>
  <AppRevocationButton
clientId={app.client_id}
appName={app.display_name}
onRevalidate={onRevalidate}
  />
</Group>

<Divider />

<Group justify='space-between' align='center'>
  <Text size='sm' c='dimmed'>
Last used: {lastUsed}
  </Text>
  <Text size='sm' c='dimmed'>
{app.total_usage_count} use{app.total_usage_count !== 1 ? 's' : ''}
  </Text>
</Group>
  </Stack>
</Card>
  );
}
