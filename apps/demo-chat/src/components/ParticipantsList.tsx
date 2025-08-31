/**
 * ParticipantsList Component
 */

import { Stack, Paper, Title, Text } from '@mantine/core';
import { OIDCClaims } from '@uni-final/truename-oauth';
import { UserBadge } from './UserBadge';

// Helper to create mock OIDC claims with all mandatory fields
const createMockOIDCClaims = (overrides: Partial<OIDCClaims>): OIDCClaims => {
  const iat = Math.floor(Date.now() / 1000);
  return {
sub: '',
name: '',
given_name: '',
family_name: '',
nickname: '',
preferred_username: '',
iss: 'https://truename.local/oauth',
aud: 'demo-chat-app',
iat,
exp: iat + 3600, // Expires in 1 hour
nbf: iat, // Not before (same as issued at)
jti: `demo_${Math.random().toString(36).substr(2, 9)}`, // Unique JWT ID
context_name: '',
app_name: 'demo-chat-app',
...overrides,
  };
};

const mockParticipants: Array<{
  userData: OIDCClaims;
  presence: 'online' | 'away' | 'offline';
}> = [
  {
userData: createMockOIDCClaims({
  sub: '1234567890',
  name: 'Alexandra Chen',
  given_name: 'Alexandra',
  family_name: 'Chen',
  nickname: 'Alex',
  preferred_username: 'alex_c',
  context_name: 'FRIENDS',
}),
presence: 'online',
  },
  {
userData: createMockOIDCClaims({
  sub: '2345678901',
  name: 'Michael Rodriguez',
  given_name: 'Michael',
  family_name: 'Rodriguez',
  nickname: 'Mike',
  preferred_username: '',
  context_name: 'GAMING',
}),
presence: 'away',
  },
  {
userData: createMockOIDCClaims({
  sub: '3456789012',
  name: 'Sarah Kim',
  given_name: 'Sarah',
  family_name: 'Kim',
  nickname: '',
  preferred_username: 'sarahk',
  context_name: 'CASUAL',
}),
presence: 'online',
  },
];

export function ParticipantsList() {
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
