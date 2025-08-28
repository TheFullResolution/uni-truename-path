/**
 * ChatPage Component - Context-aware chat interface
 * Displays user identity with CASUAL context emphasis (nickname, preferred_username)
 */

import { ChatMessage } from '@/components/ChatMessage';
import { UserBadge } from '@/components/UserBadge';
import { oauthConfig } from '@/services/oauth';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import {
  type OIDCClaims,
  useOAuthToken,
  useStoredOAuthToken,
} from '@uni-final/truename-oauth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  <Box h='100vh' bg='var(--mantine-color-gray-0)'>
{/* Header Skeleton */}
<Box
  bg='white'
  style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
>
  <Container size='lg'>
<Group justify='space-between' py='md'>
  <Group>
<Skeleton height={36} width={36} radius='sm' />
<Skeleton height={32} width={120} />
<Skeleton height={24} width={50} radius='sm' />
<Skeleton height={20} width={1} />
<Skeleton height={32} width={100} radius='xl' />
  </Group>
  <Skeleton height={36} width={80} />
</Group>
  </Container>
</Box>

{/* Main Content Skeleton */}
<Container size='lg' pt='lg'>
  <Stack gap='lg'>
{/* Chat Interface Skeleton */}
<Paper shadow='sm' radius='md' p='md'>
  <Stack gap='md'>
{/* Channel Header Skeleton */}
<Group justify='space-between'>
  <Group>
<Skeleton height={24} width={80} />
<Skeleton height={20} width={70} radius='sm' />
<Skeleton height={32} width={100} radius='xl' />
  </Group>
  <Skeleton height={20} width={100} radius='sm' />
</Group>

<Divider />

{/* Message List Skeleton */}
<ScrollArea h={400}>
  <Stack gap='md' p='sm'>
{[...Array(5)].map((_, i) => (
  <Group key={i} align='flex-start' gap='sm'>
<Skeleton height={32} width={32} radius='xl' />
<Stack gap={4} style={{ flex: 1 }}>
  <Skeleton height={16} width={100} />
  <Skeleton height={14} width='90%' />
  <Skeleton height={14} width='60%' />
</Stack>
  </Group>
))}
  </Stack>
</ScrollArea>

<Divider />

{/* Message Input Skeleton */}
<Group gap='xs'>
  <Skeleton height={32} width={32} radius='xl' />
  <Skeleton height={36} style={{ flex: 1 }} />
  <Skeleton height={36} width={36} />
</Group>
  </Stack>
</Paper>

{/* Identity Context Card Skeleton */}
<Paper shadow='sm' p='lg' radius='md'>
  <Stack gap='md'>
<Group>
  <Skeleton height={20} width={140} />
  <Skeleton height={18} width={80} radius='sm' />
</Group>
<Stack gap='xs'>
  <Skeleton height={12} width={80} />
  <Skeleton height={28} width={200} />
  <Skeleton height={14} width='70%' />
</Stack>
  </Stack>
</Paper>
  </Stack>
</Container>
  </Box>
);
  }

  if (error || !userData) {
return (
  <Box h='100vh' bg='var(--mantine-color-gray-0)' p='xl'>
<Container size='md'>
  <Stack gap='md' align='center' ta='center' pt='5rem'>
<Alert color='red' w='100%'>
  Failed to load user data. Please try signing in again.
</Alert>
<Button onClick={handleLogout} size='lg'>
  Return to Sign In
</Button>
  </Stack>
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

  const displayName = getCasualDisplayName(userData);

  // Static mock messages for demonstration
  const mockMessages = [
{
  id: '1',
  authorName: 'Alex Chen',
  content: 'Hey team! Just pushed the latest updates to the project. 🚀',
  timestamp: '10:15 AM',
  isCurrentUser: false,
},
{
  id: '2',
  authorName: 'Sarah Kim',
  content: 'Awesome work! The OAuth integration looks solid.',
  timestamp: '10:18 AM',
  isCurrentUser: false,
},
{
  id: '3',
  authorName: displayName,
  content:
'Thanks! Just integrated with TrueNamePath - context-aware identities are working perfectly.',
  timestamp: '10:20 AM',
  isCurrentUser: true,
},
{
  id: '4',
  authorName: 'Mike Rodriguez',
  content:
"That's exactly what we needed. Love seeing my casual name here vs the formal one in HR systems.",
  timestamp: '10:22 AM',
  isCurrentUser: false,
},
{
  id: '5',
  authorName: displayName,
  content:
'Right? It makes communication feel much more natural and friendly! 😊',
  timestamp: '10:25 AM',
  isCurrentUser: true,
},
  ];

  return (
<Box h='100vh' bg='var(--mantine-color-gray-0)'>
  {/* Header */}
  <Box
bg='white'
style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
  >
<Container size='lg'>
  <Group justify='space-between' py='md'>
<Group gap='sm'>
  <Image
src='/demo_chat_logo.png'
alt='ChatSpace Logo'
w={36}
h={36}
fit='contain'
style={{
  borderRadius: 'var(--mantine-radius-sm)',
}}
  />
  <Title
order={2}
c='violet.7'
fz={{ base: 'lg', sm: 'xl', md: 'xxl' }}
  >
ChatSpace
  </Title>
  <Badge color='violet' variant='light' size='sm'>
Demo
  </Badge>
  <Divider orientation='vertical' hiddenFrom='xs' />
  <Box hiddenFrom='xs'>
<UserBadge
  userData={userData}
  showPresence={true}
  presenceStatus='online'
/>
  </Box>
</Group>
<Button
  variant='outline'
  color='gray'
  onClick={handleLogout}
  size='md'
  px='md'
>
  Sign Out
</Button>
  </Group>
</Container>
  </Box>

  {/* Main Chat Interface */}
  <Container size='lg' pt='lg'>
<Stack gap='lg'>
  {/* Chat Interface */}
  <Paper shadow='sm' radius='md' p='md'>
<Stack gap='md'>
  {/* Channel Header */}
  <Group justify='space-between' wrap='wrap'>
<Group gap='sm'>
  <Title
order={3}
c='gray.8'
fz={{ base: 'md', sm: 'lg', md: 'xl' }}
  >
#general
  </Title>
  <Badge variant='light' color='violet' size='sm'>
Team Chat
  </Badge>
  <Box visibleFrom='sm'>
<UserBadge
  userData={userData}
  showPresence={true}
  presenceStatus='online'
/>
  </Box>
</Group>
<Badge color='teal' variant='light' size='xs'>
  {userData.context_name || 'DEFAULT'} CONTEXT
</Badge>
  </Group>

  <Divider />

  {/* Message List */}
  <ScrollArea h={400} type='scroll'>
<Stack gap='md' p='sm'>
  {mockMessages.map((message) => (
<ChatMessage
  key={message.id}
  authorName={message.authorName}
  content={message.content}
  timestamp={message.timestamp}
  isCurrentUser={message.isCurrentUser}
/>
  ))}
</Stack>
  </ScrollArea>

  <Divider />

  {/* Message Input (Static - Demo Only) */}
  <Stack gap='xs'>
<Group gap='xs'>
  <Box hiddenFrom='xs'>
<UserBadge
  userData={userData}
  showPresence={true}
  presenceStatus='online'
/>
  </Box>
  <TextInput
placeholder={`Message as ${displayName}...`}
style={{ flex: 1 }}
size='md'
disabled
styles={{
  input: {
backgroundColor: 'var(--mantine-color-gray-0)',
  },
}}
  />
  <ActionIcon
size='lg'
variant='filled'
color='violet'
disabled
  >
<IconSend size={18} />
  </ActionIcon>
</Group>
  </Stack>

  <Text size='xs' c='gray.6' ta='center' fs='italic' px='md'>
This is a demo interface showing context-aware identity in
action. Compare how &ldquo;{displayName}&rdquo; appears here vs
professional contexts.
  </Text>
</Stack>
  </Paper>

  {/* Identity Context Card */}
  <Paper shadow='sm' p='lg' radius='md'>
<Stack gap='md'>
  <Group wrap='wrap'>
<Title
  order={4}
  c='violet.7'
  fz={{ base: 'sm', sm: 'md', md: 'lg' }}
>
  Your Chat Identity
</Title>
<Badge color='teal' variant='light' size='xs'>
  {userData.context_name || 'DEFAULT'} CONTEXT
</Badge>
  </Group>

  {/* Primary Display - Casual Name */}
  <Box>
<Text size='xs' tt='uppercase' fw={500} c='gray.6' mb={4}>
  Display Name
</Text>
<Title
  order={2}
  c='gray.8'
  fz={{ base: 'xl', sm: 'xxl', md: 'h1' }}
>
  {displayName}
</Title>
<Text size='sm' c='gray.6' mt={4}>
  This is how you appear in casual chat environments
</Text>
  </Box>

  <Divider />

  {/* Identity Breakdown */}
  <Stack gap='xs'>
<Text size='sm' fw={500} c='gray.7'>
  Available Identity Fields
</Text>
{userData.nickname && (
  <Group gap='xs' wrap='wrap'>
<Badge size='xs' color='teal'>
  nickname
</Badge>
<Text size='sm' c='gray.8'>
  {userData.nickname}
</Text>
  </Group>
)}
{userData.preferred_username && (
  <Group gap='xs' wrap='wrap'>
<Badge size='xs' color='blue'>
  preferred_username
</Badge>
<Text size='sm' c='gray.8'>
  {userData.preferred_username}
</Text>
  </Group>
)}
{userData.given_name && (
  <Group gap='xs' wrap='wrap'>
<Badge size='xs' color='gray'>
  given_name
</Badge>
<Text size='sm' c='gray.8'>
  {userData.given_name}
</Text>
  </Group>
)}
  </Stack>
</Stack>
  </Paper>

  {/* OIDC Claims Details */}
  <Paper shadow='sm' p='lg' radius='md' hiddenFrom='xs'>
<Stack gap='md'>
  <Title
order={4}
c='gray.8'
fz={{ base: 'sm', sm: 'md', md: 'lg' }}
  >
Complete OIDC Claims (Technical View)
  </Title>
  <Text size='sm' c='gray.6'>
Raw identity data from TrueNamePath OAuth integration
  </Text>
  <Box
p='md'
bg='var(--mantine-color-gray-0)'
style={{
  border: '1px solid var(--mantine-color-gray-3)',
  borderRadius: 'var(--mantine-radius-md)',
  fontFamily: 'var(--mantine-font-family-monospace)',
  fontSize: '0.8rem',
  overflow: 'auto',
}}
  >
<pre
  style={{
margin: 0,
whiteSpace: 'pre-wrap',
wordBreak: 'break-word',
  }}
>
  {JSON.stringify(userData, null, 2)}
</pre>
  </Box>
</Stack>
  </Paper>
</Stack>
  </Container>
</Box>
  );
};
