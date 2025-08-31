import React from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  ActionIcon,
  CopyButton,
  Tooltip,
  Code,
} from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import type { OIDCClaims } from '../types';

export interface ResponseViewerProps {
  /** OIDC claims data to display */
  data: OIDCClaims;
  /** Optional title for the response viewer */
  title?: string;
  /** Whether to show performance metrics */
  showMetrics?: boolean;
  /** Response time in milliseconds (if available) */
  responseTime?: number;
  /** Optional additional metadata to display */
  metadata?: Record<string, string | number>;
}

/**
 * Professional JSON response viewer component for displaying OIDC claims
 * in a Postman-style interface with syntax highlighting and copy functionality.
 */
export function ResponseViewer({
  data,
  title = 'OIDC Claims Response',
  showMetrics = true,
  responseTime,
  metadata,
}: ResponseViewerProps): React.JSX.Element {
  // Format the JSON with proper indentation
  const formattedJson = JSON.stringify(data, null, 2);

  // Calculate display metrics
  const now = new Date();
  const resolvedAt = now.toLocaleString();

  return (
<Paper withBorder p='md' radius='md'>
  <Stack gap='sm'>
{/* Header with title and copy button */}
<Group justify='space-between' align='center'>
  <Text fw={600} size='sm' c='dimmed'>
{title}
  </Text>
  <Group gap='xs'>
<CopyButton value={formattedJson} timeout={2000}>
  {({ copied, copy }) => (
<Tooltip
  label={copied ? 'Copied!' : 'Copy response'}
  withArrow
  position='left'
>
  <ActionIcon
color={copied ? 'teal' : 'gray'}
variant='subtle'
onClick={copy}
size='sm'
  >
{copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
  </ActionIcon>
</Tooltip>
  )}
</CopyButton>
  </Group>
</Group>

{/* JSON Response Body */}
<Code
  block
  style={{
fontSize: '0.875rem',
lineHeight: 1.5,
whiteSpace: 'pre-wrap',
wordBreak: 'break-word',
backgroundColor: 'var(--mantine-color-gray-0)',
border: '1px solid var(--mantine-color-gray-3)',
borderRadius: 'var(--mantine-radius-md)',
padding: 'var(--mantine-spacing-sm)',
overflow: 'auto',
maxHeight: '400px', // Limit height for very long responses
  }}
>
  {formattedJson}
</Code>

{/* Footer with metadata and performance info */}
{(showMetrics || metadata) && (
  <Group justify='space-between' gap='xs'>
<Text size='xs' c='dimmed'>
  Resolved at {resolvedAt}
</Text>
{responseTime && (
  <Text size='xs' c='dimmed'>
Response time: {responseTime}ms
  </Text>
)}
{metadata && Object.keys(metadata).length > 0 && (
  <Text size='xs' c='dimmed'>
{Object.entries(metadata)
  .map(([key, value]) => `${key}: ${value}`)
  .join(' • ')}
  </Text>
)}
  </Group>
)}
  </Stack>
</Paper>
  );
}
