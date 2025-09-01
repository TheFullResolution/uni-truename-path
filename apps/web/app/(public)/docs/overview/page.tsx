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
  IconStar,
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
  Academic Research Project
</Badge>
  </Group>
  <Text size='xl' c='dimmed' lh='1.6' mb='lg'>
The first context-aware identity management system that gives users
complete control over how their names are presented to different
audiences.
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
The impact extends beyond inconvenience into measurable
discrimination. Bertrand and Mullainathan&apos;s landmark study
found that resumes with &ldquo;White-sounding&rdquo; names received
50% more callbacks than identical resumes with
&ldquo;African-American-sounding&rdquo; names—demonstrating how name
presentation directly impacts economic opportunity.
  </Text>
  <Text size='md' lh='1.6'>
McKenzie (2010) catalogued over 40 false assumptions that software
systems make about names, from expecting a single canonical
representation to mishandling non-ASCII characters. Despite these
well-documented challenges, traditional identity systems continue to
enforce a one-size-fits-all approach that fails to accommodate the
nuanced, context-dependent nature of personal identity.
  </Text>
</div>

{/* Solution Explanation */}
<div data-testid='overview-solution'>
  <Title order={2} mb='lg' c='green.7'>
Our Innovation: Context-Aware Identity Resolution
  </Title>
  <Text size='md' lh='1.6' mb='lg'>
TrueNamePath is the{' '}
<Text component='span' fw={700}>
  FIRST system of its kind
</Text>{' '}
to offer{' '}
<Text
  component='span'
  bg='yellow.1'
  px={4}
  py={2}
  style={{ borderRadius: '4px' }}
>
  context-aware name resolution
</Text>{' '}
as a primary feature. Surprisingly, despite the identity management
market reaching substantial size, no commercial product offers
user-configurable context-aware name selection.
  </Text>

  <Text size='md' lh='1.6' mb='md'>
<Text component='span' fw={600}>
  The Market Gap:
</Text>{' '}
Major identity providers possess all necessary technical
components—including policy engines and configurable attribute
disclosure capabilities—yet apply these exclusively to security
decisions rather than identity presentation. This represents both a
significant market gap and the key innovation opportunity for this
project.
  </Text>

  <Text size='md' lh='1.6' mb='md'>
<Text component='span' fw={600}>
  Technical Innovation:
</Text>{' '}
TrueNamePath leverages existing OAuth infrastructure in a novel way,
implementing context-aware identity resolution as a transparent
layer on top of standard OAuth flows. Applications receive
contextually appropriate identity information without requiring any
code changes.
  </Text>

  <Text size='md' lh='1.6' mb='md'>
<Text component='span' fw={600}>
  The Core Algorithm:
</Text>{' '}
The system&apos;s{' '}
<Text component='code' size='sm' bg='gray.1' px={4} py={2}>
  resolve_name()
</Text>{' '}
function implements a sophisticated three-layer algorithm: consent
verification (ensuring user has granted permission), visibility
filtering (checking context assignments), and audience-specific
prioritisation (selecting the most appropriate name variant for the
requesting application type).
  </Text>

  <Group align='center' mb='lg'>
<ThemeIcon size={24} color='blue' variant='light'>
  <IconStar size={16} />
</ThemeIcon>
<Text size='sm' fw={600} c='blue.7'>
  First-of-its-kind user-configurable context-aware name selection
  system
</Text>
  </Group>
</div>

{/* Key Features */}
<div data-testid='overview-features'>
  <Title order={2} mb='lg'>
Key Features
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
  Complete User Control:
</Text>{' '}
Users define their own contexts (&ldquo;Work Colleagues,&rdquo;
&ldquo;Gaming Friends,&rdquo; &ldquo;HR Systems,&rdquo;
&ldquo;LinkedIn Professional,&rdquo; &ldquo;Team
Communication,&rdquo; &ldquo;Open Source Development&rdquo;) and
assign appropriate name variants to each context.
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
  Privacy Protection:
</Text>{' '}
GDPR-compliant data minimization with privacy-by-design
architecture prevents over-sharing of personal information by
automatically selecting contextually appropriate names (e.g.,
&ldquo;Alex C.&rdquo; for professional contexts instead of
&ldquo;Alexandra Chen-Rodriguez&rdquo;).
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
  Professional Presentation:
</Text>{' '}
Implements a three-layer algorithm: consent verification,
visibility filtering, and audience-specific prioritisation to
ensure appropriate formality levels for different application
types (formal names for HR systems, casual names for social
platforms).
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
  OAuth Integration:
</Text>{' '}
Seamless integration with existing OAuth workflows -
applications receive contextually appropriate identity
information without code changes.
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
  Performance & Compliance:
</Text>{' '}
Sub-50ms name resolution, 100% audit coverage for GDPR
compliance, and immutable audit trails ensuring complete
transparency in data access.
  </Text>
</ListItem>
  </List>
</div>

<Divider my='xl' />

{/* Demo Apps Integration */}
<div data-testid='overview-demo-section'>
  <Title order={2} mb='md'>
See It In Action
  </Title>
  <Text size='md' c='dimmed' mb='lg'>
Experience TrueNamePath&apos;s context-aware identity resolution
with our live demonstration applications. Each app represents a
different context and shows how the same user can be presented
appropriately to different audiences.
  </Text>
  <DemoAppsShowcase />
</div>

<Divider my='xl' />

{/* Academic Context */}
<div data-testid='overview-academic'>
  <Alert
icon={<IconSchool size={20} />}
title='Academic Project Context'
color='blue'
variant='light'
  >
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
This project proves that context-aware name resolution can be
implemented as a transparent layer on top of existing OAuth
systems, requiring no changes to consuming applications while
providing significant user value.
  </Text>
  <Text size='sm' lh='1.5'>
<Text component='span' fw={600}>
  Implementation Scope:
</Text>{' '}
The system is designed for academic demonstration and
evaluation, showcasing modern web technologies including Next.js
15, React 19, TypeScript, Supabase, PostgreSQL with
comprehensive E2E testing using Playwright and OAuth compliance.
  </Text>
  <Text size='sm' lh='1.5'>
<Text component='span' fw={600}>
  Technical Achievement:
</Text>{' '}
The system demonstrates production-ready deployment with
sub-50ms resolution times, complete OAuth compliance, and a
comprehensive test suite validating all functionality across
multiple browsers and devices.
  </Text>
</Stack>
  </Alert>
</div>

{/* Call to Action */}
<div data-testid='overview-cta'>
  <Paper p='lg' bg='blue.0' radius='lg'>
<Stack gap='md'>
  <Text size='lg' fw={600} ta='center'>
Ready to explore context-aware identity management?
  </Text>
  <Text size='md' c='dimmed' ta='center' lh='1.5'>
Try our demo applications above or continue to the Quick Start
Guide to learn how to configure your own contexts and name
variants.
  </Text>
</Stack>
  </Paper>
</div>
  </Stack>
</Paper>
  );
}
