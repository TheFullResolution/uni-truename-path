'use client';

import React from 'react';
import {
  Card,
  Grid,
  Group,
  Text,
  Title,
  Badge,
  Button,
  Stack,
  ThemeIcon,
  Alert,
  Center,
  Skeleton,
} from '@mantine/core';
import {
  IconBriefcase,
  IconMessageCircle,
  IconExternalLink,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  getDemoApps,
  validateDemoAppConfigDetailed,
  type DemoAppConfig,
  type DemoAppType,
} from '@/utils/config/demo-apps';

/**
 * Props interface for the DemoAppsShowcase component
 */
interface DemoAppsShowcaseProps {
  /** Optional loading state to show skeleton placeholders */
  loading?: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Configuration for demo app display properties
 */
interface DemoAppDisplayConfig {
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  contextLabel: string;
  gradientFrom: string;
  gradientTo: string;
}

/**
 * Display configuration mapping for each demo app type
 */
const DEMO_APP_DISPLAY_CONFIG: Record<DemoAppType, DemoAppDisplayConfig> = {
  professional: {
icon: IconBriefcase,
color: 'blue',
contextLabel: 'Professional',
gradientFrom: 'blue',
gradientTo: 'cyan',
  },
  social: {
icon: IconMessageCircle,
color: 'green',
contextLabel: 'Social',
gradientFrom: 'green',
gradientTo: 'teal',
  },
};

/**
 * Individual demo app card component
 */
interface DemoAppCardProps {
  app: DemoAppConfig;
  loading?: boolean;
}

function DemoAppCard({ app, loading }: DemoAppCardProps) {
  const displayConfig = DEMO_APP_DISPLAY_CONFIG[app.type];
  const IconComponent = displayConfig.icon;

  if (loading) {
return (
  <Card withBorder radius='md' p='lg' data-testid={`demo-app-card-loading`}>
<Stack gap='md'>
  <Group justify='apart' align='flex-start'>
<Stack gap='xs' style={{ flex: 1 }}>
  <Skeleton height={24} width='60%' />
  <Skeleton height={16} width='40%' />
</Stack>
<Skeleton height={48} width={48} radius='md' />
  </Group>
  <Skeleton height={16} />
  <Skeleton height={36} />
</Stack>
  </Card>
);
  }

  return (
<Card
  withBorder
  radius='md'
  p='lg'
  data-testid={`demo-app-card-${app.type}`}
  style={{
transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
  styles={{
root: {
  '&:hover': {
transform: 'translateY(-2px)',
boxShadow: 'var(--mantine-shadow-lg)',
  },
},
  }}
>
  <Stack gap='md'>
{/* Header with icon and badge */}
<Group justify='apart' align='flex-start'>
  <Stack gap='xs' style={{ flex: 1 }}>
<Group gap='xs' align='center'>
  <Title order={3} data-testid={`demo-app-title-${app.type}`}>
{app.name}
  </Title>
  <Badge
variant='light'
color={displayConfig.color}
size='sm'
data-testid={`demo-app-badge-${app.type}`}
  >
{displayConfig.contextLabel}
  </Badge>
</Group>
<Text
  size='sm'
  c='dimmed'
  data-testid={`demo-app-description-${app.type}`}
>
  {app.description}
</Text>
  </Stack>
  <ThemeIcon
size={48}
radius='md'
variant='gradient'
gradient={{
  deg: 135,
  from: displayConfig.gradientFrom,
  to: displayConfig.gradientTo,
}}
data-testid={`demo-app-icon-${app.type}`}
  >
<IconComponent size={24} />
  </ThemeIcon>
</Group>

{/* Action button */}
<Button
  component='a'
  href={app.url}
  target='_blank'
  rel='noopener noreferrer'
  variant='filled'
  color={displayConfig.color}
  rightSection={<IconExternalLink size={16} />}
  fullWidth
  data-testid={`demo-app-button-${app.type}`}
>
  Try Now
</Button>
  </Stack>
</Card>
  );
}

/**
 * Error display component for configuration issues
 */
interface ErrorDisplayProps {
  errors: string[];
}

function ErrorDisplay({ errors }: ErrorDisplayProps) {
  return (
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='Demo Applications Unavailable'
  color='red'
  variant='light'
  data-testid='demo-apps-error'
>
  <Stack gap='xs'>
<Text size='sm'>
  Demo applications are currently unavailable due to configuration
  issues:
</Text>
<Stack gap='xs' pl='sm'>
  {errors.map((error, index) => (
<Text key={index} size='sm' c='dimmed'>
  • {error}
</Text>
  ))}
</Stack>
<Text size='sm' mt='xs'>
  Please check the environment configuration or contact support.
</Text>
  </Stack>
</Alert>
  );
}

/**
 * Professional demo apps showcase component for the documentation overview page.
 *
 * Features:
 * - Responsive card layout for HR and Chat demo applications
 * - Professional/Social context badges to distinguish applications
 * - Clear descriptions and &quot;Try Now&quot; buttons with external link indicators
 * - Environment variable integration with error handling
 * - Loading states and skeleton placeholders
 * - Professional design consistent with the application theme
 *
 * @param props Component properties
 * @returns JSX element containing the demo apps showcase
 */
export function DemoAppsShowcase({
  loading = false,
  className,
}: DemoAppsShowcaseProps) {
  // Validate configuration and get demo apps
  let demoApps: DemoAppConfig[] = [];
  let configErrors: string[] = [];

  try {
const validation = validateDemoAppConfigDetailed();
if (!validation.isValid) {
  configErrors = validation.errors;
} else {
  demoApps = getDemoApps();
}
  } catch (error) {
configErrors = [
  error instanceof Error
? error.message
: 'Unknown configuration error occurred',
];
  }

  // Show loading state
  if (loading) {
return (
  <Stack
gap='lg'
className={className}
data-testid='demo-apps-showcase-loading'
  >
<Stack gap='xs'>
  <Skeleton height={32} width='60%' />
  <Skeleton height={16} width='80%' />
</Stack>
<Grid>
  <Grid.Col span={{ base: 12, sm: 6 }}>
<DemoAppCard app={{} as DemoAppConfig} loading={true} />
  </Grid.Col>
  <Grid.Col span={{ base: 12, sm: 6 }}>
<DemoAppCard app={{} as DemoAppConfig} loading={true} />
  </Grid.Col>
</Grid>
  </Stack>
);
  }

  // Show error state if configuration is invalid
  if (configErrors.length > 0) {
return (
  <Stack
gap='lg'
className={className}
data-testid='demo-apps-showcase-error'
  >
<Stack gap='xs'>
  <Title order={2}>Demo Applications</Title>
  <Text size='sm' c='dimmed'>
Experience TrueNamePath&apos;s context-aware identity management in
action
  </Text>
</Stack>
<ErrorDisplay errors={configErrors} />
  </Stack>
);
  }

  // Show empty state if no demo apps are available
  if (demoApps.length === 0) {
return (
  <Stack
gap='lg'
className={className}
data-testid='demo-apps-showcase-empty'
  >
<Stack gap='xs'>
  <Title order={2}>Demo Applications</Title>
  <Text size='sm' c='dimmed'>
Experience TrueNamePath&apos;s context-aware identity management in
action
  </Text>
</Stack>
<Center p='xl'>
  <Text c='dimmed'>No demo applications are currently available.</Text>
</Center>
  </Stack>
);
  }

  return (
<Stack gap='lg' className={className} data-testid='demo-apps-showcase'>
  {/* Header section */}
  <Stack gap='xs'>
<Title order={2}>Demo Applications</Title>
<Text size='sm' c='dimmed'>
  Experience TrueNamePath&apos;s context-aware identity management in
  action with our live demo applications
</Text>
  </Stack>

  {/* Demo apps grid */}
  <Grid>
{demoApps.map((app) => (
  <Grid.Col key={app.type} span={{ base: 12, sm: 6 }}>
<DemoAppCard app={app} loading={loading} />
  </Grid.Col>
))}
  </Grid>
</Stack>
  );
}
