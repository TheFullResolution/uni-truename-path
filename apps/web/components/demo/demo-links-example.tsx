/**
 * Example component demonstrating how to use the demo app environment variables
 * This is just an example to show the configuration is working
 */
import { Button, Group, Stack, Text } from '@mantine/core';
import {
  DEMO_APPS,
  getDemoApps,
  validateDemoAppConfig,
} from '@/utils/config/demo-apps';

export function DemoLinksExample() {
  // Validate configuration
  const isConfigValid = validateDemoAppConfig();

  if (!isConfigValid) {
return (
  <Text c='red'>
Demo application URLs are not properly configured. Please check your
environment variables.
  </Text>
);
  }

  // Get demo apps configuration
  const demoApps = getDemoApps();

  return (
<Stack gap='md'>
  <Text size='lg' fw='bold'>
Demo Applications
  </Text>
  <Text size='sm' c='dimmed'>
The following demo applications showcase TrueNamePath&apos;s
context-aware identity management:
  </Text>

  <Group gap='md'>
{demoApps.map((app) => (
  <Button
key={app.name}
component='a'
href={app.url}
target='_blank'
rel='noopener noreferrer'
variant='outline'
  >
{app.name}
  </Button>
))}
  </Group>

  {/* Alternative: Direct usage of constants */}
  <Text size='xs' c='dimmed'>
HR Demo: {DEMO_APPS.HR_URL}
<br />
Chat Demo: {DEMO_APPS.CHAT_URL}
  </Text>
</Stack>
  );
}
