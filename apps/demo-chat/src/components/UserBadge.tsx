import { Avatar, Badge, Box, Group, Text, Stack } from '@mantine/core';
import { OIDCClaims } from '@uni-final/truename-oauth';

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
  const getCasualName = (claims: OIDCClaims): string => {
if (claims.nickname) return claims.nickname;
if (claims.preferred_username) return claims.preferred_username;
if (claims.given_name) return claims.given_name;
return claims.name || 'User';
  };

  const displayName = getCasualName(userData);

  const presenceColors = {
online: 'green.5',
away: 'orange.5',
offline: 'gray.4',
  };

  return (
<Group gap='sm' align='center'>
  <Box style={{ position: 'relative' }}>
<Avatar name={displayName} color='electric' size='sm' />
{showPresence && (
  <Box
w={12}
h={12}
style={{
  position: 'absolute',
  bottom: -2,
  right: -2,
  borderRadius: '50%',
  backgroundColor: `var(--mantine-color-${presenceColors[presenceStatus].replace('.', '-')})`,
  border: '2px solid white',
}}
  />
)}
  </Box>
  <Stack gap='xs'>
<Text size='xs' fw={600} c='electric.7' lh={1.2}>
  {displayName}
</Text>
<Group gap='xs' align='center'>
  <Badge
size='xs'
variant='light'
color='teal'
tt='uppercase'
fw={700}
fz='10px'
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
