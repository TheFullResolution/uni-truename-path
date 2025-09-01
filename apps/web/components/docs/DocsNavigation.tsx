import { Box, Container, Group, Anchor } from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import Link from 'next/link';
import type { Route } from 'next';
import { LogoWithText } from '@/components/branding/LogoWithText';

/**
 * Simple navigation component for documentation pages
 * Does not require authentication or cookies - suitable for static generation
 */
export function DocsNavigation() {
  return (
<Box
  className='navigation-blur'
  pos='sticky'
  top={0}
  style={{ zIndex: 100 }}
>
  <Container size='lg' py='sm'>
<Group justify='space-between' align='center'>
  <Anchor
component={Link}
href={'/' as Route}
underline='never'
display='flex'
style={{ alignItems: 'center' }}
  >
<LogoWithText size='md' />
  </Anchor>

  <Group gap='md'>
<Anchor
  component={Link}
  href={'/dashboard' as Route}
  size='sm'
  c='dimmed'
  style={{ textDecoration: 'none' }}
>
  <Group gap='xs' align='center'>
<IconBook size={16} />
Dashboard
  </Group>
</Anchor>
  </Group>
</Group>
  </Container>
</Box>
  );
}
