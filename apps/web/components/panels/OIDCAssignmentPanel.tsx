'use client';

// import { useAuth } from '@/utils/context'; // Available for future use
import type { StandardOAuthScope, OIDCScope } from '@/types/oidc';
import type { NamesResponseData } from '@/app/api/names/types';
import type { OIDCProperty } from '@/app/api/assignments/schemas';
import { SUPPORTED_OIDC_CLAIMS } from '@/app/api/assignments/schemas';
import {
  createMutationFetcher,
  formatSWRError,
  swrFetcher,
} from '@/utils/swr-fetcher';
import { CACHE_KEYS } from '@/utils/swr-keys';
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  MultiSelect,
  Paper,
  Select,
  Skeleton,
  Stack,
  Text,
  Title,
  Divider,
  ActionIcon,
  Center,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconKey,
  IconPlus,
  IconReload,
  IconTrash,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

// =============================================================================
// Types
// =============================================================================

// OIDC property type from database enum (imported from schemas)
type OIDCPropertyType = OIDCProperty;

interface OIDCAssignment {
  assignment_id: string;
  property_type: OIDCPropertyType;
  name_id: string;
  name_text: string;
  visibility_level: 'STANDARD' | 'RESTRICTED' | 'PRIVATE';
  allowed_scopes: string[];
  created_at: string;
  updated_at: string;
}

interface OIDCAssignmentRequest {
  context_id: string;
  oidc_property: OIDCPropertyType;
  name_id: string;
  is_primary: boolean;
  visibility_level: 'STANDARD' | 'RESTRICTED' | 'PRIVATE';
  allowed_scopes: StandardOAuthScope[];
}

interface OIDCAssignmentPanelProps {
  selectedContextId: string | null;
  contexts: Array<{
id: string;
context_name: string;
description?: string | null;
  }>; // Pass contexts from parent
  onRefresh?: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get human-readable description for OIDC claim types
 */
function getClaimDescription(claim: OIDCPropertyType): string {
  switch (claim) {
case 'given_name':
  return 'First name';
case 'family_name':
  return 'Last name';
case 'name':
  return 'Full name';
case 'nickname':
  return 'Casual name';
case 'display_name':
  return 'Display name';
case 'preferred_username':
  return 'Username';
case 'middle_name':
  return 'Middle name';
default:
  return 'Profile property';
  }
}

// =============================================================================
// Component
// =============================================================================

export function OIDCAssignmentPanel({
  selectedContextId,
  contexts,
  onRefresh,
}: OIDCAssignmentPanelProps) {
  // const { supabase } = useAuth(); // Available for future use

  // =============================================================================
  // State
  // =============================================================================

  const [currentAssignment, setCurrentAssignment] = useState<{
property_type: OIDCPropertyType | '';
name_id: string;
visibility_level: 'STANDARD' | 'RESTRICTED' | 'PRIVATE';
allowed_scopes: StandardOAuthScope[];
  }>({
property_type: '',
name_id: '',
visibility_level: 'STANDARD',
allowed_scopes: ['openid', 'profile'],
  });

  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(
new Set(),
  );

  // =============================================================================
  // Data Fetching
  // =============================================================================

  // Fetch user's names for selection
  const {
data: namesData,
error: namesError,
isLoading: namesLoading,
  } = useSWR<NamesResponseData>(
CACHE_KEYS.NAMES,
swrFetcher<NamesResponseData>,
  );

  // Contexts are passed as props from parent component

  // Fetch OIDC assignments for selected context
  const {
data: assignmentsData,
error: assignmentsError,
mutate: revalidateAssignments,
isLoading: assignmentsLoading,
  } = useSWR<{ assignments: OIDCAssignment[] }>(
selectedContextId
  ? `/api/assignments/oidc?context_id=${selectedContextId}`
  : null,
swrFetcher<{ assignments: OIDCAssignment[] }>,
  );

  // =============================================================================
  // Derived Data
  // =============================================================================

  const names = useMemo(() => namesData?.names || [], [namesData?.names]);
  const assignments = useMemo(
() => assignmentsData?.assignments || [],
[assignmentsData?.assignments],
  );
  const selectedContext = contexts.find((ctx) => ctx.id === selectedContextId);

  // Available OIDC claims not yet assigned to this context
  const availableOIDCClaims = useMemo(() => {
const standardClaims: OIDCPropertyType[] = [...SUPPORTED_OIDC_CLAIMS];
const assignedClaims = new Set(assignments.map((a) => a.property_type));
return standardClaims.filter((claim) => !assignedClaims.has(claim));
  }, [assignments]);

  // =============================================================================
  // Mutations
  // =============================================================================

  const { trigger: createAssignment, isMutating: isCreating } = useSWRMutation(
'/api/assignments/oidc',
createMutationFetcher<
  { assignment: OIDCAssignment },
  OIDCAssignmentRequest
>('POST'),
{
  onSuccess: () => {
revalidateAssignments();
setCurrentAssignment({
  property_type: '',
  name_id: '',
  visibility_level: 'STANDARD',
  allowed_scopes: ['openid', 'profile'],
});
notifications.show({
  title: 'Assignment Created',
  message: 'OIDC claim assignment created successfully',
  color: 'green',
  icon: <IconCheck size={16} />,
});
onRefresh?.();
  },
  onError: (error) => {
notifications.show({
  title: 'Assignment Failed',
  message: formatSWRError(error),
  color: 'red',
  icon: <IconX size={16} />,
});
  },
},
  );

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { trigger: updateAssignment } = useSWRMutation(
'/api/assignments/oidc',
createMutationFetcher<
  { assignment: OIDCAssignment },
  OIDCAssignmentRequest
>('PUT'),
{
  onSuccess: () => {
revalidateAssignments();
notifications.show({
  title: 'Assignment Updated',
  message: 'OIDC claim assignment updated successfully',
  color: 'green',
  icon: <IconCheck size={16} />,
});
onRefresh?.();
  },
  onError: (error) => {
notifications.show({
  title: 'Update Failed',
  message: formatSWRError(error),
  color: 'red',
  icon: <IconX size={16} />,
});
  },
},
  );

  const { trigger: deleteAssignment, isMutating: isDeleting } = useSWRMutation(
'/api/assignments/oidc',
createMutationFetcher<{ success: true }, { assignment_id: string }>(
  'DELETE',
),
{
  onSuccess: () => {
revalidateAssignments();
notifications.show({
  title: 'Assignment Deleted',
  message: 'OIDC claim assignment removed successfully',
  color: 'green',
  icon: <IconCheck size={16} />,
});
onRefresh?.();
  },
  onError: (error) => {
notifications.show({
  title: 'Delete Failed',
  message: formatSWRError(error),
  color: 'red',
  icon: <IconX size={16} />,
});
  },
},
  );

  // =============================================================================
  // Event Handlers
  // =============================================================================

  const handleCreateAssignment = useCallback(async () => {
if (
  !selectedContextId ||
  !currentAssignment.property_type ||
  !currentAssignment.name_id
) {
  return;
}

await createAssignment({
  context_id: selectedContextId,
  oidc_property: currentAssignment.property_type as OIDCPropertyType,
  name_id: currentAssignment.name_id,
  is_primary: true,
  visibility_level: currentAssignment.visibility_level,
  allowed_scopes: currentAssignment.allowed_scopes,
});
  }, [selectedContextId, currentAssignment, createAssignment]);

  // Note: handleUpdateAssignment is available for future use
  // const handleUpdateAssignment = useCallback(
  //   async (assignment: OIDCAssignment) => {
  // await updateAssignment({
  //   context_id: selectedContextId!,
  //   property_type: assignment.property_type,
  //   name_id: assignment.name_id,
  //   visibility_level: assignment.visibility_level,
  //   allowed_scopes: assignment.allowed_scopes as OIDCScope[],
  // });
  //   },
  //   [selectedContextId, updateAssignment],
  // );

  const handleDeleteAssignment = useCallback(
async (assignmentId: string) => {
  await deleteAssignment({ assignment_id: assignmentId });
},
[deleteAssignment],
  );

  const toggleAssignmentExpansion = useCallback((assignmentId: string) => {
setExpandedAssignments((prev) => {
  const newSet = new Set(prev);
  if (newSet.has(assignmentId)) {
newSet.delete(assignmentId);
  } else {
newSet.add(assignmentId);
  }
  return newSet;
});
  }, []);

  // =============================================================================
  // Effects
  // =============================================================================

  // Reset form when context changes
  useEffect(() => {
setCurrentAssignment({
  property_type: '',
  name_id: '',
  visibility_level: 'STANDARD',
  allowed_scopes: ['openid', 'profile'],
});
setExpandedAssignments(new Set());
  }, [selectedContextId]);

  // =============================================================================
  // Render
  // =============================================================================

  // Loading state
  if (namesLoading) {
return (
  <Stack gap='md'>
<Skeleton height={60} />
<Skeleton height={120} />
<Skeleton height={80} />
  </Stack>
);
  }

  // Error state
  if (namesError) {
return (
  <Alert
icon={<IconAlertTriangle size={16} />}
title='Loading Error'
color='red'
variant='light'
  >
{formatSWRError(namesError)}
  </Alert>
);
  }

  // No context selected
  if (!selectedContextId || !selectedContext) {
return (
  <Center py='xl'>
<Stack align='center' gap='sm'>
  <IconUser size={48} stroke={1} color='var(--mantine-color-dimmed)' />
  <Text c='dimmed' ta='center'>
Select a context to manage OIDC claim assignments
  </Text>
</Stack>
  </Center>
);
  }

  return (
<Stack gap='md'>
  {/* Header */}
  <Paper withBorder p='md'>
<Group justify='space-between'>
  <div>
<Title order={4}>OIDC Claim Assignments</Title>
<Text size='sm' c='dimmed'>
  Assign specific name variants to OIDC properties for context:{' '}
  <Text component='span' fw={500} c='blue'>
{selectedContext.context_name}
  </Text>
</Text>
  </div>
  <Group>
<Badge variant='light' color='blue'>
  {assignments.length} Claims
</Badge>
<ActionIcon
  variant='light'
  onClick={() => revalidateAssignments()}
  loading={assignmentsLoading}
>
  <IconReload size={16} />
</ActionIcon>
  </Group>
</Group>
  </Paper>

  {/* Create New Assignment Form */}
  {availableOIDCClaims.length > 0 ? (
<Paper withBorder p='md'>
  <Stack gap='sm'>
<Group justify='space-between'>
  <Title order={5}>Add OIDC Claim Assignment</Title>
  <Badge variant='outline' color='green'>
{availableOIDCClaims.length} Available Claims
  </Badge>
</Group>
<Text size='sm' c='dimmed'>
  Map your name variants to standard OIDC properties. Each context
  can have multiple property assignments with different visibility
  levels.
</Text>

<Group grow align='end'>
  <Select
label='OIDC Claim'
description='Choose the OpenID Connect property to assign'
placeholder='e.g., given_name, family_name'
value={currentAssignment.property_type}
onChange={(value) =>
  setCurrentAssignment((prev) => ({
...prev,
property_type: value as OIDCPropertyType,
  }))
}
data={availableOIDCClaims.map((claim) => ({
  value: claim,
  label: `${claim} - ${getClaimDescription(claim)}`,
}))}
leftSection={<IconKey size={16} />}
  />

  <Select
label='Name Value'
description='Select which name variant to use'
placeholder='Choose a name'
value={currentAssignment.name_id}
onChange={(value) =>
  setCurrentAssignment((prev) => ({
...prev,
name_id: value || '',
  }))
}
data={names.map((name) => ({
  value: name.id,
  label: name.name_text,
}))}
leftSection={<IconUser size={16} />}
disabled={!currentAssignment.property_type}
  />

  <Select
label='Visibility'
description='Control who can access this property'
value={currentAssignment.visibility_level}
onChange={(value) =>
  setCurrentAssignment((prev) => ({
...prev,
visibility_level: value as
  | 'STANDARD'
  | 'RESTRICTED'
  | 'PRIVATE',
  }))
}
data={[
  {
value: 'STANDARD',
label: 'Standard - Widely accessible',
  },
  {
value: 'RESTRICTED',
label: 'Restricted - Limited access',
  },
  {
value: 'PRIVATE',
label: 'Private - Minimal access',
  },
]}
leftSection={<IconEye size={16} />}
  />

  <Button
leftSection={<IconPlus size={16} />}
onClick={handleCreateAssignment}
loading={isCreating}
disabled={
  !currentAssignment.property_type || !currentAssignment.name_id
}
  >
Add
  </Button>
</Group>

<MultiSelect
  label='Allowed OAuth Scopes'
  description='Define which OAuth scopes can access this property'
  placeholder='Select required scopes'
  value={currentAssignment.allowed_scopes}
  onChange={(values) =>
setCurrentAssignment((prev) => ({
  ...prev,
  allowed_scopes: values as OIDCScope[],
}))
  }
  data={[
{ value: 'openid', label: 'openid - Core identity' },
{ value: 'profile', label: 'profile - Basic profile info' },
{ value: 'email', label: 'email - Email access' },
{ value: 'address', label: 'address - Address info' },
{ value: 'phone', label: 'phone - Phone number' },
  ]}
  hidePickedOptions
/>
  </Stack>
</Paper>
  ) : assignments.length > 0 ? (
<Paper withBorder p='md' bg='gray.0'>
  <Center py='md'>
<Stack align='center' gap='sm'>
  <IconCheck
size={48}
stroke={1}
color='var(--mantine-color-green-6)'
  />
  <Text fw={500} c='green'>
All Standard OIDC Claims Assigned
  </Text>
  <Text size='sm' c='dimmed' ta='center'>
This context has assignments for all available OIDC properties.
<br />
You can modify or remove existing assignments above.
  </Text>
</Stack>
  </Center>
</Paper>
  ) : null}

  {/* Current Assignments */}
  <Stack gap='xs'>
<Group justify='space-between'>
  <Title order={5}>Current Claim Assignments</Title>
  {assignments.length === 0 && (
<Text size='sm' c='dimmed'>
  No OIDC claims assigned to this context
</Text>
  )}
</Group>

{assignments.map((assignment) => (
  <Card key={assignment.assignment_id} withBorder>
<Stack gap='sm'>
  {/* Assignment Header */}
  <Group justify='space-between'>
<Group>
  <Badge color='blue' size='lg'>
{assignment.property_type}
  </Badge>
  <Text fw={500}>{assignment.name_text}</Text>
  <Badge
color={
  assignment.visibility_level === 'STANDARD'
? 'green'
: assignment.visibility_level === 'RESTRICTED'
  ? 'yellow'
  : 'red'
}
variant='light'
  >
{assignment.visibility_level}
  </Badge>
</Group>
<Group>
  <Tooltip label='Expand details'>
<ActionIcon
  variant='subtle'
  onClick={() =>
toggleAssignmentExpansion(assignment.assignment_id)
  }
>
  {expandedAssignments.has(assignment.assignment_id) ? (
<IconEyeOff size={16} />
  ) : (
<IconEye size={16} />
  )}
</ActionIcon>
  </Tooltip>
  <Tooltip label='Delete assignment'>
<ActionIcon
  color='red'
  variant='subtle'
  onClick={() =>
handleDeleteAssignment(assignment.assignment_id)
  }
  loading={isDeleting}
>
  <IconTrash size={16} />
</ActionIcon>
  </Tooltip>
</Group>
  </Group>

  {/* Expanded Details */}
  {expandedAssignments.has(assignment.assignment_id) && (
<>
  <Divider />
  <Stack gap='xs'>
<Group>
  <Text size='sm' fw={500}>
Allowed Scopes:
  </Text>
  <Group gap='xs'>
{assignment.allowed_scopes.map((scope) => (
  <Badge key={scope} size='sm' variant='outline'>
{scope}
  </Badge>
))}
  </Group>
</Group>
<Text size='xs' c='dimmed'>
  Created:{' '}
  {new Date(assignment.created_at).toLocaleString()}
</Text>
{assignment.updated_at !== assignment.created_at && (
  <Text size='xs' c='dimmed'>
Updated:{' '}
{new Date(assignment.updated_at).toLocaleString()}
  </Text>
)}
  </Stack>
</>
  )}
</Stack>
  </Card>
))}
  </Stack>

  {/* Assignment Loading State */}
  {assignmentsLoading && (
<Center py='md'>
  <Text size='sm' c='dimmed'>
Loading assignments...
  </Text>
</Center>
  )}

  {/* Assignment Error State */}
  {assignmentsError && (
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='Assignment Loading Error'
  color='red'
  variant='light'
>
  {formatSWRError(assignmentsError)}
</Alert>
  )}
</Stack>
  );
}
