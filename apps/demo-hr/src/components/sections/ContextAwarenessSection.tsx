/**
 * Context Awareness Section - Demonstrates Context-Aware Identity
 * Shows how identity data varies by context and application
 */

import React from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Divider,
  Alert,
} from '@mantine/core';
import { IconSettings, IconInfoCircle } from '@tabler/icons-react';
import { paperStyles, contextFields } from '../shared/styles';
import type { OIDCClaims } from '@uni-final/truename-oauth';

interface ContextAwarenessSectionProps {
  userData: OIDCClaims;
}

export const ContextAwarenessSection: React.FC<
  ContextAwarenessSectionProps
> = ({ userData }) => {
  return (
<Paper {...paperStyles} data-testid='demo-hr-context-awareness-section'>
  <Stack gap='lg'>
<Group justify='space-between' align='center'>
  <Group gap='sm'>
<IconSettings size={24} color='var(--mantine-color-gold-5)' />
<Title order={2} c='gold.5'>
  Context Awareness Demonstration
</Title>
  </Group>
  <Badge color='gold' variant='light'>
Dynamic Identity
  </Badge>
</Group>

<Divider />

<Stack gap='md'>
  {contextFields.map((field) => (
<Group key={field.label} justify='space-between' wrap='nowrap'>
  <Text size='sm' c='gray.6' fw={500} style={{ minWidth: '140px' }}>
{field.label.toUpperCase()}
  </Text>
  <Text
size={field.size}
c='gray.8'
fw={600}
ta='right'
style={{ flex: 1 }}
data-testid={`demo-hr-${field.key.replace('_', '-')}`}
  >
{userData[field.key]}
  </Text>
</Group>
  ))}
</Stack>

<Alert
  variant='light'
  color='gold'
  icon={<IconInfoCircle size={16} />}
  title='Context-Aware Identity Resolution'
>
  <Text size='sm'>
This identity data is specifically tailored for the{' '}
<strong>{userData.context_name}</strong> context. The same user may
present different name variations to different applications based on
their privacy preferences and context assignments.
  </Text>
</Alert>

<Text size='sm' c='gray.6' ta='center' fw={500}>
  Powered by TrueNamePath - Privacy-First Identity Management
</Text>
  </Stack>
</Paper>
  );
};
