'use client';

import useSWRMutation from 'swr/mutation';
import {
  Stack,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Select,
  TextInput,
  Switch,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconUser,
  IconPlus,
  IconAlertTriangle,
  IconX,
  IconCheck,
} from '@tabler/icons-react';
import { z } from 'zod';
import {
  createMutationFetcher,
  formatSWRError,
} from '../../../utils/swr-fetcher';
import { CACHE_KEYS } from '../../../utils/swr-keys';
import type {
  CreateNameResponseData,
  CreateNameRequest,
} from '../../../app/api/names/types';

// Name type options - matches database enum values
const NAME_TYPE_OPTIONS = [
  { value: 'LEGAL', label: 'Legal Name' },
  { value: 'PREFERRED', label: 'Preferred Name' },
  { value: 'NICKNAME', label: 'Nickname' },
  { value: 'ALIAS', label: 'Alias' },
  { value: 'PROFESSIONAL', label: 'Professional Name' },
  { value: 'CULTURAL', label: 'Cultural Name' },
];

// Validation schema for name creation form
const nameCreationSchema = z.object({
  name_text: z
.string()
.min(1, { message: 'Name text is required' })
.max(100, { message: 'Name text cannot exceed 100 characters' }),
  name_type: z.enum(
['LEGAL', 'PREFERRED', 'NICKNAME', 'ALIAS', 'PROFESSIONAL', 'CULTURAL'],
{
  message: 'Name type is required',
},
  ),
  is_preferred: z.boolean(),
});

type NameCreationFormData = z.infer<typeof nameCreationSchema>;

interface NameCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function NameCreationForm({
  onSuccess,
  onCancel,
}: NameCreationFormProps) {
  // SWR mutation for name creation with explicit revalidation
  const {
trigger: createName,
isMutating: isCreating,
error: mutationError,
  } = useSWRMutation(
CACHE_KEYS.NAMES,
createMutationFetcher<CreateNameResponseData, CreateNameRequest>('POST'),
{
  onSuccess: () => {
notifications.show({
  title: 'Name Variant Created',
  message: `Successfully created name variant`,
  color: 'green',
  icon: <IconCheck size={16} />,
  autoClose: 4000,
});

onSuccess?.();
  },
  onError: (error) => {
notifications.show({
  title: 'Error Creating Name',
  message: formatSWRError(error),
  color: 'red',
  icon: <IconX size={16} />,
  autoClose: 5000,
});
  },
},
  );

  // Use Mantine form with custom Zod validation
  const form = useForm<NameCreationFormData>({
mode: 'uncontrolled',
initialValues: {
  name_text: '',
  name_type: 'PREFERRED' as const,
  is_preferred: false,
},
validate: {
  name_text: (value) => {
const result = z.string().min(1).max(100).safeParse(value);
if (!result.success) {
  return 'Name text is required and must be less than 100 characters';
}
return null;
  },
  name_type: (value) => {
const result = z
  .enum([
'LEGAL',
'PREFERRED',
'NICKNAME',
'ALIAS',
'PROFESSIONAL',
'CULTURAL',
  ])
  .safeParse(value);
return result.success ? null : 'Name type is required';
  },
},
  });

  // Handle form submission with SWR mutation
  const handleSubmit = async (values: NameCreationFormData) => {
// Additional validation with Zod schema
const validationResult = nameCreationSchema.safeParse(values);
if (!validationResult.success) {
  // Form validation failed
  const firstError = validationResult.error.issues[0];

  notifications.show({
title: 'Validation Error',
message: firstError?.message || 'Please check all required fields',
color: 'red',
icon: <IconX size={16} />,
autoClose: 4000,
  });
  return;
}

try {
  await createName({
name_text: values.name_text.trim(),
name_type: values.name_type,
is_preferred: values.is_preferred,
  });

  // Reset form on success - onSuccess callback handles notifications and cache revalidation
  form.reset();
} catch (error) {
  // Error handling is done via onError callback in useSWRMutation
  console.error('Name creation error:', error);
}
  };

  return (
<Paper p='xl' shadow='md' radius='lg' bg='blue.0'>
  <Group gap='sm' mb='lg'>
<IconPlus size={24} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Add Name Variant
</Title>
  </Group>

  <Text size='sm' c='gray.6' mb='xl'>
Create a new name variant to use in different contexts
  </Text>

  <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
<Stack gap='md'>
  {/* Error Alert */}
  {mutationError && (
<Alert
  variant='light'
  color='red'
  title='Creation Failed'
  icon={<IconX size={16} />}
  styles={{
root: {
  backgroundColor: 'rgba(231, 76, 60, 0.1)',
  border: '1px solid rgba(231, 76, 60, 0.3)',
},
  }}
>
  <Text size='sm'>{formatSWRError(mutationError)}</Text>
</Alert>
  )}

  {/* Name Text Input */}
  <TextInput
label='Name Text'
placeholder='e.g., John Smith, Johnny, J.S.'
required
disabled={isCreating}
leftSection={<IconUser size={16} />}
data-testid='name-text-input'
{...form.getInputProps('name_text')}
styles={(theme) => ({
  label: {
fontWeight: 500,
marginBottom: theme.spacing.xs,
color: theme.colors.gray[8],
  },
  input: {
'&:focus': {
  borderColor: theme.colors.blue[5],
  boxShadow: `0 0 0 2px rgba(52, 152, 219, 0.2)`,
},
  },
})}
aria-describedby={
  form.errors.name_text ? 'name-text-error' : undefined
}
  />

  {/* Name Type Select */}
  <Select
label='Name Type'
placeholder='Choose the type of name'
required
disabled={isCreating}
data={NAME_TYPE_OPTIONS}
data-testid='name-type-select'
{...form.getInputProps('name_type')}
styles={(theme) => ({
  label: {
fontWeight: 500,
marginBottom: theme.spacing.xs,
color: theme.colors.gray[8],
  },
  input: {
'&:focus': {
  borderColor: theme.colors.blue[5],
  boxShadow: `0 0 0 2px rgba(52, 152, 219, 0.2)`,
},
  },
})}
aria-describedby={
  form.errors.name_type ? 'name-type-error' : undefined
}
  />

  {/* Preferred Name Switch */}
  <Switch
label='Set as preferred name'
description='This will be your default name when no specific assignment exists'
disabled={isCreating}
data-testid='preferred-name-switch'
{...form.getInputProps('is_preferred', { type: 'checkbox' })}
styles={(theme) => ({
  label: {
fontWeight: 500,
color: theme.colors.gray[8],
  },
  description: {
color: theme.colors.gray[6],
  },
})}
  />

  {/* Preferred Name Warning */}
  {form.values.is_preferred && (
<Alert
  icon={<IconAlertTriangle size={16} />}
  title='Setting as Preferred Name'
  color='blue'
  styles={{
root: {
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  border: '1px solid rgba(52, 152, 219, 0.3)',
},
  }}
>
  <Text size='sm'>
Setting this as your preferred name will unset any other
preferred names you have. Your preferred name is used when no
specific assignment exists for a context.
  </Text>
</Alert>
  )}

  {/* Action Buttons */}
  <Group justify='flex-end' gap='md' pt='md'>
{onCancel && (
  <Button
variant='light'
color='gray'
onClick={onCancel}
disabled={isCreating}
styles={{
  root: {
'&:hover': {
  backgroundColor: '#f8f9fa',
},
  },
}}
  >
Cancel
  </Button>
)}
<Button
  type='submit'
  color='green'
  loading={isCreating}
  disabled={isCreating}
  leftSection={<IconPlus size={16} />}
  data-testid='create-name-button'
  styles={{
root: {
  'backgroundColor': '#27ae60',
  '&:hover': {
backgroundColor: '#2ecc71',
  },
  '&:disabled': {
backgroundColor: '#95a5a6',
opacity: 0.7,
  },
},
  }}
>
  {isCreating ? 'Creating...' : 'Create Name Variant'}
</Button>
  </Group>
</Stack>
  </form>
</Paper>
  );
}
