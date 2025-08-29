'use client';

import { Paper, Center, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconPlug } from '@tabler/icons-react';

export function EmptyConnectedApps() {
  return (
<Paper p='xl' withBorder>
  <Center>
<Stack align='center'>
  <ThemeIcon size={60} variant='light' color='gray'>
<IconPlug size={30} />
  </ThemeIcon>
  <Text size='lg' fw={500} c='dimmed'>
No connected apps yet
  </Text>
  <Text size='sm' c='dimmed' ta='center'>
When you authorize apps to access your identity information, they
will appear here for you to manage.
  </Text>
</Stack>
  </Center>
</Paper>
  );
}
