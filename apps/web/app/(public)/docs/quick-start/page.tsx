import {
  Paper,
  Title,
  Text,
  Stack,
  Timeline,
  TimelineItem,
  ThemeIcon,
  Table,
  TableThead,
  TableTbody,
  TableTr,
  TableTh,
  TableTd,
  Alert,
  Code,
} from '@mantine/core';
import {
  IconUser,
  IconSettings,
  IconUsers,
  IconPlug,
  IconShield,
  IconInfoCircle,
} from '@tabler/icons-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quick Start | TrueNamePath User Guide',
  description:
'Step-by-step guide to setting up your TrueNamePath account and managing your identity contexts',
};

export default function QuickStartPage() {
  return (
<Paper p='xl' shadow='sm' radius='lg'>
  <Stack gap='xl' data-testid='quick-start-content'>
<div data-testid='quick-start-hero'>
  <Title order={1} mb='md'>
Getting Started with TrueNamePath
  </Title>
  <Text size='lg' c='dimmed'>
Follow these simple steps to set up your account and start managing
your digital identity
  </Text>
</div>

<Timeline
  active={-1}
  bulletSize={40}
  lineWidth={2}
  data-testid='quick-start-timeline'
>
  <TimelineItem
bullet={
  <ThemeIcon
size={40}
variant='gradient'
gradient={{ from: 'blue', to: 'cyan' }}
  >
<IconUser size='20' />
  </ThemeIcon>
}
title='Account Creation'
  >
<Text c='dimmed' size='sm' mt='xs'>
  Start by creating your TrueNamePath account in just two simple
  steps.
</Text>
<Stack gap='sm' mt='md'>
  <div>
<Text fw={500} size='sm'>
  Step 1: Basic Registration
</Text>
<Text size='xs' c='dimmed'>
  Enter your email and create a secure password. No email
  verification needed for this academic project.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Step 2: Profile Completion
</Text>
<Text size='xs' c='dimmed'>
  Complete your profile setup. The system will automatically
  create your default public context.
</Text>
  </div>
</Stack>
  </TimelineItem>

  <TimelineItem
bullet={
  <ThemeIcon
size={40}
variant='gradient'
gradient={{ from: 'teal', to: 'green' }}
  >
<IconSettings size='20' />
  </ThemeIcon>
}
title='Default Context Setup'
  >
<Text c='dimmed' size='sm' mt='xs'>
  Your default context is automatically created and serves as your
  public identity baseline.
</Text>
<Stack gap='sm' mt='md'>
  <div>
<Text fw={500} size='sm'>
  Add Your Names
</Text>
<Text size='xs' c='dimmed'>
  Go to the Names tab and add different versions of your name
  like &ldquo;John Smith&rdquo;, &ldquo;John&rdquo;, or
  &ldquo;J. Smith&rdquo;.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Assign to OIDC Properties
</Text>
<Text size='xs' c='dimmed'>
  Link your names to standard properties: name, given_name, and
  family_name. These are required for your default context to be
  complete.
</Text>
  </div>
</Stack>

<Table mt='md' withTableBorder data-testid='oidc-properties-table'>
  <TableThead>
<TableTr>
  <TableTh>Property</TableTh>
  <TableTh>Example Assignment</TableTh>
</TableTr>
  </TableThead>
  <TableTbody>
<TableTr>
  <TableTd>
<Code>name</Code>
  </TableTd>
  <TableTd>John Smith</TableTd>
</TableTr>
<TableTr>
  <TableTd>
<Code>given_name</Code>
  </TableTd>
  <TableTd>John</TableTd>
</TableTr>
<TableTr>
  <TableTd>
<Code>family_name</Code>
  </TableTd>
  <TableTd>Smith</TableTd>
</TableTr>
  </TableTbody>
</Table>
  </TimelineItem>

  <TimelineItem
bullet={
  <ThemeIcon
size={40}
variant='gradient'
gradient={{ from: 'orange', to: 'yellow' }}
  >
<IconUsers size='20' />
  </ThemeIcon>
}
title='Custom Contexts Creation'
  >
<Text c='dimmed' size='sm' mt='xs'>
  Create additional contexts to present different versions of
  yourself to different audiences.
</Text>
<Stack gap='sm' mt='md'>
  <div>
<Text fw={500} size='sm'>
  Create New Contexts
</Text>
<Text size='xs' c='dimmed'>
  Visit the Contexts tab and create contexts like &ldquo;Work
  Colleagues&rdquo;, &ldquo;Gaming Friends&rdquo;, or &ldquo;HR
  Systems&rdquo;.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Set Visibility
</Text>
<Text size='xs' c='dimmed'>
  Choose visibility levels: public (visible to all), private
  (only you can see), or restricted (controlled access).
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Flexible Assignment
</Text>
<Text size='xs' c='dimmed'>
  Unlike your default context, custom contexts don&apos;t
  require specific property assignments - assign names as
  needed.
</Text>
  </div>
</Stack>

<Alert
  icon={<IconInfoCircle size='16' />}
  title='Common Context Examples'
  color='blue'
  variant='light'
  mt='md'
  data-testid='context-examples-alert'
>
  <Text size='sm'>Popular context ideas to get you started:</Text>
  <Stack gap='xs' mt='xs'>
<Text size='xs'>
  • <strong>Work Colleagues</strong> - Professional name for
  workplace
</Text>
<Text size='xs'>
  • <strong>Gaming Friends</strong> - Casual nickname for gaming
</Text>
<Text size='xs'>
  • <strong>HR Systems</strong> - Formal legal name for official
  records
</Text>
<Text size='xs'>
  • <strong>Social Media</strong> - Creative handle for online
  presence
</Text>
<Text size='xs'>
  • <strong>Family</strong> - Familiar name for personal
  relationships
</Text>
  </Stack>
</Alert>
  </TimelineItem>

  <TimelineItem
bullet={
  <ThemeIcon
size={40}
variant='gradient'
gradient={{ from: 'grape', to: 'pink' }}
  >
<IconPlug size='20' />
  </ThemeIcon>
}
title='App Connection'
  >
<Text c='dimmed' size='sm' mt='xs'>
  Connect third-party applications and control how you appear to
  each one.
</Text>
<Stack gap='sm' mt='md'>
  <div>
<Text fw={500} size='sm'>
  Authorize Apps
</Text>
<Text size='xs' c='dimmed'>
  When you authorize an OAuth application, it will automatically
  appear in your Connected Apps panel.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Assign Contexts
</Text>
<Text size='xs' c='dimmed'>
  Choose which context each connected app should see. This
  determines how your identity is presented to that application.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Context Completeness
</Text>
<Text size='xs' c='dimmed'>
  Look for the green checkmark indicating your context has all
  required information for the app to work properly.
</Text>
  </div>
</Stack>

<div style={{ marginTop: 'var(--mantine-spacing-md)' }}>
  <Text size='sm' fw={500} mb='xs'>
What Apps See:
  </Text>
  <Code block data-testid='app-response-code'>{`{
  ${'"'}name${'"'}: ${'"'}John Smith${'"'},
  ${'"'}given_name${'"'}: ${'"'}John${'"'}, 
  ${'"'}family_name${'"'}: ${'"'}Smith${'"'},
  ${'"'}context${'"'}: ${'"'}Work Colleagues${'"'}
}`}</Code>
  <Text size='xs' c='dimmed' mt='xs'>
Apps receive your identity information based on the context
you&apos;ve assigned to them.
  </Text>
</div>
  </TimelineItem>

  <TimelineItem
bullet={
  <ThemeIcon
size={40}
variant='gradient'
gradient={{ from: 'red', to: 'orange' }}
  >
<IconShield size='20' />
  </ThemeIcon>
}
title='Understanding the Rules'
  >
<Text c='dimmed' size='sm' mt='xs'>
  Learn the important rules that keep your identity management safe
  and consistent.
</Text>
<Stack gap='sm' mt='md'>
  <div>
<Text fw={500} size='sm'>
  Protected Names
</Text>
<Text size='xs' c='dimmed'>
  You can&apos;t delete names that are currently assigned to
  contexts. Unassign them first if you need to remove them.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Default Context Requirements
</Text>
<Text size='xs' c='dimmed'>
  Your default context must have names assigned to name,
  given_name, and family_name properties to be considered
  complete.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Assignment Visibility
</Text>
<Text size='xs' c='dimmed'>
  Look for badges that show where each name is being used,
  helping you understand the impact of any changes.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Safe Changes
</Text>
<Text size='xs' c='dimmed'>
  The system will guide you through replacing names safely
  without breaking your existing app connections.
</Text>
  </div>
</Stack>
  </TimelineItem>
</Timeline>

<div data-testid='quick-start-cta'>
  <Text size='sm' c='dimmed' ta='center' mt='xl'>
Ready to get started? Create your account and begin managing your
digital identity across all your applications.
  </Text>
</div>
  </Stack>
</Paper>
  );
}
