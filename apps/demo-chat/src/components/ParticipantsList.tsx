/**
 * ParticipantsList Component - Mock chat participants showcase
 * Demonstrates UserBadge components with various presence states and OIDC claims
 */

import { Stack, Paper, Title, Text } from '@mantine/core';
import { OIDCClaims } from '@uni-final/truename-oauth';
import { UserBadge } from './UserBadge';

// Mock participant data - essential OIDC claims for academic demo
const mockParticipants: Array<{
  userData: OIDCClaims;
  presence: 'online' | 'away' | 'offline';
}> = [
  {
userData: {
  sub: '1234567890',
  name: 'Alexandra Chen',
  given_name: 'Alexandra',
  family_name: 'Chen',
  nickname: 'Alex',
  preferred_username: 'alex_c',
  iss: 'https://truename.local/oauth',
  aud: 'demo-chat-app',
  iat: Math.floor(Date.now() / 1000),
  context_name: 'FRIENDS',
  app_name: 'demo-chat-app',
},
presence: 'online',
  },
  {
userData: {
  sub: '2345678901',
  name: 'Michael Rodriguez',
  given_name: 'Michael',
  family_name: 'Rodriguez',
  nickname: 'Mike',
  preferred_username: '',
  iss: 'https://truename.local/oauth',
  aud: 'demo-chat-app',
  iat: Math.floor(Date.now() / 1000),
  context_name: 'GAMING',
  app_name: 'demo-chat-app',
},
presence: 'away',
  },
  {
userData: {
  sub: '3456789012',
  name: 'Sarah Kim',
  given_name: 'Sarah',
  family_name: 'Kim',
  nickname: '',
  preferred_username: 'sarahk',
  iss: 'https://truename.local/oauth',
  aud: 'demo-chat-app',
  iat: Math.floor(Date.now() / 1000),
  context_name: 'CASUAL',
  app_name: 'demo-chat-app',
},
presence: 'online',
  },
];

export function ParticipantsList() {
  // Count participants by presence for summary
  const onlineCount = mockParticipants.filter(
(p) => p.presence === 'online',
  ).length;
  const totalCount = mockParticipants.length;

  return (
<Paper
  shadow='sm'
  radius='lg'
  p='md'
  style={{
backgroundColor: 'var(--mantine-color-gray-0)',
border: '1px solid var(--mantine-color-electric-2)',
boxShadow: '0 4px 16px rgba(124, 58, 237, 0.08)',
  }}
>
  <Stack gap='md'>
<Stack gap='xs'>
  <Title order={4} c='electric.7' fw={600}>
Active Participants
  </Title>
  <Text size='sm' c='gray.6'>
{onlineCount} of {totalCount} members online
  </Text>
</Stack>
<Stack gap='sm'>
  {mockParticipants.map((participant) => (
<UserBadge
  key={participant.userData.sub}
  userData={participant.userData}
  showPresence={true}
  presenceStatus={participant.presence}
/>
  ))}
</Stack>
  </Stack>
</Paper>
  );
}
