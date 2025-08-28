/**
 * Authentication Details Section - Technical OAuth Information
 * Shows authentication metadata and technical details
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
import { IconShield, IconClock } from '@tabler/icons-react';
import { paperStyles, authenticationFields } from '../shared/styles';
import type { OIDCClaims } from '@uni-final/truename-oauth';

interface AuthenticationDetailsSectionProps {
  userData: OIDCClaims;
}

const formatAuthTime = (iat: number): string => {
  const date = new Date(iat * 1000);
  return date.toLocaleString('en-US', {
year: 'numeric',
month: 'short',
day: 'numeric',
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
timeZoneName: 'short',
  });
};

export const AuthenticationDetailsSection: React.FC<
  AuthenticationDetailsSectionProps
> = ({ userData }) => {
  return (
<Paper
  {...paperStyles}
  data-testid='demo-hr-authentication-details-section'
>
  <Stack gap='lg'>
<Group justify='space-between' align='center'>
  <Group gap='sm'>
<IconShield size={24} color='var(--mantine-color-forest-5)' />
<Title order={2} c='forest.5'>
  Authentication Details
</Title>
  </Group>
  <Badge color='forest' variant='light'>
OAuth 2.0 / OIDC
  </Badge>
</Group>

<Divider />

<Stack gap='md'>
  {authenticationFields.map((field) => (
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
data-testid={`demo-hr-${field.key}`}
  >
{field.isDate
  ? formatAuthTime(userData[field.key] as number)
  : userData[field.key]}
  </Text>
</Group>
  ))}
</Stack>

<Group gap='sm' align='center' mt='sm'>
  <IconClock size={16} color='var(--mantine-color-forest-5)' />
  <Text size='sm' c='gray.6' fw={500}>
Secure authentication via TrueNamePath identity resolution
  </Text>
</Group>
  </Stack>
</Paper>
  );
};
