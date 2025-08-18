'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Stack, Box, Text, Group, Button } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';
import {
  createMutationFetcher,
  formatSWRError,
} from '../../../utils/swr-fetcher';
import type {
  ContextWithStats,
  ContextFormData,
  UpdateContextRequest,
} from '../../../app/api/contexts/types';

interface EditContextModalProps {
  opened: boolean;
  onClose: () => void;
  context: ContextWithStats | null;
}

export default function EditContextModal({
  opened,
  onClose,
  context,
}: EditContextModalProps) {
  const [formData, setFormData] = useState<ContextFormData>({
context_name: '',
description: '',
  });
  const [errors, setErrors] = useState<Partial<ContextFormData>>({});

  // SWR mutation for updating context
  const { trigger, isMutating } = useSWRMutation(
context ? `/api/contexts/${context.id}` : null,
createMutationFetcher<ContextWithStats, UpdateContextRequest>('PUT'),
  );
  const { mutate } = useSWRConfig();

  // Update form data when context changes
  useEffect(() => {
if (context) {
  setFormData({
context_name: context.context_name,
description: context.description || '',
  });
  setErrors({});
}
  }, [context]);

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

if (!context || !validateForm()) {
  return;
}

try {
  // Trigger the mutation
  await trigger({
context_name: formData.context_name.trim(),
description: formData.description.trim() || null,
  });

  // Simple cache revalidation after success
  await mutate('/api/contexts');

  notifications.show({
title: 'Context Updated',
message: `Successfully updated context "${formData.context_name}"`,
color: 'green',
autoClose: 4000,
  });

  onClose();
} catch (error) {
  notifications.show({
title: 'Error Updating Context',
message: formatSWRError(error),
color: 'red',
autoClose: 5000,
  });
}
  };

  return (
<Modal
  opened={opened}
  onClose={onClose}
  title={
<Group gap='sm'>
  <IconEdit size={20} />
  <Text fw={600}>Edit Context</Text>
</Group>
  }
  size='lg'
>
  <form onSubmit={handleSubmit}>
<Stack gap='md'>
  <Box>
<Text size='sm' fw={500} mb='xs'>
  Context Name *
</Text>
<input
  type='text'
  placeholder="e.g., 'HR Systems', 'Client Portal'"
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
/>
{errors.description && (
  <Text size='xs' c='red' mt='xs'>
{errors.description}
  </Text>
)}
  </Box>

  <Group justify='flex-end' gap='md'>
<Button
  variant='light'
  color='gray'
  onClick={onClose}
  disabled={isMutating}
>
  Cancel
</Button>
<Button
  type='submit'
  color='blue'
  loading={isMutating}
  disabled={isMutating}
  leftSection={<IconEdit size={16} />}
>
  Update Context
</Button>
  </Group>
</Stack>
  </form>
</Modal>
  );
}
