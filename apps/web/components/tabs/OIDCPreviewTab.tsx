'use client';

import { useAuth } from '@/utils/context';
import type { ResolveNameResponseData } from '@/app/api/names/types';
import { swrFetcher } from '@/utils/swr-fetcher';
import { CACHE_KEYS } from '@/utils/swr-keys';
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  SegmentedControl,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconBrandAuth0 } from '@tabler/icons-react';
import { useState } from 'react';
import useSWR from 'swr';

// Response types

interface ContextsResponseData {
  status: 'success' | 'error';
  data?: Array<{
id: string;
context_name: string;
description: string | null;
  }>;
  message?: string;
}

interface ConsentsResponseData {
  status: 'success' | 'error';
  data?: Array<{
id: string;
requester_user_id: string;
granter_user_id: string;
requester_email: string;
context_name: string;
status: 'PENDING' | 'GRANTED' | 'REVOKED' | 'EXPIRED';
  }>;
  message?: string;
}

// =============================================================================
// Component
// =============================================================================

export function OIDCPreviewTab() {
  const { user } = useAuth();
  const { data: contexts } = useSWR<ContextsResponseData>(
user ? CACHE_KEYS.CONTEXTS : null,
swrFetcher<ContextsResponseData>,
  );
  const { data: consents } = useSWR<ConsentsResponseData>(
user ? CACHE_KEYS.CONSENTS : null,
swrFetcher<ConsentsResponseData>,
  );

  const [selectedContext, setSelectedContext] = useState<string>('');
  const [audienceType, setAudienceType] = useState<'consent' | 'direct'>(
'direct',
  );
  const [consentId, setConsentId] = useState<string>('');
  const [directUserId, setDirectUserId] = useState<string>('');
  const [isResolving, setIsResolving] = useState(false);
  const [response, setResponse] = useState<ResolveNameResponseData | null>(
null,
  );
  const [error, setError] = useState<string | null>(null);
  const [responseHistory, setResponseHistory] = useState<
ResolveNameResponseData[]
  >([]);

  const handleResolve = async () => {
if (!user) return;

setIsResolving(true);
setError(null);

try {
  let requesterId: string;

  if (audienceType === 'consent' && consentId) {
const consent = consents?.data?.find((c) => c.id === consentId);
if (!consent) {
  throw new Error('Selected consent not found');
}
requesterId = consent.requester_user_id;
  } else if (audienceType === 'direct' && directUserId) {
requesterId = directUserId;
  } else {
throw new Error(
  'Please select audience type and provide required information',
);
  }

  const params = new URLSearchParams({
context: selectedContext,
requester_id: requesterId,
  });

  const res = await fetch(`/api/names/resolve?${params}`, {
credentials: 'include',
  });

  if (!res.ok) {
const errorData = await res.json();
throw new Error(errorData.message || 'Failed to resolve name');
  }

  const data: ResolveNameResponseData = await res.json();
  setResponse(data);
  setResponseHistory((prev) => [data, ...prev].slice(0, 10)); // Keep last 10
} catch (err) {
  setError(err instanceof Error ? err.message : 'An error occurred');
} finally {
  setIsResolving(false);
}
  };

  const activeConsents =
consents?.data?.filter(
  (c) => c.status === 'GRANTED' && c.granter_user_id === user?.id,
) || [];

  return (
<Tabs.Panel value='oidc-preview'>
  <Stack>
<Card shadow='sm'>
  <Stack>
<Title order={3}>Name Resolution Preview</Title>
<Text size='sm' c='dimmed'>
  Test how your names resolve for different audiences and contexts.
  This simulates how your identity appears when accessed through
  OAuth/OIDC flows.
</Text>

<Select
  label='Context'
  placeholder='Select context to test'
  description='The context determines which name is shown'
  data={
contexts?.data?.map((c) => ({
  value: c.context_name,
  label: c.context_name,
})) || []
  }
  value={selectedContext}
  onChange={(value) => setSelectedContext(value || '')}
/>

<SegmentedControl
  value={audienceType}
  onChange={(value) =>
setAudienceType(value as 'consent' | 'direct')
  }
  data={[
{ label: 'Test with Consent', value: 'consent' },
{ label: 'Direct User ID', value: 'direct' },
  ]}
/>

{audienceType === 'consent' ? (
  <Select
label='Select Active Consent'
placeholder='Choose a consent to test with'
description='Test resolution for a user who has consent to see your name'
data={activeConsents.map((c) => ({
  value: c.id,
  label: `${c.requester_email} - ${c.context_name}`,
}))}
value={consentId}
onChange={(value) => setConsentId(value || '')}
  />
) : (
  <TextInput
label='Requester User ID'
placeholder='Enter user ID (UUID)'
description='Simulate resolution for a specific user ID'
value={directUserId}
onChange={(e) => setDirectUserId(e.currentTarget.value)}
  />
)}

<Button
  onClick={handleResolve}
  loading={isResolving}
  disabled={
!selectedContext ||
(audienceType === 'consent' ? !consentId : !directUserId)
  }
  leftSection={<IconBrandAuth0 size={16} />}
>
  Resolve Name
</Button>

{error && (
  <Alert color='red' icon={<IconAlertCircle size={16} />}>
{error}
  </Alert>
)}

{response && (
  <Card withBorder>
<Stack gap='xs'>
  <Group justify='apart'>
<Text fw={500}>Resolution Result</Text>
<Badge color='green'>Success</Badge>
  </Group>
  <Group>
<Text size='sm' c='dimmed'>
  Resolved Name:
</Text>
<Text fw={500}>{response.resolved_name}</Text>
  </Group>
  <Group>
<Text size='sm' c='dimmed'>
  Source:
</Text>
<Badge variant='light'>{response.source}</Badge>
  </Group>
  {response.metadata?.processing_time_ms !== undefined && (
<Group>
  <Text size='sm' c='dimmed'>
Processing Time:
  </Text>
  <Text size='sm'>
{response.metadata.processing_time_ms.toFixed(2)}ms
  </Text>
</Group>
  )}
  {response.metadata?.context_name && (
<Group>
  <Text size='sm' c='dimmed'>
Context Used:
  </Text>
  <Text size='sm'>{response.metadata.context_name}</Text>
</Group>
  )}
</Stack>
  </Card>
)}
  </Stack>
</Card>

{responseHistory.length > 0 && (
  <Card shadow='sm'>
<Stack>
  <Title order={4}>Resolution History</Title>
  <Stack gap='xs'>
{responseHistory.map((res, index) => (
  <Card key={index} withBorder p='xs'>
<Group justify='apart'>
  <Group gap='xs'>
<Text size='sm' fw={500}>
  {res.resolved_name}
</Text>
<Badge size='sm' variant='light'>
  {res.source}
</Badge>
  </Group>
  {res.metadata?.processing_time_ms !== undefined && (
<Text size='xs' c='dimmed'>
  {res.metadata.processing_time_ms.toFixed(2)}ms
</Text>
  )}
</Group>
  </Card>
))}
  </Stack>
</Stack>
  </Card>
)}
  </Stack>
</Tabs.Panel>
  );
}
