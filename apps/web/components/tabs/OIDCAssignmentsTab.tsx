'use client';

import { OIDCAssignmentPanel } from '@/components/panels/OIDCAssignmentPanel';
import type { ContextWithStats } from '@/app/api/contexts/types';
import { useAuth } from '@/utils/context';
import { formatSWRError, swrFetcher } from '@/utils/swr-fetcher';
import { CACHE_KEYS } from '@/utils/swr-keys';
import {
  Alert,
  Badge,
  Card,
  Center,
  Group,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertTriangle, IconKey, IconUser } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

export function OIDCAssignmentsTab() {
  const { user } = useAuth();

  const {
data: contextsData = [],
error: contextsError,
mutate: mutateContexts,
isLoading: contextsLoading,
  } = useSWR<ContextWithStats[]>(
user?.id ? CACHE_KEYS.CONTEXTS : null,
swrFetcher,
  );

  const [selectedContextId, setSelectedContextId] = useState<string | null>(
null,
  );

  // Auto-select default context when data loads
  useEffect(() => {
if (contextsData.length > 0 && !selectedContextId) {
  // Find default/permanent context
  const defaultContext = contextsData.find(
(ctx) => ctx.is_permanent === true || ctx.context_name === 'Default',
  );
  if (defaultContext) {
setSelectedContextId(defaultContext.id);
  }
}
  }, [contextsData, selectedContextId]);

  // =============================================================================
  // Render
  // =============================================================================

  return (
<Tabs.Panel value='oidc-assign'>
  <Stack gap='lg'>
{/* Header */}
<Paper withBorder p='md'>
  <Group justify='space-between'>
<div>
  <Title order={3}>OIDC Property Assignments</Title>
  <Text size='sm' c='dimmed'>
Assign specific OIDC properties (name, given_name, family_name,
etc.) to your contexts
<br />
This replaces the legacy one-name-per-context model with
property-granular assignments
  </Text>
</div>
<Badge
  variant='light'
  color='blue'
  leftSection={<IconKey size={14} />}
>
  OpenID Connect 1.0
</Badge>
  </Group>
</Paper>

{/* Context Selection */}
<Card withBorder>
  <Stack gap='md'>
<Group justify='space-between'>
  <Title order={5}>Context Selection</Title>
  <Badge variant='outline' color='gray'>
{contextsData.length} Contexts
  </Badge>
</Group>

{contextsLoading ? (
  <Skeleton height={40} />
) : contextsError ? (
  <Alert
icon={<IconAlertTriangle size={16} />}
title='Loading Error'
color='red'
variant='light'
  >
{formatSWRError(contextsError)}
  </Alert>
) : contextsData.length === 0 ? (
  <Center py='md'>
<Stack align='center' gap='sm'>
  <IconUser
size={48}
stroke={1}
color='var(--mantine-color-dimmed)'
  />
  <Text c='dimmed' ta='center' size='sm'>
No contexts available. Create a context first to assign OIDC
properties.
  </Text>
</Stack>
  </Center>
) : (
  <Select
label='Select Context'
description={
  selectedContextId &&
  contextsData.find(
(ctx) =>
  ctx.id === selectedContextId &&
  (ctx.is_permanent || ctx.context_name === 'Default'),
  )
? 'Default context auto-selected. Choose a different context to manage its OIDC property assignments.'
: 'Choose a context to manage its OIDC property assignments'
}
placeholder='Select a context'
value={selectedContextId}
onChange={setSelectedContextId}
data={contextsData.map((ctx) => ({
  value: ctx.id,
  label: `${ctx.context_name}${ctx.is_permanent || ctx.context_name === 'Default' ? ' (Default)' : ''}${ctx.description ? ` - ${ctx.description}` : ''}`,
}))}
leftSection={<IconUser size={16} />}
searchable
clearable
  />
)}
  </Stack>
</Card>

{/* OIDC Assignment Panel */}
<OIDCAssignmentPanel
  selectedContextId={selectedContextId}
  contexts={contextsData}
  onRefresh={mutateContexts}
/>

{/* Help Text */}
<Paper withBorder p='md' bg='gray.0'>
  <Stack gap='xs'>
<Title order={6}>How OIDC Property Assignments Work</Title>
<Text size='sm' c='dimmed'>
  • <strong>Property Types:</strong> Assign specific OIDC properties
  like `given_name`, `family_name`, `nickname` to contexts
</Text>
<Text size='sm' c='dimmed'>
  • <strong>Multiple Properties:</strong> Each context can have
  multiple property assignments
</Text>
<Text size='sm' c='dimmed'>
  • <strong>Visibility Control:</strong> Set visibility levels
  (Standard, Restricted, Private) for each property
</Text>
<Text size='sm' c='dimmed'>
  • <strong>Scope Control:</strong> Define which OAuth scopes can
  access each property in each context
</Text>
<Text size='sm' c='dimmed'>
  • <strong>OIDC Compliant:</strong> Fully compliant with OpenID
  Connect Core 1.0 standard
</Text>
  </Stack>
</Paper>
  </Stack>
</Tabs.Panel>
  );
}
