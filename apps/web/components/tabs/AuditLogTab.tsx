'use client';

import type { AuthenticatedUser } from '@/utils/context';
import { swrFetcher, formatSWRError } from '@/utils/swr-fetcher';
import { TabPanel } from '@/components/dashboard/TabPanel';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Flex,
  Loader,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { IconHistory, IconReload, IconAlertCircle } from '@tabler/icons-react';
import useSWRInfinite from 'swr/infinite';
import { useState, useEffect } from 'react';

interface AuditLogTabProps {
  user: AuthenticatedUser | null;
}

// Transform app_usage_log entry to match UI expectations (matches API TransformedAuditLogEntry)
type AuditLogEntry = {
  id: number;
  accessed_at: string; // mapped from created_at
  action: string;
  client_id: string;
  session_id: string | null;
  context_id: string | null;
  success: boolean;
  error_type: string | null;
  response_time_ms: number | null;
  // Human-readable fields from joins
  app_display_name: string | null;
  publisher_domain: string | null;
  context_name: string | null;
  // Fields that don't exist in app_usage_log but UI might expect
  resolved_name_id: null;
  target_user_id: string; // mapped from profile_id
};

interface AuditLogResponse {
  entries: AuditLogEntry[];
  pagination: {
total: number;
limit: number;
offset: number;
hasMore: boolean;
  };
}

const ITEMS_PER_PAGE = 50; // Increased for better data density

// Action badge color mapping
const ACTION_COLORS: Record<string, string> = {
  // New app_usage_log actions
  resolve: 'blue',
  authorize: 'green',
  revoke: 'red',
  assign_context: 'violet',
  // Legacy audit_log_entries actions (for compatibility)
  NAME_DISCLOSED: 'blue',
  CONSENT_GRANTED: 'green',
  CONSENT_REVOKED: 'red',
  CONTEXT_CREATED: 'violet',
  CONSENT_REQUESTED: 'orange',
} as const;

export function AuditLogTab({ user }: AuditLogTabProps) {
  // useSWRInfinite getKey function for offset-based pagination
  const getKey = (
pageIndex: number,
previousPageData: AuditLogResponse | null,
  ) => {
if (!user?.id) return null;

// If it's the first page, we don't have previous data
if (pageIndex === 0)
  return `/api/audit-log?limit=${ITEMS_PER_PAGE}&offset=0`;

// If previous page had no more data, don't fetch
if (previousPageData && !previousPageData.pagination.hasMore) return null;

// Calculate offset for this page
const offset = pageIndex * ITEMS_PER_PAGE;
return `/api/audit-log?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
useSWRInfinite<AuditLogResponse>(getKey, swrFetcher, {
  revalidateFirstPage: false,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 30000, // Simple 30-second auto-refresh
});

  // Track last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Update timestamp when data changes
  useEffect(() => {
if (data && !isValidating) {
  setLastUpdated(new Date());
}
  }, [data, isValidating]);

  // Format relative time for "last updated" indicator
  const formatRelativeTime = (date: Date): string => {
const now = new Date();
const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

if (diffInSeconds < 60) {
  return diffInSeconds < 10 ? 'just now' : `${diffInSeconds}s ago`;
}

const diffInMinutes = Math.floor(diffInSeconds / 60);
if (diffInMinutes < 60) {
  return `${diffInMinutes}m ago`;
}

const diffInHours = Math.floor(diffInMinutes / 60);
return `${diffInHours}h ago`;
  };

  // Flatten the data array for rendering
  const auditEntries = data ? data.flatMap((page) => page.entries) : [];

  // Check if we can load more
  const canLoadMore =
data && data.length > 0
  ? (data[data.length - 1]?.pagination?.hasMore ?? false)
  : false;

  // Total count from first page
  const totalCount = data?.[0]?.pagination?.total ?? 0;

  const handleLoadMore = () => {
setSize(size + 1);
  };

  const handleRefresh = () => {
mutate();
  };

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
return new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
}).format(new Date(dateString));
  };

  // Format action type for display
  const formatAction = (action: string) => {
const actionMap: Record<string, string> = {
  resolve: 'Identity Resolved',
  authorize: 'App Authorized',
  revoke: 'Access Revoked',
  assign_context: 'Context Changed',
};
return (
  actionMap[action] ||
  action
.split('_')
.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
.join(' ')
);
  };

  // Get details text from app usage log entry
  const getDetailsText = (entry: AuditLogEntry): string => {
const parts: string[] = [];

// Add response time if available
if (entry.response_time_ms !== null) {
  parts.push(`${entry.response_time_ms}ms`);
}

// Add error type if failed
if (!entry.success && entry.error_type) {
  parts.push(`Error: ${entry.error_type}`);
}

return parts.length > 0 ? parts.join(', ') : '';
  };

  // Get response time color based on performance
  const getResponseTimeColor = (ms: number | null): string => {
if (ms === null) return 'gray';
if (ms < 50) return 'green';
if (ms < 200) return 'yellow';
return 'red';
  };

  return (
<TabPanel
  value='audit-log'
  title='App Activity'
  description={`Track OAuth application usage, identity resolutions, and context assignments.${totalCount > 0 ? ` (${totalCount} total entries)` : ''}`}
  actions={
<Flex align='center' gap='sm'>
  <Text size='xs' c='dimmed'>
Last updated: {formatRelativeTime(lastUpdated)}
  </Text>
  <Button
leftSection={<IconReload />}
onClick={handleRefresh}
variant='light'
size='sm'
loading={isValidating}
data-testid='refresh-audit-log'
  >
Refresh
  </Button>
</Flex>
  }
>
  <Stack gap='lg'>
{/* Loading State */}
{isLoading ? (
  <Center p='xl'>
<Stack align='center' gap='md'>
  <Loader size='md' />
  <Text size='sm' c='dimmed'>
Loading audit entries...
  </Text>
</Stack>
  </Center>
) : error ? (
  /* Error State */
  <Alert
color='red'
title='Error Loading Audit Log'
icon={<IconAlertCircle />}
  >
<Text size='sm'>{formatSWRError(error)}</Text>
<Button
  size='xs'
  variant='light'
  color='red'
  mt='sm'
  onClick={handleRefresh}
>
  Try Again
</Button>
  </Alert>
) : auditEntries.length === 0 ? (
  /* Empty State */
  <Card p='xl' withBorder>
<Center>
  <Stack align='center' gap='md'>
<IconHistory size={48} color='var(--mantine-color-dimmed)' />
<Text size='lg' fw={500} c='dimmed'>
  No activity yet
</Text>
<Text size='sm' c='dimmed' ta='center'>
  When OAuth applications access your identity information or
  you assign contexts, they will appear here for transparency
  and monitoring.
</Text>
  </Stack>
</Center>
  </Card>
) : (
  /* Data Table */
  <Box w='100%'>
<Table.ScrollContainer minWidth={800}>
  <Table striped highlightOnHover>
<Table.Thead>
  <Table.Tr>
<Table.Th>Date/Time</Table.Th>
<Table.Th>Action</Table.Th>
<Table.Th>Application</Table.Th>
<Table.Th>Context</Table.Th>
<Table.Th>Status</Table.Th>
  </Table.Tr>
</Table.Thead>
<Table.Tbody>
  {auditEntries.map((entry) => (
<Table.Tr key={entry.id}>
  <Table.Td>
<Text size='sm' style={{ whiteSpace: 'nowrap' }}>
  {formatDateTime(entry.accessed_at)}
</Text>
  </Table.Td>
  <Table.Td>
<Badge
  size='xs'
  color={ACTION_COLORS[entry.action] || 'gray'}
  variant='light'
>
  {formatAction(entry.action)}
</Badge>
  </Table.Td>
  <Table.Td>
<Stack gap={2}>
  <Text size='sm' fw={500} title={entry.client_id}>
{entry.app_display_name || 'Unknown App'}
  </Text>
  {entry.publisher_domain && (
<Text size='xs' c='dimmed'>
  {entry.publisher_domain}
</Text>
  )}
</Stack>
  </Table.Td>
  <Table.Td>
{entry.context_name ? (
  <Badge size='xs' variant='light' color='violet'>
{entry.context_name}
  </Badge>
) : (
  <Text size='xs' c='dimmed'>
Default
  </Text>
)}
  </Table.Td>
  <Table.Td>
<Flex align='center' gap='xs'>
  {entry.success ? (
<Text size='xs' c='green' fw={500}>
  ✓ Success
</Text>
  ) : (
<Text size='xs' c='red' fw={500}>
  ✗ Failed
</Text>
  )}
  {entry.response_time_ms !== null && (
<Badge
  size='xs'
  color={getResponseTimeColor(
entry.response_time_ms,
  )}
  variant='light'
>
  {entry.response_time_ms}ms
</Badge>
  )}
</Flex>
{getDetailsText(entry) && (
  <Text size='xs' c='dimmed' mt={2}>
{getDetailsText(entry)}
  </Text>
)}
  </Table.Td>
</Table.Tr>
  ))}
</Table.Tbody>
  </Table>
</Table.ScrollContainer>

{/* Load More Button */}
{canLoadMore && (
  <Center
mt='md'
pt='md'
style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
  >
<Button
  variant='light'
  size='sm'
  onClick={handleLoadMore}
  loading={isValidating}
  data-testid='load-more-audit-entries'
>
  Load More
</Button>
  </Center>
)}

{/* End of results indicator */}
{!canLoadMore && auditEntries.length > 0 && (
  <Center
mt='md'
pt='md'
style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
  >
<Text size='xs' c='dimmed'>
  All entries loaded ({auditEntries.length} of {totalCount})
</Text>
  </Center>
)}
  </Box>
)}
  </Stack>
</TabPanel>
  );
}
