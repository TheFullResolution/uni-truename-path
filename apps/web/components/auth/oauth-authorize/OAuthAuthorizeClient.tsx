'use client';

import {
  Stack,
  Button,
  Group,
  Alert,
  Text,
  Radio,
  Badge,
  Box,
} from '@mantine/core';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import useSWRMutation from 'swr/mutation';
import { createMutationFetcher } from '@/utils/swr-fetcher';
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

// Types for the authorization request and response
interface AuthorizeRequest {
  client_id: string;
  context_id: string;
  return_url: string;
  state: string;
}

interface AuthorizeResponse {
  redirect_url: string;
}

// Form values interface
interface FormValues {
  contextId: string;
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

  // Initialize form with useForm hook
  const form = useForm<FormValues>({
mode: 'controlled',
initialValues: {
  contextId: defaultContextId,
},
validate: {
  contextId: (value) => {
if (!value) {
  return 'Please select an identity context';
}
// Verify the context exists in the available contexts
const contextExists = contexts.some((c) => c.id === value);
if (!contextExists) {
  return 'Selected context is not available';
}
return null;
  },
},
  });

  // Use SWR mutation for the authorization request
  const { trigger: authorize, isMutating: isLoading } = useSWRMutation<
AuthorizeResponse,
Error,
'/api/oauth/authorize',
AuthorizeRequest
  >(
'/api/oauth/authorize',
createMutationFetcher<AuthorizeResponse, AuthorizeRequest>('POST'),
{
  onSuccess: (data) => {
// Redirect to the OAuth callback URL with authorization code
window.location.href = data.redirect_url;
  },
  onError: (error) => {
console.error('Authorization error:', error);

// Show error notification
notifications.show({
  title: 'Authorization Failed',
  message:
error.message ||
'Failed to authorize the application. Please try again.',
  color: 'red',
  icon: <IconX size={16} />,
  autoClose: 6000,
});
  },
},
  );

  // Get selected context data for display
  const selectedContextData = contexts.find(
(c) => c.id === form.values.contextId,
  );

  // Handle form submission
  const handleAuthorize = async () => {
// Validate form
const validation = form.validate();
if (validation.hasErrors) {
  return;
}

// Trigger the mutation
await authorize({
  client_id: app.client_id,
  context_id: form.values.contextId,
  return_url: returnUrl,
  state,
});
  };

  const handleDeny = () => {
// Show notification about denial
notifications.show({
  title: 'Authorization Denied',
  message: 'You have denied access to this application',
  color: 'orange',
  icon: <IconAlertCircle size={16} />,
  autoClose: 3000,
});

// Redirect back with error
setTimeout(() => {
  window.location.href = `${returnUrl}?error=access_denied${state ? `&state=${state}` : ''}`;
}, 500);
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
{...form.getInputProps('contextId')}
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
<Box flex={1}>
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
</Box>
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
  disabled={!form.values.contextId || !selectedContextData}
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
