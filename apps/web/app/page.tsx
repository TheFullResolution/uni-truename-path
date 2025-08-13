import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Card,
  Box,
} from '@mantine/core';
import Link from 'next/link';
import { LogoWithText } from '../components/branding';

export default function HomePage() {
  return (
<Box
  style={{
background:
  'linear-gradient(135deg, rgba(74, 127, 231, 0.05) 0%, rgba(195, 217, 247, 0.1) 100%)',
minHeight: '100vh',
  }}
>
  <Container size='md' py='xl'>
<Stack gap='xl' align='center'>
  <Box style={{ textAlign: 'center' }} pt='xl'>
<LogoWithText size='xl' />
<Text size='xl' c='dimmed' mt='lg' mb='xl'>
  Context-aware identity management API that ensures the{' '}
  <Text component='span' c='brand.5' fw={600}>
right name
  </Text>{' '}
  appears to the{' '}
  <Text component='span' c='brand.5' fw={600}>
right audience
  </Text>{' '}
  every time.
</Text>
  </Box>

  <Card withBorder p='xl' maw={600}>
<Stack gap='md'>
  <Title order={3}>The Problem</Title>
  <Text>
Most digital platforms treat names as single, unchanging
strings. This breaks down when:
  </Text>
  <Text component='ul' style={{ listStyle: 'none', padding: 0 }}>
<li>
  • <strong>Jędrzej Lewandowski</strong> appears in Gmail but
  everyone knows him as <strong>JJ</strong> on Slack
</li>
<li>
  • <strong>李伟 (Li Wei)</strong> uses different name variants
  for HR vs. public forums
</li>
<li>
  • <strong>Alex Smith</strong> goes by{' '}
  <strong>@CodeAlex</strong> in developer communities
</li>
  </Text>
</Stack>
  </Card>

  <Stack gap='md' align='center'>
<Button
  component={Link}
  href='/demo'
  size='lg'
  color='brand'
  variant='filled'
>
  View Live Demo
</Button>

<Button
  component={Link}
  href='/auth/login'
  variant='outline'
  size='md'
  color='brand'
>
  Login to TrueNamePath
</Button>
  </Stack>

  <Card withBorder p='md' maw={500}>
<Stack gap='xs'>
  <Title order={4}>University Final Project</Title>
  <Text size='sm' c='dimmed'>
CM3035 Advanced Web Design - Identity & Profile Management API
  </Text>
  <Text size='sm' c='dimmed'>
Demonstrating privacy-by-design, GDPR compliance, and
context-aware name resolution.
  </Text>
</Stack>
  </Card>
</Stack>
  </Container>
</Box>
  );
}
