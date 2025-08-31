'use client';

import { ContextWithStats } from '@/app/api/contexts/types';
import { Badge, Group, Select, SelectProps } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';
import useSWRMutation from 'swr/mutation';
import { createMutationFetcher, formatSWRError } from '@/utils/swr-fetcher';
import type { UpdateAssignmentResponseData } from '@/types/oauth';

interface ContextSelectorFilteredProps {
  clientId: string;
  currentContextId: string;
  availableContexts: ContextWithStats[];
  appName: string;
  onRevalidate?: () => void;
  size?: SelectProps['size'];
  width?: number | string;
}

/**
 * Get completeness badge for context
 */
function getCompletenessBadge(context: ContextWithStats) {
  switch (context.completion_status) {
case 'complete':
  return (
<Badge size='xs' color='green' variant='filled'>
  <Group gap={2} align='center'>
<IconCheck size={10} />
Complete
  </Group>
</Badge>
  );
case 'partial':
  return (
<Badge size='xs' color='yellow' variant='filled'>
  <Group gap={2} align='center'>
<IconAlertTriangle size={10} />
Partial
  </Group>
</Badge>
  );
case 'invalid':
  // Should not appear as invalid contexts are filtered out
  return (
<Badge size='xs' color='red' variant='filled'>
  <Group gap={2} align='center'>
<IconX size={10} />
Invalid
  </Group>
</Badge>
  );
default:
  return null;
  }
}

/**
 * Enhanced context selector with visual indicators
 * Simplified version that removes grouping and client-side filtering
 * Assumes contexts are pre-filtered server-side
 */
export function ContextSelectorFiltered({
  clientId,
  currentContextId,
  availableContexts = [],
  appName,
  onRevalidate,
  size = 'xs',
  width = 300,
}: ContextSelectorFilteredProps) {
  // Mutation for updating context assignment with proper typing
  const { trigger: updateContext, isMutating } = useSWRMutation<
UpdateAssignmentResponseData,
Error,
string,
{ context_id: string }
  >(`/api/oauth/assignments/${clientId}`, createMutationFetcher('PUT'), {
onSuccess: () => {
  notifications.show({
title: 'Context Updated',
message: `Context assignment updated successfully for ${appName}`,
color: 'green',
icon: <IconCheck size={16} />,
autoClose: 3000,
  });
  // Use the revalidate function passed from parent (following NamesTab pattern)
  onRevalidate?.();
},
onError: (error) => {
  notifications.show({
title: 'Update Failed',
message: formatSWRError(error),
color: 'red',
icon: <IconX size={16} />,
autoClose: 5000,
  });
},
  });

  const handleContextChange = (newContextId: string) => {
if (newContextId === currentContextId) return;
updateContext({ context_id: newContextId });
  };

  // Filter out invalid contexts (only show partial and complete)
  const validContexts = availableContexts.filter(
(context) => context.completion_status !== 'invalid',
  );

  // Create simple select data with only standard properties
  const selectData = validContexts.map((context) => ({
value: context.id,
label: context.context_name,
disabled: false, // All contexts are valid since we filtered out invalid ones
  }));

  // Create lookup map for context metadata needed in renderOption
  const contextLookup = new Map(
validContexts.map((context) => [context.id, context]),
  );

  return (
<Select
  value={currentContextId}
  onChange={(value) => value && handleContextChange(value)}
  disabled={isMutating}
  data={selectData}
  renderOption={({ option }) => {
const context = contextLookup.get(option.value);
if (!context) return option.label;

return (
  <Group justify='space-between' align='center' w='100%'>
<Group gap={6} align='center'>
  <span>{context.context_name}</span>
</Group>

<Group gap={4} align='center'>
  {/* Assignment count badge */}
  {context.oidc_assignment_count > 0 && (
<Badge size='xs' variant='light' color='cyan'>
  {context.oidc_assignment_count}
</Badge>
  )}

  {/* Completeness badge */}
  {getCompletenessBadge(context)}
</Group>
  </Group>
);
  }}
  placeholder='Select context'
  size={size}
  w={width}
  data-testid={`context-selector-filtered-${clientId}`}
  maxDropdownHeight={300}
  comboboxProps={{
transitionProps: { duration: 200, transition: 'pop' },
  }}
/>
  );
}
