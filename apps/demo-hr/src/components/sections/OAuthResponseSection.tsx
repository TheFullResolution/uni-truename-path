import React from 'react';
import { Paper, Stack, Title, Text, Group, Badge } from '@mantine/core';
import { IconCode, IconShieldCheck } from '@tabler/icons-react';
import { ResponseViewer } from '@uni-final/truename-oauth';
import type { OIDCClaims } from '@uni-final/truename-oauth';

interface OAuthResponseSectionProps {
  userData: OIDCClaims;
}

/**
 * Professional section displaying the complete OIDC response for HR demo app
 * Shows the raw OAuth response data in a structured, readable format
 */
export const OAuthResponseSection: React.FC<OAuthResponseSectionProps> = ({
  userData,
}) => {
  // Calculate some metrics for display
  const claimsCount = Object.keys(userData).length;
  const mandatoryClaims = ['sub', 'iss', 'aud', 'iat', 'exp', 'nbf', 'jti'];
  const optionalClaims = Object.keys(userData).filter(
(key) => !mandatoryClaims.includes(key),
  );

  return (
<Paper
  shadow='sm'
  p='xl'
  radius='md'
  style={{
border: '1px solid var(--mantine-color-gray-2)',
backgroundColor: 'var(--mantine-color-white)',
  }}
>
  <Stack gap='lg'>
{/* Section Header */}
<Group gap='sm' align='center'>
  <IconCode size={24} color='var(--mantine-color-blue-6)' />
  <Title order={3} c='gray.8'>
OAuth Response Data
  </Title>
</Group>

{/* Section Description */}
<Text size='sm' c='gray.6' lh={1.6}>
  Complete OIDC claims response from TrueNamePath API showing all
  identity data resolved for the{' '}
  <strong>{userData.context_name}</strong> context. This demonstrates
  our context-aware identity resolution system in action.
</Text>

{/* Response Metadata */}
<Group gap='md'>
  <Badge
leftSection={<IconShieldCheck size={14} />}
color='green'
variant='light'
size='md'
  >
OIDC Compliant
  </Badge>
  <Badge color='blue' variant='light' size='md'>
{claimsCount} Claims
  </Badge>
  <Badge color='indigo' variant='light' size='md'>
{mandatoryClaims.length} Mandatory
  </Badge>
  <Badge color='violet' variant='light' size='md'>
{optionalClaims.length} Optional
  </Badge>
</Group>

{/* Response Viewer */}
<ResponseViewer
  data={userData}
  title='OIDC Claims Response'
  showMetrics
  metadata={{
'Context': userData.context_name,
'Application': userData.app_name,
'Token Type': userData._token_type || 'Standard',
  }}
/>

{/* Additional Info */}
<Text size='xs' c='gray.5' fs='italic'>
  This response includes all enhanced OIDC claims such as exp, nbf, jti,
  email_verified, locale, and zoneinfo for full compliance and
  demonstration purposes.
</Text>
  </Stack>
</Paper>
  );
};
