/**
 * ChatPage Component - Context-aware chat interface
 * Displays user identity with CASUAL context emphasis (nickname, preferred_username)
 */

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Paper,
  Badge,
  Box,
  Card,
  Grid,
  Alert,
  Loader,
  Divider,
} from '@mantine/core';
import {
  useStoredOAuthToken,
  useOAuthToken,
  type OIDCClaims,
} from '@uni-final/truename-oauth';
import { oauthConfig } from '@/services/oauth';

export const ChatPage = () => {
  const navigate = useNavigate();
  const { token, clearToken } = useStoredOAuthToken();

  // Handle redirect when no token is present
  useEffect(() => {
if (!token) {
  navigate('/', { replace: true });
}
  }, [token, navigate]);

  // Fetch user data using stored token
  const {
data: userData,
error,
isLoading,
  } = useOAuthToken({
token,
enabled: !!token,
...oauthConfig,
  });

  const handleLogout = () => {
clearToken();
navigate('/', { replace: true });
  };

  if (!token) {
return null;
  }

  if (isLoading) {
return (
  <Box
style={{
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  padding: '2rem',
}}
  >
<Container size='md'>
  <Stack gap='lg' align='center' style={{ paddingTop: '2rem' }}>
<Loader size='lg' color='violet' type='dots' />
<Text c='gray.6'>Loading your chat identity...</Text>
  </Stack>
</Container>
  </Box>
);
  }

  if (error || !userData) {
return (
  <Box
style={{
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  padding: '2rem',
}}
  >
<Container size='md'>
  <Alert color='red'>
Failed to load user data. Please try signing in again.
  </Alert>
  <Button mt='md' onClick={handleLogout}>
Return to Sign In
  </Button>
</Container>
  </Box>
);
  }

  // Context-aware identity display - Focus on CASUAL context
  const getCasualDisplayName = (claims: OIDCClaims): string => {
// Prioritize casual identity fields for chat context
if (claims.nickname) return claims.nickname;
if (claims.preferred_username) return claims.preferred_username;
if (claims.given_name) return claims.given_name;
return claims.name || 'User';
  };

  const getSecondaryInfo = (claims: OIDCClaims): string => {
// Secondary display for context
if (claims.nickname && claims.preferred_username) {
  return `@${claims.preferred_username}`;
}
if (claims.preferred_username && !claims.nickname) {
  return claims.name || claims.given_name || '';
}
return claims.name || '';
  };

  const displayName = getCasualDisplayName(userData);
  const secondaryInfo = getSecondaryInfo(userData);

  return (
<Box style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
  {/* Header */}
  <Box
style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef' }}
  >
<Container size='lg'>
  <Group justify='space-between' py='md'>
<Group>
  <Title order={2} c='violet.7'>
ChatSpace
  </Title>
  <Badge color='violet' variant='light'>
Demo
  </Badge>
</Group>
<Button variant='outline' color='gray' onClick={handleLogout}>
  Sign Out
</Button>
  </Group>
</Container>
  </Box>

  {/* Main Content */}
  <Container size='lg' pt='xl'>
<Grid>
  {/* Identity Display - Casual Context Focus */}
  <Grid.Col span={{ base: 12, md: 4 }}>
<Paper shadow='sm' p='lg' radius='md'>
  <Stack gap='md'>
<Group>
  <Title order={3} c='violet.7'>
Your Chat Identity
  </Title>
  <Badge color='teal' variant='light' size='sm'>
CASUAL
  </Badge>
</Group>

{/* Primary Display - Casual Name */}
<Box>
  <Text size='xs' tt='uppercase' fw={500} c='gray.6' mb={4}>
Display Name
  </Text>
  <Title order={2} c='gray.8'>
{displayName}
  </Title>
  {secondaryInfo && (
<Text c='gray.6' size='sm' mt={2}>
  {secondaryInfo}
</Text>
  )}
</Box>

<Divider />

{/* Context Explanation */}
<Box>
  <Text size='sm' c='gray.7' fw={500} mb='xs'>
Context-Aware Identity
  </Text>
  <Text size='xs' c='gray.6' style={{ lineHeight: 1.5 }}>
ChatSpace shows your casual identity for friendly team
communication. Your nickname and preferred username take
priority here.
  </Text>
</Box>

{/* Identity Breakdown */}
<Stack gap='xs'>
  <Text size='sm' fw={500} c='gray.7'>
Available Identities
  </Text>
  {userData.nickname && (
<Group gap='xs'>
  <Badge size='xs' color='teal'>
nickname
  </Badge>
  <Text size='sm' c='gray.8'>
{userData.nickname}
  </Text>
</Group>
  )}
  {userData.preferred_username && (
<Group gap='xs'>
  <Badge size='xs' color='blue'>
preferred_username
  </Badge>
  <Text size='sm' c='gray.8'>
{userData.preferred_username}
  </Text>
</Group>
  )}
  {userData.given_name && (
<Group gap='xs'>
  <Badge size='xs' color='gray'>
given_name
  </Badge>
  <Text size='sm' c='gray.8'>
{userData.given_name}
  </Text>
</Group>
  )}
  {userData.family_name && (
<Group gap='xs'>
  <Badge size='xs' color='gray'>
family_name
  </Badge>
  <Text size='sm' c='gray.8'>
{userData.family_name}
  </Text>
</Group>
  )}
</Stack>
  </Stack>
</Paper>
  </Grid.Col>

  {/* Mock Chat Interface */}
  <Grid.Col span={{ base: 12, md: 8 }}>
<Paper
  shadow='sm'
  p='lg'
  radius='md'
  style={{ minHeight: '400px' }}
>
  <Stack gap='md'>
<Group>
  <Title order={3} c='gray.8'>
#general
  </Title>
  <Badge variant='light'>Mock Chat</Badge>
</Group>

<Divider />

{/* Mock Messages showing context-aware display */}
<Stack gap='sm'>
  <Card
p='sm'
radius='md'
style={{ backgroundColor: '#f8f9fa' }}
  >
<Group gap='xs' mb='xs'>
  <Text fw={600} size='sm' c='violet.7'>
{displayName}
  </Text>
  <Text size='xs' c='gray.5'>
just now
  </Text>
</Group>
<Text size='sm'>
  Hey everyone! 👋 This is how my name appears in ChatSpace
  - optimized for casual team communication!
</Text>
  </Card>

  <Card p='sm' radius='md' style={{ backgroundColor: 'white' }}>
<Group gap='xs' mb='xs'>
  <Text fw={600} size='sm' c='gray.7'>
teammate
  </Text>
  <Text size='xs' c='gray.5'>
2 min ago
  </Text>
</Group>
<Text size='sm'>
  Welcome {displayName}! Great to see context-aware
  identities in action.
</Text>
  </Card>
</Stack>

<Box
  mt='auto'
  pt='md'
  style={{ borderTop: '1px solid #e9ecef' }}
>
  <Text
size='sm'
c='gray.6'
ta='center'
style={{ fontStyle: 'italic' }}
  >
This is a demo interface showing how your identity appears
in chat context.
<br />
Compare with the HR Demo to see professional vs casual
identity display.
  </Text>
</Box>
  </Stack>
</Paper>
  </Grid.Col>
</Grid>

{/* OIDC Claims Details */}
<Paper shadow='sm' p='lg' radius='md' mt='xl'>
  <Stack gap='md'>
<Title order={4} c='gray.8'>
  Complete OIDC Claims (Technical View)
</Title>
<Text size='sm' c='gray.6'>
  Raw identity data from TrueNamePath OAuth integration
</Text>
<Box
  p='md'
  style={{
backgroundColor: '#f8f9fa',
border: '1px solid #e9ecef',
borderRadius: '8px',
fontFamily: 'monospace',
fontSize: '0.85rem',
overflow: 'auto',
  }}
>
  <pre>{JSON.stringify(userData, null, 2)}</pre>
</Box>
  </Stack>
</Paper>
  </Container>
</Box>
  );
};
