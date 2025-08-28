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
style={{
  backgroundColor: isCurrentUser
? 'var(--mantine-color-violet-0)'
: 'var(--mantine-color-gray-0)',
  maxWidth: '70%',
}}
  >
<Stack gap={2}>
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
