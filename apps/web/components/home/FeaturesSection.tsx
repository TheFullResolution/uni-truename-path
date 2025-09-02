import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Box,
  ThemeIcon,
  Stack,
} from '@mantine/core';
import {
  IconUserCheck,
  IconShield,
  IconPlug,
  IconHistory,
  IconSettings,
  IconEye,
} from '@tabler/icons-react';

const features = [
  {
icon: IconUserCheck,
title: 'Context-Aware Identity',
description:
  'Automatically present the right name variant based on the requesting audience. Your colleagues see "JJ" while HR systems get your legal name.',
color: 'brand',
  },
  {
icon: IconShield,
title: 'Privacy by Design',
description:
  'GDPR-compliant consent management with granular controls. You decide who sees what, when, and for how long.',
color: 'green',
  },
  {
icon: IconPlug,
title: 'OAuth 2.0 Pattern',
description:
  'Academic implementation demonstrating context-aware identity resolution using simplified OAuth flows for educational purposes.',
color: 'blue',
  },
  {
icon: IconHistory,
title: 'Complete Audit Trail',
description:
  'Comprehensive logging of all identity disclosures. Track who accessed your information and when for full transparency.',
color: 'violet',
  },
  {
icon: IconSettings,
title: 'Flexible Configuration',
description:
  'Define custom contexts like "Work Colleagues" or "Gaming Friends" and assign specific name variants to each audience.',
color: 'orange',
  },
  {
icon: IconEye,
title: 'Usage Monitoring',
description:
  'Dashboard interface showing connected applications, active sessions, and identity resolution history for demonstration purposes.',
color: 'teal',
  },
];

export function FeaturesSection() {
  return (
<Box py='xl' bg='#fafbfc'>
  <Container size='lg' py='xl'>
<Stack gap='xl'>
  {/* Section Header */}
  <Box ta='center' mb='xl'>
<Title order={2} size='2.5rem' fw={600} c='gray.8' mb='md'>
  Project Features
</Title>
<Text size='lg' c='gray.6' maw={700} mx='auto'>
  This university project demonstrates technical capabilities for
  context-aware identity management using existing infrastructure in
  a novel configuration.
</Text>
  </Box>

  {/* Features Grid */}
  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='xl'>
{features.map((feature, index) => (
  <Card
key={index}
padding='xl'
radius='md'
shadow='sm'
className='card-hover-effect'
h='100%'
  >
<Stack gap='md' align='flex-start'>
  <ThemeIcon
size='xl'
radius='md'
color={feature.color}
variant='light'
  >
<feature.icon size={24} />
  </ThemeIcon>

  <div>
<Title order={3} size='lg' fw={600} c='gray.8' mb='xs'>
  {feature.title}
</Title>
<Text size='sm' c='gray.6' lh={1.5}>
  {feature.description}
</Text>
  </div>
</Stack>
  </Card>
))}
  </SimpleGrid>
</Stack>
  </Container>
</Box>
  );
}
