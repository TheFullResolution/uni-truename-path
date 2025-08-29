'use client';

import { ConnectedApp } from '@/types/oauth';
import { UserContext } from '@/types/database';
import { swrFetcher } from '@/utils/swr-fetcher';
import { Badge, Card, Divider, Group, Stack, Text } from '@mantine/core';
import { useAuth } from '@/utils/context';
import useSWR from 'swr';
import { ContextAssignmentDropdown } from './ContextAssignmentDropdown';
import { AppRevocationButton } from './AppRevocationButton';

interface ConnectedAppCardProps {
  app: ConnectedApp;
  onRevoke?: (clientId: string) => Promise<void>;
  onContextChange?: (clientId: string, newContextId: string) => Promise<void>;
}

export function ConnectedAppCard({
  app,
  onRevoke,
  onContextChange,
}: ConnectedAppCardProps) {
  const { user } = useAuth();
  const lastUsed = app.last_used_at
? new Date(app.last_used_at).toLocaleDateString()
: 'Never';

  // Fetch user contexts for the dropdown
  const { data: contextsResponse } = useSWR<UserContext[]>(
user?.id ? '/api/contexts' : null,
swrFetcher,
  );

  const availableContexts = contextsResponse || [];

  return (
<Card p='md' withBorder>
  <Stack gap='sm'>
<Group gap='xs' align='center' mb={4}>
  <Text fw={600} size='lg'>
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
  <ContextAssignmentDropdown
clientId={app.client_id}
currentContextId={app.context_id}
availableContexts={availableContexts}
onChange={onContextChange}
  />
  <AppRevocationButton
clientId={app.client_id}
appName={app.display_name}
onRevoked={(clientId) => onRevoke?.(clientId)}
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
