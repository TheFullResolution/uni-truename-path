import { Badge, Code, Group, Stack, Text } from '@mantine/core';
import type { OAuthEvent } from '@/types/database';

interface OAuthEventDetailsProps {
  event: OAuthEvent;
  clientData?: {
display_name: string | null;
publisher_domain: string | null;
  } | null;
  contextData?: {
name: string;
  } | null;
}

export function OAuthEventDetails({
  event,
  clientData,
  contextData,
}: OAuthEventDetailsProps) {
  const getActionDescription = (action: string) => {
switch (action) {
  case 'authorize':
return 'Application requested and received authorization to access your identity';
  case 'resolve':
return 'Application resolved your identity information for display';
  case 'revoke':
return 'Application access was revoked and tokens invalidated';
  case 'assign_context':
return 'Context assignment was modified for this application';
  default:
return `OAuth action: ${action}`;
}
  };

  const getPerformanceColor = (ms: number | null) => {
if (!ms) return 'gray';
if (ms < 1500) return 'green';
if (ms < 3000) return 'yellow';
return 'red';
  };

  return (
<Stack gap='xs'>
  <Text size='sm' c='dimmed'>
{getActionDescription(event.action)}
  </Text>

  <Group gap='md' wrap='nowrap'>
{/* Application Info */}
<Stack gap={2} flex={1}>
  <Text size='xs' fw={500} c='dimmed'>
Application
  </Text>
  <Text size='sm' fw={500}>
{clientData?.display_name || 'Unknown App'}
  </Text>
  {clientData?.publisher_domain && (
<Text size='xs' c='dimmed'>
  {clientData.publisher_domain}
</Text>
  )}
  <Code c='dimmed' fz='xs'>
{event.client_id}
  </Code>
</Stack>

{/* Context Info */}
<Stack gap={2} flex={1}>
  <Text size='xs' fw={500} c='dimmed'>
Context
  </Text>
  {contextData ? (
<Badge size='sm' variant='light' color='violet'>
  {contextData.name}
</Badge>
  ) : (
<Text size='sm' c='dimmed'>
  Default Identity
</Text>
  )}
</Stack>

{/* Performance Metrics */}
{event.response_time_ms !== null && (
  <Stack gap={2} align='center'>
<Text size='xs' fw={500} c='dimmed'>
  Response Time
</Text>
<Badge
  size='sm'
  color={getPerformanceColor(event.response_time_ms)}
  variant='light'
>
  {event.response_time_ms}ms
</Badge>
  </Stack>
)}
  </Group>

  {/* Session ID if available */}
  {event.session_id && (
<Group gap='xs' align='center'>
  <Text size='xs' c='dimmed'>
Session:
  </Text>
  <Code fz='xs'>{event.session_id.substring(0, 8)}...</Code>
</Group>
  )}

  {/* Error Details */}
  {!event.success && event.error_type && (
<Group gap='xs' align='center'>
  <Text size='xs' c='red' fw={500}>
Error:
  </Text>
  <Badge size='xs' color='red' variant='light'>
{event.error_type}
  </Badge>
</Group>
  )}
</Stack>
  );
}
