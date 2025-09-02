import {
  Paper,
  Title,
  Text,
  Stack,
  List,
  ListItem,
  ThemeIcon,
  Alert,
  Group,
  Badge,
  Divider,
} from '@mantine/core';
import {
  IconShield,
  IconUser,
  IconBriefcase,
  IconUsers,
  IconInfoCircle,
  IconSchool,
  IconClock,
} from '@tabler/icons-react';
import { DemoAppsShowcase } from '@/components/docs/DemoAppsShowcase';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Overview | TrueNamePath Documentation',
  description:
'Learn how TrueNamePath solves the problem of context-inappropriate name presentation through innovative context-aware identity management. See live demonstrations of our OAuth-integrated solution.',
  keywords: [
'context-aware identity',
'name management',
'OAuth integration',
'privacy protection',
'identity presentation',
'academic research project',
  ],
};

export default function OverviewPage() {
  return (
<Paper p='xl' shadow='sm' radius='lg'>
  <Stack gap='xl'>
{/* Hero Section */}
<div data-testid='overview-hero'>
  <Group align='center' mb='md'>
<Title order={1}>What is TrueNamePath?</Title>
<Badge size='lg' color='blue' variant='light'>
  University Final Project
</Badge>
  </Group>
  <Text size='xl' c='dimmed' lh='1.6' mb='lg'>
A university final project (CM3035 Advanced Web Design) that
demonstrates context-aware identity management, allowing users to
control how their names are presented to different applications.
  </Text>
</div>

{/* Problem Statement */}
<div data-testid='overview-problem'>
  <Title order={2} mb='lg' c='red.7'>
The Problem We Solve
  </Title>
  <Alert
icon={<IconInfoCircle size={20} />}
title='Real-World Name Complexity'
color='orange'
variant='light'
mb='md'
  >
<Text size='sm' mb='xs'>
  <strong>Real Example:</strong> &ldquo;As a Polish software
  developer, I experience this challenge daily. My colleagues know
  me as &apos;@JJ&apos; in workplace Slack channels—a nickname I
  chose for its simplicity and easy pronunciation. Yet corporate HR
  systems insist on displaying &apos;Jędrzej&apos; with its
  challenging diacritics.&rdquo; - JJ (Jędrzej Lewandowski)
</Text>
<Text size='sm'>
  <strong>The Scale:</strong> Research shows 74% of workers struggle
  with name pronunciation in workplace settings, while 33% of ethnic
  minority employees report pressure to &ldquo;Westernize&rdquo;
  their names for professional contexts.
</Text>
  </Alert>
  <Text size='md' lh='1.6' mb='md'>
Research shows this creates real discrimination. Bertrand and
Mullainathan&apos;s study found that resumes with
&ldquo;White-sounding&rdquo; names received 50% more callbacks than
identical resumes with &ldquo;African-American-sounding&rdquo;
names.
  </Text>
  <Text size='md' lh='1.6'>
McKenzie (2010) catalogued over 40 false assumptions that software
systems make about names, yet traditional identity systems continue
to enforce a one-size-fits-all approach that fails to accommodate
how names are used in different contexts.
  </Text>
</div>

{/* Solution Explanation */}
<div data-testid='overview-solution'>
  <Title order={2} mb='lg' c='green.7'>
Technical Implementation: Context-Aware Identity Resolution
  </Title>
  <Text size='md' lh='1.6' mb='lg'>
This project implements{' '}
<Text
  component='span'
  bg='yellow.1'
  px={4}
  py={2}
  style={{ borderRadius: '4px' }}
>
  context-aware name resolution
</Text>{' '}
as a proof-of-concept, demonstrating how existing OAuth
infrastructure can be extended to provide user-configurable name
selection based on requesting application context.
  </Text>

  <Text size='md' lh='1.6' mb='md'>
<Text component='span' fw={600}>
  Technical Approach:
</Text>{' '}
The system leverages existing OAuth infrastructure, implementing
context-aware identity resolution as a layer on top of standard
OAuth flows. Applications receive contextually appropriate identity
information through standard OAuth protocols.
  </Text>

  <Text size='md' lh='1.6' mb='md'>
<Text component='span' fw={600}>
  Core Algorithm:
</Text>{' '}
The{' '}
<Text component='code' size='sm' bg='gray.1' px={4} py={2}>
  resolve_oauth_oidc_claims()
</Text>{' '}
function implements a three-layer decision process: consent
verification, visibility filtering, and context-specific name
selection based on the requesting application.
  </Text>
</div>

{/* Key Features */}
<div data-testid='overview-features'>
  <Title order={2} mb='lg'>
Implementation Features
  </Title>
  <List
spacing='md'
size='md'
icon={
  <ThemeIcon size={20} radius='xl'>
<IconShield size={14} />
  </ThemeIcon>
}
  >
<ListItem>
  <Text component='div'>
<Text component='span' fw={600}>
  User-Defined Contexts:
</Text>{' '}
Users create custom contexts (e.g., &ldquo;Work
Colleagues,&rdquo; &ldquo;Gaming Friends,&rdquo; &ldquo;HR
Systems&rdquo;) and assign specific name variants to each
context through a dashboard interface.
  </Text>
</ListItem>
<ListItem
  icon={
<ThemeIcon size={20} radius='xl' color='green'>
  <IconUser size={14} />
</ThemeIcon>
  }
>
  <Text component='div'>
<Text component='span' fw={600}>
  Privacy Controls:
</Text>{' '}
Implements data minimization by automatically selecting
contextually appropriate names, with comprehensive audit logging
and consent management for GDPR compliance.
  </Text>
</ListItem>
<ListItem
  icon={
<ThemeIcon size={20} radius='xl' color='blue'>
  <IconBriefcase size={14} />
</ThemeIcon>
  }
>
  <Text component='div'>
<Text component='span' fw={600}>
  Context-Aware Selection:
</Text>{' '}
Three-layer algorithm (consent verification, visibility
filtering, context-specific selection) ensures appropriate names
for different application types.
  </Text>
</ListItem>
<ListItem
  icon={
<ThemeIcon size={20} radius='xl' color='violet'>
  <IconUsers size={14} />
</ThemeIcon>
  }
>
  <Text component='div'>
<Text component='span' fw={600}>
  REST API & OAuth:
</Text>{' '}
Complete REST API implementation with OAuth Bearer token
authentication and standard OIDC claims resolution.
  </Text>
</ListItem>
<ListItem
  icon={
<ThemeIcon size={20} radius='xl' color='orange'>
  <IconClock size={14} />
</ThemeIcon>
  }
>
  <Text component='div'>
<Text component='span' fw={600}>
  Testing & Validation:
</Text>{' '}
Comprehensive end-to-end testing with Playwright, complete audit
trail implementation, and response time monitoring.
  </Text>
</ListItem>
  </List>
</div>

<Divider my='xl' />

{/* Academic Context */}
<div data-testid='overview-academic'>
  <Paper p='lg' bg='blue.0' radius='lg'>
<Group mb='md'>
  <ThemeIcon size={32} radius='md' color='blue' variant='light'>
<IconSchool size={20} />
  </ThemeIcon>
  <Title order={3}>Academic Project Context</Title>
</Group>
<Stack gap='sm'>
  <Text size='sm' lh='1.5'>
<Text component='span' fw={600}>
  Research Focus:
</Text>{' '}
TrueNamePath is a CM3035 Advanced Web Design final project
demonstrating advanced web design principles and exploring the
feasibility of context-aware identity management using existing
OAuth infrastructure patterns. Literature review confirms no
commercial identity provider offers context-aware name selection
despite possessing the necessary technical infrastructure.
  </Text>
  <Text size='sm' lh='1.5'>
<Text component='span' fw={600}>
  Technical Approach:
</Text>{' '}
This project demonstrates that context-aware name resolution can
be implemented as a layer on top of existing OAuth systems
without requiring changes to consuming applications.
  </Text>
  <Text size='sm' lh='1.5'>
<Text component='span' fw={600}>
  Implementation Scope:
</Text>{' '}
Built for academic demonstration using Next.js 15, React 19,
TypeScript, Supabase, and PostgreSQL with comprehensive
end-to-end testing and OAuth compliance.
  </Text>
  <Text size='sm' lh='1.5'>
<Text component='span' fw={600}>
  Technical Achievement:
</Text>{' '}
Includes working OAuth integration, REST API implementation,
comprehensive test suite, and performance monitoring across
multiple browsers and devices.
  </Text>
</Stack>
  </Paper>
</div>

<Divider my='xl' />

{/* Demo Apps Integration */}
<div data-testid='overview-demo-section'>
  <Title order={2} mb='md'>
See It In Action
  </Title>
  <Text size='md' c='dimmed' mb='lg'>
This academic project includes working demonstration applications
that show how context-aware identity resolution functions in
practice. Each demo app represents a different context and shows how
names are presented differently based on the requesting application.
  </Text>
  <DemoAppsShowcase />
</div>

<Divider my='xl' />

{/* Call to Action */}
<div data-testid='overview-cta'>
  <Paper p='lg' bg='blue.0' radius='lg'>
<Stack gap='md'>
  <Text size='lg' fw={600} ta='center'>
Explore this academic demonstration
  </Text>
  <Text size='md' c='dimmed' ta='center' lh='1.5'>
Try the demo applications above to see context-aware identity
resolution in action, or continue to the Quick Start Guide to
understand the system architecture and implementation.
  </Text>
</Stack>
  </Paper>
</div>
  </Stack>
</Paper>
  );
}
