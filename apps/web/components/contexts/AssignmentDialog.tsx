'use client';

import {
  Stack,
  Table,
  Text,
  Select,
  Button,
  Group,
  Alert,
  Loader,
  Center,
  Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import useSWR from 'swr';

// Import utilities and types
import { swrFetcher, formatSWRError } from '@/utils/swr-fetcher';
import { CACHE_KEYS } from '@/utils/swr-keys';
import type { Enums, Tables } from '@/generated/database';
import type { OIDCAssignmentWithDetails } from '@/app/api/assignments/types';
import {
  detectAssignmentChanges,
  buildBatchRequest,
  hasActualChanges,
} from '@/utils/assignments';
import {
  NOTIFICATION_ERROR_TIMEOUT,
  NOTIFICATION_NETWORK_ERROR_TIMEOUT,
} from '@/utils/constants/timeouts';
import { useBatchAssignments } from '@/utils/swr/assignments-batch';
import {
  AssignmentRequiredField,
  getAssignmentFieldTooltip,
} from './AssignmentRequiredField';
import {
  getAssignmentValidationErrors,
  isAssignmentFormValid,
  type AssignmentContext,
} from '@/utils/validation/assignments';
import type { UserContext } from '@/types/database';

interface AssignmentDialogProps {
  contextId: string;
  contextName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

// OIDC property labels for display
const OIDC_PROPERTY_LABELS: Record<Enums<'oidc_property'>, string> = {
  given_name: 'Given Name',
  family_name: 'Family Name',
  name: 'Name',
  nickname: 'Nickname',
  display_name: 'Display Name',
  preferred_username: 'Preferred Username',
  middle_name: 'Middle Name',
} as const;

// OIDC property descriptions for enhanced user experience
const OIDC_PROPERTY_DESCRIPTIONS: Record<Enums<'oidc_property'>, string> = {
  given_name: 'Your first/given name (e.g., John)',
  family_name: 'Your last/family name (e.g., Smith)',
  name: 'Your full display name (e.g., John Smith)',
  nickname: 'Casual name used by friends (e.g., Johnny)',
  display_name: 'How your name appears in the UI',
  preferred_username: 'Your preferred username/handle',
  middle_name: 'Your middle name or initial',
} as const;

// All OIDC properties in order
// Sourced from database enum for type safety
const OIDC_PROPERTIES: readonly Enums<'oidc_property'>[] = [
  'given_name',
  'family_name',
  'name',
  'nickname',
  'display_name',
  'preferred_username',
  'middle_name',
] as const;

// Required properties for default context
// Sourced from database enum for type safety
const REQUIRED_OIDC_PROPERTIES: readonly Enums<'oidc_property'>[] = [
  'given_name',
  'family_name',
  'name',
] as const;

interface FormValues {
  [key: string]: string; // oidc_property -> name_id (empty string = None)
}

interface NamesResponse {
  names: Tables<'names'>[];
}

interface OIDCAssignmentsResponse {
  assignments: OIDCAssignmentWithDetails[];
  context_name: string;
  is_permanent: boolean | null;
}

export function AssignmentDialog({
  contextId,
  onClose,
  onSuccess,
}: AssignmentDialogProps) {
  // Initialize form with dynamic validation
  const form = useForm<FormValues>({
mode: 'controlled',
initialValues: {},
validateInputOnBlur: true,
validateInputOnChange: true,
validate: (values) => {
  if (!assignmentContext) return {};

  const validationResult = getAssignmentValidationErrors(
values,
assignmentContext,
  );
  return validationResult.errors;
},
  });

  // Fetch available names
  const {
data: namesData,
error: namesError,
isLoading: namesLoading,
  } = useSWR<NamesResponse>(CACHE_KEYS.NAMES, swrFetcher<NamesResponse>);

  // Fetch current assignments for this context
  const {
data: assignmentsData,
error: assignmentsError,
isLoading: assignmentsLoading,
  } = useSWR<OIDCAssignmentsResponse>(
contextId ? `/api/assignments/oidc?context_id=${contextId}` : null,
swrFetcher<OIDCAssignmentsResponse>,
  );

  // Batch assignment operations
  const { updateAssignmentsBatch, isSaving } = useBatchAssignments(contextId);

  const assignmentContext: AssignmentContext | null = assignmentsData
? {
context: {
  id: contextId,
  user_id: '', // Not needed for validation
  context_name: assignmentsData.context_name,
  is_permanent: assignmentsData.is_permanent,
} as UserContext, // Type assertion to match expected interface
isDefaultContext: assignmentsData.is_permanent === true,
requiredProperties:
  assignmentsData.is_permanent === true ? REQUIRED_OIDC_PROPERTIES : [],
  }
: null;

  // Initialize form values when assignments load
  useEffect(() => {
if (assignmentsData?.assignments) {
  const initialValues: FormValues = {};
  assignmentsData.assignments.forEach((assignment) => {
initialValues[assignment.oidc_property] = assignment.name_id;
  });
  form.setValues(initialValues);
  form.resetDirty();
}
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentsData?.assignments]);

  const handlePropertyChange = (
property: Enums<'oidc_property'>,
nameId: string | null,
  ) => {
form.setFieldValue(property, nameId || '');
// Clear field error when value changes
if (form.errors[property]) {
  form.clearFieldError(property);
}
  };

  const isRequiredProperty = (property: Enums<'oidc_property'>) => {
const isDefaultContext = assignmentsData?.is_permanent === true;
return isDefaultContext && REQUIRED_OIDC_PROPERTIES.includes(property);
  };

  const handleSave = async () => {
if (!form.isDirty()) {
  // Show notification for no changes case
  notifications.show({
title: 'No Changes',
message: 'No changes to save',
color: 'blue',
icon: <IconCheck size={18} />,
autoClose: 3000,
  });
  return;
}

// Validate all assignments using centralized validation utilities
if (assignmentContext) {
  const validationResult = getAssignmentValidationErrors(
form.values,
assignmentContext,
  );

  if (!validationResult.valid) {
form.setErrors(validationResult.errors);
// Show validation error notification
notifications.show({
  title: 'Validation Error',
  message: 'Please fix the errors below before saving',
  color: 'yellow',
  icon: <IconAlertTriangle size={18} />,
  autoClose: 5000,
});
return;
  }
}

try {
  // Detect actual changes using utilities
  const changes = detectAssignmentChanges(
assignmentsData?.assignments || [],
form.values,
  );

  const batchRequest = buildBatchRequest(contextId, changes);

  // Skip if no actual changes
  if (!hasActualChanges(batchRequest)) {
form.resetDirty();
notifications.show({
  title: 'No Changes',
  message: 'No changes detected to save',
  color: 'blue',
  icon: <IconCheck size={18} />,
  autoClose: 3000,
});
return;
  }

  // Enhanced batch API call with custom notifications
  await updateAssignmentsBatch(batchRequest, {
// Disable built-in notifications so we can provide enhanced ones
showSuccessNotification: false,
showErrorNotification: false,
// Success callback with enhanced notification
onSuccess: (response) => {
  const { summary } = response;
  const totalChanges =
summary.created + summary.updated + summary.deleted;

  // Build detailed success message
  const changeDetails = [];
  if (summary.created > 0)
changeDetails.push(`${summary.created} created`);
  if (summary.updated > 0)
changeDetails.push(`${summary.updated} updated`);
  if (summary.deleted > 0)
changeDetails.push(`${summary.deleted} deleted`);

  const detailsText =
changeDetails.length > 0 ? ` (${changeDetails.join(', ')})` : '';

  notifications.show({
title: 'Assignments Updated',
message: `Successfully updated ${totalChanges} assignment${totalChanges !== 1 ? 's' : ''}${detailsText}`,
color: 'green',
icon: <IconCheck size={18} />,
autoClose: 5000,
  });

  // Reset form after successful save
  form.resetDirty();
  // Trigger parent revalidation to update completeness status
  onSuccess?.();
  onClose(); // Auto-close dialog after successful save
},
// Enhanced error handling
onError: (error) => {
  console.error('Error saving assignments:', error);

  const errorMessage = formatSWRError(error);
  const isConstraintViolation =
errorMessage.toLowerCase().includes('constraint') ||
errorMessage.toLowerCase().includes('foreign key') ||
errorMessage.toLowerCase().includes('invalid reference');
  const isNetworkError =
errorMessage.toLowerCase().includes('network') ||
errorMessage.toLowerCase().includes('connection') ||
errorMessage.toLowerCase().includes('timeout');

  let title = 'Save Failed';
  let enhancedMessage = errorMessage;
  let autoClose = NOTIFICATION_ERROR_TIMEOUT;

  if (isConstraintViolation) {
title = 'Invalid Assignment';
enhancedMessage =
  'Some names or contexts may no longer exist. Please refresh the page and try again.';
  } else if (isNetworkError) {
title = 'Connection Error';
enhancedMessage =
  'Unable to save changes due to network issues. Please check your connection and try again.';
autoClose = NOTIFICATION_NETWORK_ERROR_TIMEOUT;
  }

  notifications.show({
title,
message: enhancedMessage,
color: 'red',
icon: <IconX size={18} />,
autoClose,
  });
},
  });
} catch (error) {
  // Fallback error handling (should not be reached with onError callback)
  console.error('Unexpected error saving assignments:', error);
  const errorMessage = formatSWRError(error);

  notifications.show({
title: 'Unexpected Error',
message:
  errorMessage ||
  'An unexpected error occurred while saving assignments',
color: 'red',
icon: <IconX size={18} />,
autoClose: NOTIFICATION_NETWORK_ERROR_TIMEOUT,
  });
}
  };

  const handleCancel = () => {
form.reset();
onClose();
  };

  // Loading state with better skeleton
  if (namesLoading || assignmentsLoading) {
return (
  <Stack gap='md'>
<Text size='sm' c='dimmed'>
  Assign name variants to OIDC properties for this context. Required
  properties for the default context cannot be unassigned.
</Text>

<Center p='md'>
  <Stack align='center' gap='sm'>
<Loader size='md' />
<Text size='sm' c='dimmed'>
  Loading assignments...
</Text>
  </Stack>
</Center>

<Group justify='flex-end' mt='md'>
  <Button variant='light' disabled>
Cancel
  </Button>
  <Button disabled leftSection={<IconCheck size={16} />}>
Save Changes
  </Button>
</Group>
  </Stack>
);
  }

  // Error state
  if (namesError || assignmentsError) {
return (
  <Alert
icon={<IconAlertTriangle size={16} />}
title='Loading Error'
color='red'
variant='light'
  >
<Text size='sm'>{formatSWRError(namesError || assignmentsError)}</Text>
  </Alert>
);
  }

  // Additional safety check to prevent race conditions
  if (!namesData || !assignmentsData) {
return (
  <Stack gap='md'>
<Text size='sm' c='dimmed'>
  Assign name variants to OIDC properties for this context. Required
  properties for the default context cannot be unassigned.
</Text>

<Center p='md'>
  <Stack align='center' gap='sm'>
<Loader size='md' />
<Text size='sm' c='dimmed'>
  Loading assignments...
</Text>
  </Stack>
</Center>
  </Stack>
);
  }

  const names = namesData?.names || [];

  const nameOptions =
names.length > 0
  ? [
  { value: '', label: 'None' },
  ...names.map((name) => ({
value: name.id,
label: name.name_text,
  })),
]
  : [{ value: '', label: 'None' }];

  // Calculate assignment summary
  const assignedPropertiesCount = OIDC_PROPERTIES.filter(
(property) => form.values[property] && form.values[property] !== '',
  ).length;
  const totalPropertiesCount = OIDC_PROPERTIES.length;

  return (
<Stack gap='md'>
  <Text size='sm' c='dimmed'>
Assign name variants to OIDC properties for this context. Required
properties for the default context cannot be unassigned.
  </Text>

  {/* Assignment Summary */}
  <Group
justify='space-between'
align='center'
p='sm'
bg='gray.0'
style={{ borderRadius: '4px' }}
  >
<Text size='sm' fw={500}>
  Assignment Summary
</Text>
<Badge
  size='lg'
  variant='light'
  color={
assignedPropertiesCount === totalPropertiesCount ? 'green' : 'blue'
  }
>
  {assignedPropertiesCount} of {totalPropertiesCount} properties
  assigned
</Badge>
  </Group>

  <Table>
<Table.Thead>
  <Table.Tr>
<Table.Th>OIDC Property</Table.Th>
<Table.Th>Assigned Name</Table.Th>
  </Table.Tr>
</Table.Thead>
<Table.Tbody>
  {OIDC_PROPERTIES.map((property) => {
const isRequired = isRequiredProperty(property);
const currentValue = form.values[property] || '';
const isAssigned = currentValue !== '';
const fieldError = form.errors[property];

return (
  <Table.Tr
key={property}
style={{
  backgroundColor: isAssigned
? 'var(--mantine-color-green-0)'
: undefined,
  borderLeft: `3px solid ${isAssigned ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-gray-3)'}`,
}}
  >
<Table.Td>
  <AssignmentRequiredField
required={isRequired}
label={OIDC_PROPERTY_LABELS[property]}
description={OIDC_PROPERTY_DESCRIPTIONS[property]}
tooltip={getAssignmentFieldTooltip(property, isRequired)}
  >
{isRequired && (
  <Badge size='xs' color='red' variant='light'>
Required
  </Badge>
)}
  </AssignmentRequiredField>
</Table.Td>
<Table.Td>
  <Select
value={currentValue}
onChange={(value) => handlePropertyChange(property, value)}
data={
  isRequired
? (nameOptions || []).filter((opt) => opt.value !== '')
: nameOptions || []
}
placeholder='Select a name'
size='sm'
disabled={isSaving}
error={fieldError}
  />
</Table.Td>
  </Table.Tr>
);
  })}
</Table.Tbody>
  </Table>

  <Group justify='flex-end' mt='md'>
<Button variant='light' onClick={handleCancel} disabled={isSaving}>
  Cancel
</Button>
<Button
  onClick={handleSave}
  disabled={
!form.isDirty() ||
isSaving ||
(assignmentContext &&
  !isAssignmentFormValid(form.values, assignmentContext)) ||
false
  }
  loading={isSaving}
  leftSection={<IconCheck size={16} />}
>
  Save Changes
</Button>
  </Group>
</Stack>
  );
}
