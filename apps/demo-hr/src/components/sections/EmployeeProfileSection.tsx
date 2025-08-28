/**
 * Employee Profile Section - Professional HR Display
 * Shows employee profile information with context awareness
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
} from '@mantine/core';
import { IconUser, IconBriefcase } from '@tabler/icons-react';
import { paperStyles, employeeFields } from '../shared/styles';
import type { OIDCClaims } from '@uni-final/truename-oauth';

interface EmployeeProfileSectionProps {
  userData: OIDCClaims;
}

export const EmployeeProfileSection: React.FC<EmployeeProfileSectionProps> = ({
  userData,
}) => {
  return (
<Paper {...paperStyles} data-testid='demo-hr-employee-profile-section'>
  <Stack gap='lg'>
<Group justify='space-between' align='center'>
  <Group gap='sm'>
<IconUser size={24} color='var(--mantine-color-corporate-5)' />
<Title order={2} c='corporate.5'>
  Employee Profile
</Title>
  </Group>
  <Group gap='xs'>
<Badge color='green' variant='light'>
  Active
</Badge>
<Badge color='corporate' variant='outline'>
  Professional Context
</Badge>
  </Group>
</Group>

<Divider />

<Stack gap='md'>
  {employeeFields.map((field) => (
<Group key={field.label} justify='space-between' wrap='nowrap'>
  <Text size='sm' c='gray.6' fw={500} style={{ minWidth: '140px' }}>
{field.label.toUpperCase()}
  </Text>
  <Text
size={field.size}
c='gray.8'
fw={600}
ff={field.mono ? 'monospace' : undefined}
ta='right'
style={{ flex: 1 }}
data-testid={`demo-hr-${field.key.replace('_', '-')}`}
  >
{userData[field.key] || 'Not provided'}
  </Text>
</Group>
  ))}
</Stack>

<Group gap='sm' align='center' mt='sm'>
  <IconBriefcase size={16} color='var(--mantine-color-gold-5)' />
  <Text size='sm' c='gray.6' fw={500}>
Displaying professional identity data for workplace context
  </Text>
</Group>
  </Stack>
</Paper>
  );
};
