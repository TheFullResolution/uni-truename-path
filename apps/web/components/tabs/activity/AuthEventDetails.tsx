import { Badge, Code, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconMapPin, IconDeviceDesktop, IconShield } from '@tabler/icons-react';
import type { AuthEvent } from '@/types/database';

interface AuthEventDetailsProps {
  event: AuthEvent;
}

export function AuthEventDetails({ event }: AuthEventDetailsProps) {
  const getEventDescription = (eventType: string) => {
switch (eventType) {
  case 'login':
return 'User successfully authenticated and session created';
  case 'logout':
return 'User session terminated and tokens invalidated';
  case 'signup':
return 'New user account created and verified';
  case 'failed_login':
return 'Authentication attempt failed due to invalid credentials';
  case 'session_expired':
return 'User session expired and was automatically terminated';
  default:
return `Authentication event: ${eventType}`;
}
  };

  const parseUserAgent = (userAgent: string | null) => {
if (!userAgent) return null;

// Simple user agent parsing - in production you might use a library like ua-parser-js
const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
const isChrome = /Chrome/.test(userAgent);
const isFirefox = /Firefox/.test(userAgent);
const isSafari = /Safari/.test(userAgent) && !isChrome;

let browser = 'Unknown';
if (isChrome) browser = 'Chrome';
else if (isFirefox) browser = 'Firefox';
else if (isSafari) browser = 'Safari';

const platform = isMobile ? 'Mobile' : 'Desktop';

return { browser, platform, isMobile };
  };

  const userAgentInfo = parseUserAgent(event.user_agent);

  const getSecurityRiskLevel = () => {
if (!event.success)
  return { level: 'high', color: 'red', label: 'Failed Attempt' };
if (event.event_type === 'login')
  return { level: 'medium', color: 'yellow', label: 'Login Event' };
if (event.event_type === 'signup')
  return { level: 'low', color: 'green', label: 'Account Creation' };
return { level: 'low', color: 'blue', label: 'Normal Activity' };
  };

  const securityRisk = getSecurityRiskLevel();

  return (
<Stack gap='xs'>
  <Text size='sm' c='dimmed'>
{getEventDescription(event.event_type)}
  </Text>

  <Group gap='md' wrap='nowrap'>
{/* Device & Browser Info */}
<Stack gap={2} flex={1}>
  <Group gap={4} align='center'>
<IconDeviceDesktop size={12} />
<Text size='xs' fw={500} c='dimmed'>
  Device
</Text>
  </Group>

  {userAgentInfo ? (
<>
  <Text size='sm' fw={500}>
{userAgentInfo.browser} ({userAgentInfo.platform})
  </Text>
  <Badge
size='xs'
variant='light'
color={userAgentInfo.isMobile ? 'blue' : 'gray'}
  >
{userAgentInfo.isMobile ? 'Mobile' : 'Desktop'}
  </Badge>
</>
  ) : (
<Text size='sm' c='dimmed'>
  Unknown Device
</Text>
  )}
</Stack>

{/* Location Info */}
<Stack gap={2} flex={1}>
  <Group gap={4} align='center'>
<IconMapPin size={12} />
<Text size='xs' fw={500} c='dimmed'>
  Location
</Text>
  </Group>

  {event.ip_address ? (
<>
  <Code fz='sm'>{event.ip_address}</Code>
  <Text size='xs' c='dimmed'>
{/* In production, you might resolve IP to location */}
IP Address
  </Text>
</>
  ) : (
<Text size='sm' c='dimmed'>
  Unknown
</Text>
  )}
</Stack>

{/* Security Assessment */}
<Stack gap={2} align='center'>
  <Group gap={4} align='center'>
<IconShield size={12} />
<Text size='xs' fw={500} c='dimmed'>
  Security
</Text>
  </Group>

  <Tooltip label={`Security assessment: ${securityRisk.label}`}>
<Badge size='sm' color={securityRisk.color} variant='light'>
  {securityRisk.level.toUpperCase()}
</Badge>
  </Tooltip>
</Stack>
  </Group>

  {/* Session Info */}
  {event.session_id && (
<Group gap='xs' align='center'>
  <Text size='xs' c='dimmed'>
Session:
  </Text>
  <Code fz='xs'>{event.session_id.substring(0, 8)}...</Code>
</Group>
  )}

  {/* Metadata */}
  {event.metadata && Object.keys(event.metadata).length > 0 && (
<Stack gap={2}>
  <Text size='xs' fw={500} c='dimmed'>
Additional Details
  </Text>
  <Group gap='xs'>
{Object.entries(event.metadata).map(([key, value]) => (
  <Badge key={key} size='xs' variant='outline'>
{key}: {String(value)}
  </Badge>
))}
  </Group>
</Stack>
  )}

  {/* Error Details */}
  {!event.success && event.error_message && (
<Stack gap={2}>
  <Text size='xs' c='red' fw={500}>
Error Details:
  </Text>
  <Text size='xs' c='red'>
{event.error_message}
  </Text>
</Stack>
  )}
</Stack>
  );
}
