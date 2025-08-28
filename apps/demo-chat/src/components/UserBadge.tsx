import { Avatar, Badge, Box, Group, Text, Stack } from '@mantine/core';
import { OIDCClaims } from '@uni-final/truename-oauth';
import './UserBadge.css';

interface UserBadgeProps {
  userData: OIDCClaims;
  showPresence?: boolean;
  presenceStatus?: 'online' | 'away' | 'offline';
}

export function UserBadge({
  userData,
  showPresence = true,
  presenceStatus = 'online',
}: UserBadgeProps) {
  // Context-aware casual name resolution (same logic as ChatPage)
  const getCasualName = (claims: OIDCClaims): string => {
if (claims.nickname) return claims.nickname;
if (claims.preferred_username) return claims.preferred_username;
if (claims.given_name) return claims.given_name;
return claims.name || 'User';
  };

  const displayName = getCasualName(userData);

  // Presence colors
  const presenceColors = {
online: 'green.5',
away: 'orange.5',
offline: 'gray.4',
  };

  return (
<Group gap='sm' align='center'>
  <Box style={{ position: 'relative' }}>
<Avatar
  name={displayName}
  color='electric'
  size='sm'
  style={{
backgroundColor: 'var(--mantine-color-electric-1)',
color: 'var(--mantine-color-electric-7)',
fontWeight: 600,
  }}
/>
{showPresence && (
  <Box
style={{
  position: 'absolute',
  bottom: -2,
  right: -2,
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: `var(--mantine-color-${presenceColors[presenceStatus].replace('.', '-')})`,
  border: '2px solid white',
  ...(presenceStatus === 'online' && {
animation: 'pulse-presence 2s infinite',
  }),
}}
  />
)}
  </Box>
  <Stack gap={2}>
<Text size='xs' fw={600} c='electric.7' style={{ lineHeight: 1.2 }}>
  {displayName}
</Text>
<Group gap={4} align='center'>
  <Badge
size='xs'
variant='light'
color='teal'
tt='uppercase'
fw={700}
style={{ fontSize: '10px' }}
  >
{userData.context_name || 'DEFAULT'}
  </Badge>
  {showPresence && (
<Text size='xs' c={presenceColors[presenceStatus]} fw={500}>
  {presenceStatus}
</Text>
  )}
</Group>
  </Stack>
</Group>
  );
}
