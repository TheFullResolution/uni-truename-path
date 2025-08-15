'use client';

import React, { useState } from 'react';
import { Paper, Group, Title, Text, Box, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import {
  createMutationFetcher,
  formatSWRError,
} from '../../../lib/swr-fetcher';
import type { ContextFormData } from '../../../types/database';
import type {
  CreateContextResponseData,
  CreateContextRequest,
} from '../../../types/api-responses';
import { CACHE_KEYS } from '../../../lib/swr-keys';

interface ContextFormProps {
  onCancel?: () => void;
}

export default function ContextForm({ onCancel }: ContextFormProps) {
  const { mutate } = useSWRConfig();

  const [formData, setFormData] = useState<ContextFormData>({
context_name: '',
description: '',
  });
  const [errors, setErrors] = useState<Partial<ContextFormData>>({});

  // SWR mutation for context creation
  const { trigger, isMutating } = useSWRMutation(
CACHE_KEYS.CONTEXTS,
createMutationFetcher<CreateContextResponseData, CreateContextRequest>(
  'POST',
),
{
  onSuccess: () => {
// Revalidate contexts cache after creation
notifications.show({
  title: 'Context Created',
  message: `Successfully created context "${formData.context_name}"`,
  color: 'green',
  autoClose: 4000,
});
setFormData({ context_name: '', description: '' });
setErrors({});
mutate(CACHE_KEYS.ASSIGNMENTS);
  },
  onError: (error) => {
notifications.show({
  title: 'Error Creating Context',
  message: formatSWRError(error),
  color: 'red',
  autoClose: 5000,
});
  },
},
  );

  // Basic validation
  const validateForm = (): boolean => {
const newErrors: Partial<ContextFormData> = {};

if (!formData.context_name.trim()) {
  newErrors.context_name = 'Context name is required';
} else if (formData.context_name.length > 100) {
  newErrors.context_name = 'Context name cannot exceed 100 characters';
} else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.context_name)) {
  newErrors.context_name = 'Context name contains invalid characters';
}

if (formData.description.length > 500) {
  newErrors.description = 'Description cannot exceed 500 characters';
}

setErrors(newErrors);
return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
e.preventDefault();

if (!validateForm()) {
  return;
}

await trigger({
  context_name: formData.context_name.trim(),
  description: formData.description.trim() || null,
});
  };

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='lg'>
<IconPlus size={24} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Create New Context
</Title>
  </Group>

  <Text size='sm' c='gray.6' mb='xl'>
Add a custom context for specific applications or audiences
  </Text>

  <form onSubmit={handleSubmit}>
<Stack gap='md'>
  <Box>
<Text size='sm' fw={500} mb='xs'>
  Context Name *
</Text>
<input
  type='text'
  placeholder="e.g., 'HR Systems', 'Client Portal', 'Gaming Friends'"
  value={formData.context_name}
  onChange={(e) =>
setFormData((prev) => ({
  ...prev,
  context_name: e.target.value,
}))
  }
  style={{
width: '100%',
padding: '12px',
border: `1px solid ${errors.context_name ? '#e74c3c' : '#ced4da'}`,
borderRadius: '6px',
fontSize: '14px',
transition: 'border-color 0.2s ease',
  }}
  onFocus={(e) => {
e.target.style.borderColor = '#4A7FE7';
e.target.style.boxShadow = '0 0 0 2px rgba(74, 127, 231, 0.2)';
  }}
  onBlur={(e) => {
e.target.style.borderColor = errors.context_name
  ? '#e74c3c'
  : '#ced4da';
e.target.style.boxShadow = 'none';
  }}
/>
{errors.context_name && (
  <Text size='xs' c='red' mt='xs'>
{errors.context_name}
  </Text>
)}
  </Box>

  <Box>
<Text size='sm' fw={500} mb='xs'>
  Description
</Text>
<textarea
  placeholder='Brief description of when to use this context'
  value={formData.description}
  onChange={(e) =>
setFormData((prev) => ({
  ...prev,
  description: e.target.value,
}))
  }
  rows={3}
  style={{
width: '100%',
padding: '12px',
border: `1px solid ${errors.description ? '#e74c3c' : '#ced4da'}`,
borderRadius: '6px',
fontSize: '14px',
resize: 'vertical',
fontFamily: 'inherit',
transition: 'border-color 0.2s ease',
  }}
  onFocus={(e) => {
e.target.style.borderColor = '#4A7FE7';
e.target.style.boxShadow = '0 0 0 2px rgba(74, 127, 231, 0.2)';
  }}
  onBlur={(e) => {
e.target.style.borderColor = errors.description
  ? '#e74c3c'
  : '#ced4da';
e.target.style.boxShadow = 'none';
  }}
/>
{errors.description && (
  <Text size='xs' c='red' mt='xs'>
{errors.description}
  </Text>
)}
  </Box>

  <Group justify='flex-end' gap='md'>
{onCancel && (
  <Button
variant='light'
color='gray'
onClick={onCancel}
disabled={isMutating}
  >
Cancel
  </Button>
)}
<Button
  type='submit'
  color='green'
  loading={isMutating}
  disabled={isMutating}
  leftSection={<IconPlus size={16} />}
>
  Create Context
</Button>
  </Group>
</Stack>
  </form>
</Paper>
  );
}
