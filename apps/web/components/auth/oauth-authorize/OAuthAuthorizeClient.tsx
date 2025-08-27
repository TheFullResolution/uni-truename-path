'use client';

import { useState } from 'react';
import {
  Stack,
  Button,
  Group,
  Alert,
  Text,
  RadioGroup,
  Radio,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconShield,
} from '@tabler/icons-react';
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
<Text size='sm'>
  You need at least one context to authorize applications.
</Text>
  </Alert>
);
  }

  return (
<Stack gap='lg' data-testid='oauth-authorize-form'>
  <Alert
icon={<IconShield size={16} />}
title={app.display_name}
color='blue'
variant='light'
data-testid='oauth-app-info'
  >
<Group justify='space-between' align='center' mb='xs'>
  <Text size='sm'>
{app.app_name || 'Third-party application requesting access'}
  </Text>
</Group>
<Text size='xs' c='dimmed'>
  From: {app.publisher_domain}
</Text>
  </Alert>

  {/* Context Selection */}
  <RadioGroup
value={selectedContext}
onChange={setSelectedContext}
label='Select Context'
description='Choose which identity context this application should see'
required
data-testid='context-selector-radio-group'
  >
<Stack gap='xs' mt='xs'>
  {contexts.map((context) => (
<Radio
  key={context.id}
  value={context.id}
  label={
<Stack gap={2}>
  <Text size='sm' fw={500}>
{context.context_name}
  </Text>
  {context.description && (
<Text size='xs' c='dimmed'>
  {context.description}
</Text>
  )}
  {existingAssignment?.context_id === context.id && (
<Text size='xs' c='green.6' fw={500}>
  Currently authorized
</Text>
  )}
</Stack>
  }
/>
  ))}
</Stack>
  </RadioGroup>

  {selectedContextData && (
<Alert
  icon={<IconShield size={16} />}
  title='Authorization Summary'
  color='green'
  variant='light'
  data-testid='oauth-authorization-summary'
>
  <Text size='sm'>
<strong>{app.display_name}</strong> from{' '}
<strong>{app.publisher_domain}</strong> will see your{' '}
<strong>{selectedContextData.context_name}</strong> identity.
  </Text>
</Alert>
  )}

  <Group justify='space-between'>
<Button
  variant='light'
  color='gray'
  onClick={handleDeny}
  disabled={isLoading}
  leftSection={<IconX size={16} />}
  data-testid='oauth-deny-button'
>
  Deny Access
</Button>
<Button
  onClick={handleAuthorize}
  loading={isLoading}
  disabled={!selectedContext || !selectedContextData}
  leftSection={<IconCheck size={16} />}
  color='green'
  data-testid='oauth-authorize-button'
>
  {isLoading ? 'Authorizing...' : 'Authorize Access'}
</Button>
  </Group>

  <Text size='xs' c='gray.6' ta='center'>
<strong>Privacy Notice:</strong> This application will only receive
authorized names.
  </Text>
</Stack>
  );
}
