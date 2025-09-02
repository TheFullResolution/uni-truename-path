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
TrueNamePath Setup Guide
  </Title>
  <Text size='lg' c='dimmed'>
Academic demonstration of context-aware identity management using
OAuth/OIDC patterns. This guide covers account setup and core
functionality.
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
  Account creation involves two steps with automatic database
  trigger setup.
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
  Complete profile setup. Database triggers automatically create
  the default context and initial name variants.
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
  The default context is automatically created via database triggers
  and requires three mandatory OIDC properties for compliance.
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
  Link your names to OIDC standard properties: name, given_name,
  and family_name. These three properties are mandatory for
  default context completion.
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
  Create additional contexts to demonstrate different identity
  presentations for various OAuth clients.
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
  Unlike the default context, custom contexts have no mandatory
  OIDC property requirements - assign names based on
  demonstration needs.
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
  <Text size='sm'>Common demonstration scenarios:</Text>
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
  OAuth clients receive identity claims based on assigned contexts,
  demonstrating context-aware identity resolution.
</Text>
<Stack gap='sm' mt='md'>
  <div>
<Text fw={500} size='sm'>
  Authorize Apps
</Text>
<Text size='xs' c='dimmed'>
  OAuth authorization creates Bearer token sessions tracked in
  the Connected Apps panel for demonstration purposes.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Assign Contexts
</Text>
<Text size='xs' c='dimmed'>
  Context assignment determines which identity data is resolved
  for each OAuth client via the Bearer token API.
</Text>
  </div>
  <div>
<Text fw={500} size='sm'>
  Context Completeness
</Text>
<Text size='xs' c='dimmed'>
  Green checkmarks indicate contexts have all required OIDC
  properties assigned for complete claims resolution.
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
OAuth clients receive OIDC-compliant identity claims resolved
from the assigned context via the Bearer token API.
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
This demonstration system showcases context-aware identity
management as part of a university final project exploring
OAuth/OIDC patterns and privacy-by-design principles.
  </Text>
</div>
  </Stack>
</Paper>
  );
}
