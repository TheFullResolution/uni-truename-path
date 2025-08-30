'use client';

import type { AuthenticatedUser } from '@/utils/context';
import { swrFetcher, formatSWRError } from '@/utils/swr-fetcher';
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { IconHistory, IconReload, IconAlertCircle } from '@tabler/icons-react';
import useSWRInfinite from 'swr/infinite';

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

const ITEMS_PER_PAGE = 20;

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
});

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
return action
  .split('_')
  .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
  .join(' ');
  };

  // Get details text from app usage log entry
  const getDetailsText = (entry: AuditLogEntry): string => {
const parts: string[] = [];

// Add success status
parts.push(`Status: ${entry.success ? 'Success' : 'Failed'}`);

// Add response time if available
if (entry.response_time_ms !== null) {
  parts.push(`${entry.response_time_ms}ms`);
}

// Add session info if available
if (entry.session_id) {
  parts.push(`Session: ${entry.session_id.slice(0, 8)}...`);
}

// Add error type if failed
if (!entry.success && entry.error_type) {
  parts.push(`Error: ${entry.error_type}`);
}

return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
<Tabs.Panel value='audit-log'>
  <Stack gap='lg'>
<div>
  <Group justify='space-between' mb='md'>
<Title order={2}>App Activity</Title>
<Button
  leftSection={<IconReload size={16} />}
  onClick={handleRefresh}
  variant='light'
  size='sm'
  loading={isValidating}
  data-testid='refresh-audit-log'
>
  Refresh
</Button>
  </Group>

  <Text size='sm' c='dimmed' mb='lg'>
Track OAuth application usage, identity resolutions, and context
assignments.
{totalCount > 0 && (
  <Text component='span' fw={500} ml='xs'>
({totalCount} total entries)
  </Text>
)}
  </Text>
</div>

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
icon={<IconAlertCircle size={16} />}
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
  <Card withBorder>
<Table.ScrollContainer minWidth={800}>
  <Table striped highlightOnHover>
<Table.Thead>
  <Table.Tr>
<Table.Th>Date/Time</Table.Th>
<Table.Th>Action</Table.Th>
<Table.Th>Client/App</Table.Th>
<Table.Th>Details</Table.Th>
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
  size='sm'
  color={ACTION_COLORS[entry.action] || 'gray'}
  variant='light'
>
  {formatAction(entry.action)}
</Badge>
  </Table.Td>
  <Table.Td>
<Text size='sm'>
  <Text component='span' ff='monospace' size='xs'>
{entry.client_id.slice(0, 8)}...
  </Text>
</Text>
  </Table.Td>
  <Table.Td>
<Text size='sm'>{getDetailsText(entry)}</Text>
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
  onClick={handleLoadMore}
  loading={isValidating}
  data-testid='load-more-audit-entries'
>
  Load More Entries
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
<Text size='sm' c='dimmed'>
  All audit entries loaded ({auditEntries.length} of{' '}
  {totalCount})
</Text>
  </Center>
)}
  </Card>
)}
  </Stack>
</Tabs.Panel>
  );
}
