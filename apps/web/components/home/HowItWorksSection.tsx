import {
  Container,
  Title,
  Text,
  Card,
  Box,
  Stack,
  Stepper,
} from '@mantine/core';
import { StepperStep } from '@mantine/core';
import {
  IconUserPlus,
  IconSettings,
  IconPlug,
  IconCheck,
} from '@tabler/icons-react';

const steps = [
  {
icon: IconUserPlus,
title: 'Create Your Profile',
description:
  'Sign up and add multiple name variants like legal name, nickname, professional alias, and cultural variations.',
  },
  {
icon: IconSettings,
title: 'Configure Contexts',
description:
  'Define custom contexts like "Work Team", "Open Source", "HR Systems" and assign which name variant each should see.',
  },
  {
icon: IconPlug,
title: 'Connect Applications',
description:
  'Integrate applications through OAuth 2.0. Each app gets the appropriate name based on your pre-configured rules.',
  },
  {
icon: IconCheck,
title: 'Monitor & Control',
description:
  'Track all identity disclosures in real-time. Revoke access, update preferences, or modify contexts anytime.',
  },
];

export function HowItWorksSection() {
  return (
<Box py='xl'>
  <Container size='lg' py='xl'>
<Stack gap='xl'>
  {/* Section Header */}
  <Box ta='center' mb='xl'>
<Title order={2} size='2.5rem' fw={600} c='gray.8' mb='md'>
  How It Works
</Title>
<Text size='lg' c='gray.6' maw={700} mx='auto'>
  Set up once, use everywhere. Our four-step process puts you in
  complete control of your digital identity across all platforms.
</Text>
  </Box>

  {/* Process Steps */}
  <Card withBorder padding='xl' radius='md'>
<Stepper
  active={3}
  orientation='vertical'
  size='lg'
  iconSize={48}
  completedIcon={<IconCheck size={20} />}
>
  {steps.map((step, index) => (
<StepperStep
  key={index}
  icon={<step.icon size={20} />}
  label={step.title}
  description={step.description}
  color='brand'
/>
  ))}
</Stepper>
  </Card>
</Stack>
  </Container>
</Box>
  );
}
