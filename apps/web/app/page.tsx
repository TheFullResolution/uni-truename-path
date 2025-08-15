import { Container, Title, Text, Stack, Card, Box } from '@mantine/core';
import { LogoWithText } from '../components/branding';
import { AuthButtons } from '../components/home';

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

  <AuthButtons />
</Stack>
  </Container>
</Box>
  );
}
