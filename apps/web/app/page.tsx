import { Container, Title, Text, Button, Stack, Card } from '@mantine/core';
import Link from 'next/link';

export default function HomePage() {
  return (
<Container size='md' py='xl'>
  <Stack gap='xl' align='center'>
<div style={{ textAlign: 'center' }}>
  <Title order={1} size='3rem' mb='md'>
TrueNamePath
  </Title>
  <Text size='xl' c='dimmed' mb='xl'>
Context-aware identity management API that ensures the{' '}
<strong>right name</strong> appears to the{' '}
<strong>right audience</strong> every time.
  </Text>
</div>

<Card withBorder p='xl' maw={600}>
  <Stack gap='md'>
<Title order={3}>The Problem</Title>
<Text>
  Most digital platforms treat names as single, unchanging strings.
  This breaks down when:
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
• <strong>Alex Smith</strong> goes by <strong>@CodeAlex</strong>{' '}
in developer communities
  </li>
</Text>
  </Stack>
</Card>

<Button component={Link} href='/demo' size='lg'>
  View Live Demo
</Button>

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
  );
}
