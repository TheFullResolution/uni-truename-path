'use client';

import { Button, Group, Paper, Stack, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPlus } from '@tabler/icons-react';
import { z } from 'zod';

// Form data type - only name_text required
type CreateNameFormData = {
  name_text: string;
};

interface AddNameFormProps {
  isVisible: boolean;
  isCreating: boolean;
  onSubmit: (values: CreateNameFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Isolated Add Name Form Component
 * Completely isolated from parent re-renders to prevent form state loss
 * during SWR data updates or other parent component state changes
 */
export function AddNameForm({
  isVisible,
  isCreating,
  onSubmit,
  onCancel,
}: AddNameFormProps) {
  // Form state is isolated within this component
  const form = useForm<CreateNameFormData>({
initialValues: {
  name_text: '',
},
validate: {
  name_text: (value) => {
const result = z.string().trim().min(1).max(100).safeParse(value);
return result.success ? null : 'Name text is required';
  },
},
  });

  const handleSubmit = async (values: CreateNameFormData) => {
await onSubmit(values);
form.reset(); // Reset form after successful submission
  };

  const handleCancel = () => {
form.reset(); // Reset form when canceling
onCancel();
  };

  if (!isVisible) {
return null;
  }

  return (
<Paper p='md' withBorder>
  <Title order={3} mb='md'>
Add Name Variant
  </Title>
  <form onSubmit={form.onSubmit(handleSubmit)}>
<Stack gap='md'>
  <TextInput
label='Name Text'
placeholder='Enter the name'
required
data-testid='name-text-input'
{...form.getInputProps('name_text')}
  />

  <Group justify='flex-end'>
<Button
  type='button'
  variant='light'
  onClick={handleCancel}
  disabled={isCreating}
>
  Cancel
</Button>
<Button
  type='submit'
  loading={isCreating}
  leftSection={<IconPlus />}
  data-testid='add-name-button'
>
  Add Name
</Button>
  </Group>
</Stack>
  </form>
</Paper>
  );
}
