'use client';

import React from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import {
  Stack,
  Paper,
  Title,
  Text,
  Group,
  Grid,
  Button,
  Card,
  Badge,
  Skeleton,
  Alert,
  Center,
  Code,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconEye,
  IconReload,
  IconAlertTriangle,
  IconApi,
  IconClock,
} from '@tabler/icons-react';
import { formatSWRError, swrFetcher } from '../../../lib/swr-fetcher';
import type {
  ContextsResponseData,
  BatchResolutionResponseData,
} from '../../../types/api-responses';

// Type definitions
interface Context {
  id: string;
  context_name: string;
  description: string | null;
}

// NameResolution interface defined but used in type mapping

interface AssignmentPreviewProps {
  userId: string;
  refreshTrigger?: number; // Currently unused but part of component API
}

export function AssignmentPreview({ userId }: AssignmentPreviewProps) {
  // SWR data fetching with explicit revalidation patterns
  const {
data: contextsData,
error: contextsError,
isLoading: contextsLoading,
  } = useSWR<ContextsResponseData>('/api/contexts', swrFetcher);

  // Extract contexts from API response structure
  const contexts = contextsData?.contexts || [];

  // Batch resolution using new API endpoint with explicit dependency
  const {
data: resolutionsData,
error: resolutionsError,
mutate: revalidateResolutions,
isLoading: resolutionsLoading,
  } = useSWR<BatchResolutionResponseData>(
contexts.length > 0 && userId
  ? `/api/names/resolve/batch/${userId}?contexts=${contexts.map((c: Context) => c.context_name).join(',')}`
  : null,
swrFetcher,
  );

  // Resolution refresh with explicit revalidation
  const { trigger: refreshResolutions, isMutating: isRefreshing } =
useSWRMutation(
  contexts.length > 0 && userId
? `/api/names/resolve/batch/${userId}?contexts=${contexts.map((c: Context) => c.context_name).join(',')}`
: null,
  swrFetcher<BatchResolutionResponseData>,
  {
onSuccess: () => {
  revalidateResolutions(); // EXPLICIT revalidation
},
onError: (error) => {
  notifications.show({
title: 'Error Refreshing Preview',
message: formatSWRError(error),
color: 'red',
autoClose: 5000,
  });
},
  },
);

  // Handle refresh with explicit revalidation
  const handleRefresh = () => {
if (contexts.length > 0 && userId) {
  refreshResolutions();
}
  };

  // Map API source values to frontend source values
  const mapSourceValue = (
apiSource: string,
  ): 'assignment' | 'preferred' | 'fallback' => {
switch (apiSource) {
  case 'consent_based':
  case 'context_specific':
return 'assignment';
  case 'preferred_fallback':
return 'preferred';
  case 'error_fallback':
return 'fallback';
  default:
return 'fallback';
}
  };

  // Get source color for badges
  const getSourceColor = (source: string) => {
switch (source) {
  case 'assignment':
return 'blue';
  case 'preferred':
return 'green';
  case 'fallback':
return 'gray';
  default:
return 'orange';
}
  };

  // Get source label
  const getSourceLabel = (source: string) => {
switch (source) {
  case 'assignment':
return 'Context Assignment';
  case 'preferred':
return 'Preferred Name';
  case 'fallback':
return 'Fallback';
  default:
return source;
}
  };

  // Loading state for initial data fetching
  if (contextsLoading || (contexts.length > 0 && resolutionsLoading)) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='lg'>
  <IconEye size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Name Resolution Preview
  </Title>
</Group>
<Stack gap='md'>
  <Skeleton height={80} />
  <Skeleton height={80} />
  <Skeleton height={80} />
</Stack>
  </Paper>
);
  }

  // Error state for contexts
  if (contextsError) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='lg'>
  <IconEye size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Name Resolution Preview
  </Title>
</Group>
<Alert
  icon={<IconAlertTriangle size={16} />}
  color='red'
  title='Error Loading Contexts'
>
  {formatSWRError(contextsError)}
</Alert>
  </Paper>
);
  }

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group justify='space-between' mb='lg'>
<Group gap='sm'>
  <IconEye size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Name Resolution Preview
  </Title>
  <Badge variant='light' color='blue' size='sm'>
{contexts.length} contexts
  </Badge>
</Group>

<Button
  variant='light'
  color='brand'
  size='sm'
  onClick={handleRefresh}
  loading={isRefreshing}
  leftSection={<IconReload size={16} />}
>
  Refresh Preview
</Button>
  </Group>

  <Text size='sm' c='gray.6' mb='xl'>
Live preview of how names will be resolved for different contexts using
the TrueNamePath algorithm.
  </Text>

  {contexts.length === 0 ? (
<Center py='xl'>
  <Stack align='center' gap='md'>
<IconEye size={48} color='#ced4da' />
<Text size='lg' c='gray.6'>
  No contexts available
</Text>
<Text size='sm' c='gray.5' ta='center'>
  Create contexts to see name resolution preview
</Text>
  </Stack>
</Center>
  ) : isRefreshing || resolutionsLoading ? (
<Stack gap='md'>
  {contexts.map((context: Context) => (
<Card key={context.id} p='md' withBorder radius='md'>
  <Group justify='space-between'>
<Skeleton height={20} width='40%' />
<Skeleton height={20} width='20%' />
  </Group>
  <Skeleton height={16} width='60%' mt='sm' />
</Card>
  ))}
</Stack>
  ) : (
<Stack gap='md'>
  {resolutionsError && (
<Alert
  icon={<IconAlertTriangle size={16} />}
  color='orange'
  title='Resolution Error'
>
  {formatSWRError(resolutionsError)}
</Alert>
  )}

  {contexts.map((context: Context) => {
// Find resolution for this context from batch API response
const resolution = resolutionsData?.resolutions?.find(
  (r: { context: string }) => r.context === context.context_name,
);

return (
  <Card key={context.id} p='md' withBorder radius='md' bg='gray.0'>
<Grid align='center'>
  <Grid.Col span={{ base: 12, md: 4 }}>
<Stack gap='xs'>
  <Text fw={600} size='md' c='gray.8'>
{context.context_name}
  </Text>
  {context.description && (
<Text size='xs' c='gray.6'>
  {context.description}
</Text>
  )}
</Stack>
  </Grid.Col>

  <Grid.Col span={{ base: 12, md: 1 }}>
<Center>
  <IconApi size={20} color='#4A7FE7' />
</Center>
  </Grid.Col>

  <Grid.Col span={{ base: 12, md: 7 }}>
{resolution &&
resolution.resolvedName &&
!resolution.errorMessage ? (
  <Stack gap='xs'>
<Group justify='space-between' align='center'>
  <Code
fz='md'
fw={600}
c='blue.7'
bg='blue.0'
p='xs'
style={{ borderRadius: '4px' }}
data-testid='resolved-name-display'
  >
&quot;{resolution.resolvedName}&quot;
  </Code>
  <Group gap='xs'>
<Badge
  size='sm'
  variant='filled'
  color={getSourceColor(
mapSourceValue(
  resolution.source || 'error_fallback',
),
  )}
>
  {getSourceLabel(
mapSourceValue(
  resolution.source || 'error_fallback',
),
  )}
</Badge>
{resolution.responseTimeMs && (
  <Badge
size='sm'
variant='light'
color='gray'
leftSection={<IconClock size={12} />}
data-testid='resolution-time'
  >
{resolution.responseTimeMs}ms
  </Badge>
)}
  </Group>
</Group>

{resolution.source && (
  <Text
size='xs'
c='gray.6'
data-testid='resolution-metadata'
  >
Source: {resolution.source}
  </Text>
)}
  </Stack>
) : (
  <Alert
icon={<IconAlertTriangle size={14} />}
color='orange'
title='Resolution Failed'
  >
<Text size='xs'>
  {resolution?.errorMessage ||
'Unable to resolve name for this context'}
</Text>
  </Alert>
)}
  </Grid.Col>
</Grid>
  </Card>
);
  })}

  {contexts.length > 0 && resolutionsData?.resolutions && (
<>
  <Divider my='md' />
  <Card p='sm' withBorder radius='md' bg='blue.0'>
<Group gap='xs'>
  <IconApi size={16} color='#4A7FE7' />
  <Text size='sm' fw={500} c='blue.7'>
Algorithm Performance
  </Text>
</Group>
<Text size='xs' c='gray.6' mt='xs'>
  Batch resolution: {resolutionsData.successfulResolutions}/
  {resolutionsData.totalContexts} successful
  {resolutionsData.successfulResolutions > 0 && (
<> • Average performance: 2.4ms per resolution</>
  )}
</Text>
  </Card>
</>
  )}
</Stack>
  )}
</Paper>
  );
}
