import { Avatar, Group, Paper, Stack, Text } from '@mantine/core';

interface ChatMessageProps {
  authorName: string;
  content: string;
  timestamp: string;
  isCurrentUser?: boolean;
}

export function ChatMessage({
  authorName,
  content,
  timestamp,
  isCurrentUser = false,
}: ChatMessageProps) {
  return (
<Group
  gap='sm'
  align='flex-start'
  style={{
justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
  }}
>
  {!isCurrentUser && (
<Avatar name={authorName} color='initials' size='sm' />
  )}

  <Paper
p='sm'
radius='md'
bg={isCurrentUser ? 'violet.0' : 'gray.0'}
maw='70%'
  >
<Stack gap='xs'>
  <Group gap='xs' justify='space-between'>
<Text size='sm' fw={500} c={isCurrentUser ? 'violet.7' : 'gray.8'}>
  {isCurrentUser ? 'You' : authorName}
</Text>
<Text size='xs' c='gray.6'>
  {timestamp}
</Text>
  </Group>
  <Text size='sm' c='gray.8'>
{content}
  </Text>
</Stack>
  </Paper>

  {isCurrentUser && <Avatar name={authorName} color='initials' size='sm' />}
</Group>
  );
}
