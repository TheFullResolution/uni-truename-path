'use client';

import { useState } from 'react';
import { Stack, Button, Group, Alert, Text, Radio, Badge } from '@mantine/core';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import type { UserContext } from '@/types/database';
import type {
  OAuthClientRegistryInfo,
  AppContextAssignment,
} from '@/app/api/oauth/types';

interface OAuthAuthorizeClientProps {
  app: OAuthClientRegistryInfo;
  contexts: UserContext[];
  existingAssignment?: AppContextAssignment;
  returnUrl: string;
  state: string;
}

export function OAuthAuthorizeClient({
  app,
  contexts,
  existingAssignment,
  returnUrl,
  state,
}: OAuthAuthorizeClientProps) {
  // Auto-select default context
  const defaultContextId =
existingAssignment?.context_id ||
contexts.find((c) => c.is_permanent)?.id ||
contexts[0]?.id ||
'';

  const [selectedContext, setSelectedContext] = useState(defaultContextId);
  const [isLoading, setIsLoading] = useState(false);

  const selectedContextData = contexts.find((c) => c.id === selectedContext);

  const handleAuthorize = async () => {
if (!selectedContext) return;

setIsLoading(true);

try {
  const response = await fetch('/api/oauth/authorize', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
credentials: 'include',
body: JSON.stringify({
  client_id: app.client_id,
  context_id: selectedContext,
  return_url: returnUrl,
  state,
}),
  });

  const result = await response.json();
  if (result.success) {
window.location.href = result.data.redirect_url;
  } else {
throw new Error(result.message || 'Authorization failed');
  }
} catch (error) {
  console.error('Authorization error:', error);
  // Simple error handling for academic demo
  alert('Authorization failed. Please try again.');
} finally {
  setIsLoading(false);
}
  };

  const handleDeny = () => {
window.location.href = `${returnUrl}?error=access_denied${state ? `&state=${state}` : ''}`;
  };

  // Simple context check
  if (!contexts?.length) {
return (
  <Alert
icon={<IconAlertCircle size={16} />}
title='No Contexts Available'
color='red'
variant='light'
  >
<Text size='md'>
  You need at least one identity context to authorize applications.
  Please set up your contexts in your dashboard first.
</Text>
  </Alert>
);
  }

  return (
<Stack gap='lg' data-testid='oauth-authorize-form'>
  {/* Context Selection */}
  <Radio.Group
value={selectedContext}
onChange={setSelectedContext}
label='Select Identity Context'
description='Choose which version of your name information this application will receive'
required
data-testid='context-selector-radio-group'
styles={{
  label: { fontSize: 'var(--mantine-font-size-lg)', fontWeight: 500 },
  description: { fontSize: 'var(--mantine-font-size-md)' },
}}
  >
<Stack gap='sm' mt='md'>
  {contexts.map((context) => (
<Radio.Card
  radius='md'
  value={context.id}
  key={context.id}
  p='md'
  styles={{
card: {
  'cursor': 'pointer',
  'transition': 'border-color 0.2s ease',
  '&:hover': {
borderColor: 'var(--mantine-color-blue-5)',
  },
},
  }}
>
  <Group wrap='nowrap' align='flex-start'>
<Radio.Indicator />
<div style={{ flex: 1 }}>
  <Text size='md' fw={500}>
{context.context_name}
  </Text>
  <Text size='sm' c='dimmed' lineClamp={2}>
{context.description}
  </Text>
  {existingAssignment?.context_id === context.id && (
<Badge size='xs' color='green' mt='xs'>
  Currently authorized
</Badge>
  )}
</div>
  </Group>
</Radio.Card>
  ))}
</Stack>
  </Radio.Group>

  {/* Impact Explanation */}
  {selectedContextData && (
<Alert
  color='blue'
  variant='light'
  icon={<IconAlertCircle size={16} />}
  mb='md'
  data-testid='oauth-authorization-summary'
>
  <Text size='sm'>
<strong>{app.display_name}</strong> will see your{' '}
<strong>{selectedContextData.context_name}</strong> information:{' '}
{selectedContextData.description}
  </Text>
</Alert>
  )}

  <Group justify='space-between' mt='lg'>
<Button
  variant='subtle'
  size='md'
  onClick={handleDeny}
  disabled={isLoading}
  leftSection={<IconX size={16} />}
  data-testid='oauth-deny-button'
>
  Cancel
</Button>
<Button
  variant='filled'
  color='blue'
  size='md'
  onClick={handleAuthorize}
  loading={isLoading}
  disabled={!selectedContext || !selectedContextData}
  leftSection={<IconCheck size={16} />}
  data-testid='oauth-authorize-button'
>
  {isLoading ? 'Authorizing...' : 'Authorize Application'}
</Button>
  </Group>

  <Text size='sm' c='dimmed' ta='center' mt='md'>
You can revoke this authorization anytime from your dashboard. The
application will only access names from your selected context.
  </Text>
</Stack>
  );
}
