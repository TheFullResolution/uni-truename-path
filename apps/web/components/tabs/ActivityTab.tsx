'use client';

import type { AuthenticatedUser } from '@/utils/context';
import { swrFetcher, formatSWRError } from '@/utils/swr-fetcher';
import { TabPanel } from '@/components/dashboard/TabPanel';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Flex,
  Group,
  Loader,
  MultiSelect,
  Stack,
  Text,
  TextInput,
  Timeline,
} from '@mantine/core';
import {
  IconHistory,
  IconReload,
  IconAlertCircle,
  IconSearch,
  IconFilter,
  IconApps,
  IconKey,
  IconDatabase,
  IconX,
} from '@tabler/icons-react';
import useSWRInfinite from 'swr/infinite';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { ActivityTimelineResponse, ActivityEvent } from '@/types/database';

// Import type-specific detail components
import { OAuthEventDetails } from './activity/OAuthEventDetails';
import { AuthEventDetails } from './activity/AuthEventDetails';
import { DataChangeEventDetails } from './activity/DataChangeEventDetails';

interface ActivityTabProps {
  user: AuthenticatedUser | null;
}

const ITEMS_PER_PAGE = 25; // Smaller batches for mixed content

// Event type configurations
const EVENT_TYPE_CONFIG = {
  oauth: {
label: 'OAuth Apps',
icon: IconApps,
color: 'blue',
description: 'Application authorizations and API usage',
  },
  auth: {
label: 'Authentication',
icon: IconKey,
color: 'green',
description: 'Login, logout, and signup events',
  },
  data_change: {
label: 'Data Changes',
icon: IconDatabase,
color: 'orange',
description: 'Profile and context modifications',
  },
} as const;

export function ActivityTab({ user }: ActivityTabProps) {
  // Filter states
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([
'oauth',
'auth',
'data_change',
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 500);

  // Build query parameters
  const queryParams = useMemo(() => {
const params = new URLSearchParams({
  limit: ITEMS_PER_PAGE.toString(),
  event_types: selectedEventTypes.join(','),
});

if (debouncedSearchQuery.trim()) {
  params.set('search_query', debouncedSearchQuery.trim());
}

return params.toString();
  }, [selectedEventTypes, debouncedSearchQuery]);

  // useSWRInfinite getKey function for offset-based pagination
  const getKey = (
pageIndex: number,
previousPageData: ActivityTimelineResponse | null,
  ) => {
if (!user?.id) return null;

// If it's the first page, we don't have previous data
if (pageIndex === 0) {
  return `/api/activity/timeline?offset=0&${queryParams}`;
}

// If previous page had no more data, don't fetch
if (previousPageData && !previousPageData.pagination.hasMore) return null;

// Calculate offset for this page
const offset = pageIndex * ITEMS_PER_PAGE;
return `/api/activity/timeline?offset=${offset}&${queryParams}`;
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
useSWRInfinite<ActivityTimelineResponse>(getKey, swrFetcher, {
  revalidateFirstPage: false,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 60000, // 60-second auto-refresh (less aggressive)
  revalidateAll: false, // Don't revalidate all pages automatically
  keepPreviousData: true, // Smoother transitions when filters change
});

  // Derive last updated timestamp from data availability
  const lastUpdated = data && !isValidating ? new Date() : null;

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
  const allEvents = data ? data.flatMap((page) => page.events) : [];

  const canLoadMore =
data && data.length > 0
  ? (data[data.length - 1]?.pagination?.hasMore ?? false)
  : false;

  // Summary from first page
  const summary = data?.[0]?.summary;

  const handleLoadMore = () => {
setSize(size + 1);
  };

  const handleRefresh = () => {
mutate();
  };

  // Reset pagination when filters change - done by resetting size to 1
  // Note: SWR automatically handles cache invalidation when getKey changes
  const resetToFirstPage = useCallback(() => {
if (size > 1) {
  setSize(1);
}
  }, [size, setSize]);

  // Reset pagination when debounced search changes
  useEffect(() => {
resetToFirstPage();
  }, [debouncedSearchQuery, resetToFirstPage]);

  // Multi-select options for event types
  const eventTypeOptions = Object.entries(EVENT_TYPE_CONFIG).map(
([key, config]) => ({
  value: key,
  label: config.label,
}),
  );

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

  const getEventIcon = (eventType: ActivityEvent['type']) => {
const IconComponent = EVENT_TYPE_CONFIG[eventType].icon;
return <IconComponent size={20} />;
  };

  const getEventColor = (eventType: ActivityEvent['type']) => {
return EVENT_TYPE_CONFIG[eventType].color;
  };

  const renderEventTitle = (event: ActivityEvent) => {
switch (event.type) {
  case 'oauth': {
const actionMap: Record<string, string> = {
  authorize: 'App Authorized',
  resolve: 'Identity Resolved',
  revoke: 'Access Revoked',
  assign_context: 'Context Changed',
};
return actionMap[event.action] || event.action;
  }

  case 'auth': {
const authMap: Record<string, string> = {
  login: 'User Login',
  logout: 'User Logout',
  signup: 'Account Created',
  failed_login: 'Login Failed',
  session_expired: 'Session Expired',
};
return authMap[event.event_type] || event.event_type;
  }

  case 'data_change': {
const operationMap = {
  INSERT: 'Created',
  UPDATE: 'Modified',
  DELETE: 'Deleted',
};
return `${event.table_name} ${operationMap[event.operation]}`;
  }

  default:
return 'Unknown Event';
}
  };

  return (
<TabPanel
  value='activity'
  title='Activity Timeline'
  description={
summary
  ? `Complete audit trail: ${summary.total_oauth_events} OAuth events, ${summary.total_auth_events} auth events, ${summary.total_data_changes} data changes`
  : 'Complete audit trail of all your account activity'
  }
  actions={
<Flex align='center' gap='sm'>
  <Text size='xs' c='dimmed'>
{lastUpdated
  ? `Last updated: ${formatRelativeTime(lastUpdated)}`
  : 'Loading...'}
  </Text>
  <Button
leftSection={<IconReload />}
onClick={handleRefresh}
variant='light'
size='sm'
loading={isValidating}
data-testid='refresh-activity'
  >
Refresh
  </Button>
</Flex>
  }
>
  <Stack gap='lg'>
{/* Filters */}
<Card p='md' withBorder>
  <Stack gap='md'>
{/* Top row - Event types take more space */}
<Group align='flex-end' style={{ flexWrap: 'nowrap' }}>
  <MultiSelect
label='Event Types'
placeholder='Select event types'
data={eventTypeOptions}
value={selectedEventTypes}
onChange={(value) => {
  setSelectedEventTypes(value);
  resetToFirstPage();
}}
leftSection={<IconFilter size={16} />}
clearable={false}
style={{ flex: '1 1 50%', minWidth: '250px' }}
  />

  <TextInput
label='Search'
placeholder='Search events...'
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
leftSection={<IconSearch size={16} />}
rightSection={
  searchQuery && (
<ActionIcon
  size='sm'
  variant='subtle'
  color='gray'
  onClick={() => setSearchQuery('')}
>
  <IconX size={14} />
</ActionIcon>
  )
}
rightSectionPointerEvents='all'
style={{ flex: '1 1 30%', minWidth: '200px' }}
  />
</Group>
  </Stack>
</Card>

{/* Loading State */}
{isLoading ? (
  <Center p='xl'>
<Stack align='center' gap='md'>
  <Loader size='md' />
  <Text size='sm' c='dimmed'>
Loading activity timeline...
  </Text>
</Stack>
  </Center>
) : error ? (
  /* Error State */
  <Alert
color='red'
title='Error Loading Activity'
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
) : allEvents.length === 0 ? (
  /* Empty State */
  <Card p='xl' withBorder>
<Center>
  <Stack align='center' gap='md'>
<IconHistory size={48} color='var(--mantine-color-dimmed)' />
<Text size='lg' fw={500} c='dimmed'>
  No activity found
</Text>
<Text size='sm' c='dimmed' ta='center'>
  When you use OAuth applications, login to your account, or
  modify your profile, activity will appear here for
  transparency and audit purposes.
</Text>
  </Stack>
</Center>
  </Card>
) : (
  /* Timeline */
  <div>
<Timeline active={allEvents.length} bulletSize={24} lineWidth={2}>
  {allEvents.map((eventWrapper) => {
const event = eventWrapper.data;
return (
  <Timeline.Item
key={`${event.type}-${event.id}`}
bullet={getEventIcon(event.type)}
color={getEventColor(event.type)}
  >
<Card p='md' withBorder>
  <Stack gap='xs'>
<Group justify='space-between' align='flex-start'>
  <div>
<Text fw={500} size='sm'>
  {renderEventTitle(event)}
</Text>
<Text size='xs' c='dimmed'>
  {formatDateTime(eventWrapper.timestamp)}
</Text>
  </div>

  <Group gap='xs'>
<Badge
  size='xs'
  variant='light'
  color={getEventColor(event.type)}
>
  {EVENT_TYPE_CONFIG[event.type].label}
</Badge>

{/* Success/Error indicator */}
{'success' in event && (
  <Badge
size='xs'
color={event.success ? 'green' : 'red'}
variant='light'
  >
{event.success ? '✓' : '✗'}
  </Badge>
)}

{/* Performance indicator for OAuth events */}
{event.type === 'oauth' &&
  event.response_time_ms && (
<Badge
  size='xs'
  color={
event.response_time_ms < 100
  ? 'green'
  : event.response_time_ms < 500
? 'yellow'
: 'red'
  }
  variant='light'
>
  {event.response_time_ms}ms
</Badge>
  )}
  </Group>
</Group>

{/* Event-specific details rendered by type-specific components */}
{event.type === 'oauth' && (
  <OAuthEventDetails
event={event}
clientData={eventWrapper.clientData}
contextData={eventWrapper.contextData}
  />
)}

{event.type === 'auth' && (
  <AuthEventDetails event={event} />
)}

{event.type === 'data_change' && (
  <DataChangeEventDetails event={event} />
)}
  </Stack>
</Card>
  </Timeline.Item>
);
  })}
</Timeline>

{/* Load More Button */}
{canLoadMore && (
  <Center mt='lg'>
<Button
  variant='light'
  size='sm'
  onClick={handleLoadMore}
  loading={isValidating}
  data-testid='load-more-activity'
>
  Load More Activity
</Button>
  </Center>
)}

{/* End of results indicator */}
{!canLoadMore && allEvents.length > 0 && (
  <Center mt='lg'>
<Text size='xs' c='dimmed'>
  All activity loaded ({allEvents.length} events)
</Text>
  </Center>
)}
  </div>
)}
  </Stack>
</TabPanel>
  );
}
