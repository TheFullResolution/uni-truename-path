import { Box, Container, Paper, Group, Anchor, Text } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import { DocsNavigation } from '@/components/docs/DocsNavigation';
import { StaticDocumentationNav } from '@/components/docs/StaticDocumentationNav';
import { Logo } from '@/components/branding/Logo';
import type { ReactNode } from 'react';

interface DocsLayoutProps {
  children: ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
<>
  <DocsNavigation />
  <Box data-testid='docs-layout'>
<Container size='xl' py='md'>
  {/* Header with Navigation */}
  <Paper p='md' mb='xl' shadow='md' radius='lg'>
<Group justify='space-between' align='center' mb='md'>
  <Group align='center' gap='md'>
<Logo size='lg' />
<div>
  <Text size='xl' fw={600} c='brand'>
TrueNamePath Documentation
  </Text>
  <Text size='sm' c='dimmed'>
Context-Aware Identity Management API
  </Text>
</div>
  </Group>
  <Anchor
component='a'
href='https://github.com/truename-path/api'
target='_blank'
rel='noopener noreferrer'
size='sm'
c='dimmed'
style={{ textDecoration: 'none' }}
  >
<Group gap='xs' align='center'>
  <IconBrandGithub size={16} />
  <Text>View on GitHub</Text>
</Group>
  </Anchor>
</Group>

{/* Navigation Tabs */}
<StaticDocumentationNav />
  </Paper>

  {/* Content Area */}
  <Box>{children}</Box>

  {/* Footer */}
  <Paper p='md' mt='xl' radius='lg' bg='gray.0'>
<Group justify='center' align='center'>
  <Text size='sm' c='dimmed' ta='center'>
TrueNamePath - University Final Project demonstrating advanced
web design principles
  </Text>
</Group>
  </Paper>
</Container>
  </Box>
</>
  );
}
