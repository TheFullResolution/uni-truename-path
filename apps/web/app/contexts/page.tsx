'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Box,
  Button,
  Group,
  Stack,
  Tabs,
  Grid,
  Modal,
  Skeleton,
  Center,
  Alert,
  Badge,
  Card,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconLogout,
  IconPlus,
  IconSettings,
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconTags,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useAuth } from '../../lib/context/AuthProvider';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { Logo } from '../../components/branding';

// Context data types
interface Context {
  id: string;
  context_name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  name_assignments_count: number;
  has_active_consents: boolean;
}

// Context form data type
interface ContextFormData {
  contextName: string;
  description: string;
}

// ContextForm Component
function ContextForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContextFormData>({
contextName: '',
description: '',
  });
  const [errors, setErrors] = useState<Partial<ContextFormData>>({});

  // Basic validation
  const validateForm = (): boolean => {
const newErrors: Partial<ContextFormData> = {};

if (!formData.contextName.trim()) {
  newErrors.contextName = 'Context name is required';
} else if (formData.contextName.length > 100) {
  newErrors.contextName = 'Context name cannot exceed 100 characters';
} else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.contextName)) {
  newErrors.contextName = 'Context name contains invalid characters';
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

setLoading(true);
try {
  const response = await fetch('/api/contexts', {
method: 'POST',
headers: {
  'Content-Type': 'application/json',
},
body: JSON.stringify({
  contextName: formData.contextName.trim(),
  description: formData.description.trim() || null,
}),
  });

  const result = await response.json();

  if (result.success) {
notifications.show({
  title: 'Context Created',
  message: `Successfully created context "${formData.contextName}"`,
  color: 'green',
  autoClose: 4000,
});

// Reset form
setFormData({ contextName: '', description: '' });
setErrors({});
onSuccess();
  } else {
throw new Error(result.message || 'Failed to create context');
  }
} catch (error) {
  console.error('Context creation error:', error);
  notifications.show({
title: 'Error Creating Context',
message:
  error instanceof Error
? error.message
: 'An unexpected error occurred',
color: 'red',
autoClose: 5000,
  });
} finally {
  setLoading(false);
}
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
  value={formData.contextName}
  onChange={(e) =>
setFormData((prev) => ({
  ...prev,
  contextName: e.target.value,
}))
  }
  style={{
width: '100%',
padding: '12px',
border: `1px solid ${errors.contextName ? '#e74c3c' : '#ced4da'}`,
borderRadius: '6px',
fontSize: '14px',
transition: 'border-color 0.2s ease',
  }}
  onFocus={(e) => {
e.target.style.borderColor = '#4A7FE7';
e.target.style.boxShadow = '0 0 0 2px rgba(74, 127, 231, 0.2)';
  }}
  onBlur={(e) => {
e.target.style.borderColor = errors.contextName
  ? '#e74c3c'
  : '#ced4da';
e.target.style.boxShadow = 'none';
  }}
/>
{errors.contextName && (
  <Text size='xs' c='red' mt='xs'>
{errors.contextName}
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
disabled={loading}
  >
Cancel
  </Button>
)}
<Button
  type='submit'
  color='green'
  loading={loading}
  disabled={loading}
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

// ContextList Component
function ContextList({
  contexts,
  loading,
  onEdit,
  onDelete,
  onRefresh,
}: {
  contexts: Context[];
  loading: boolean;
  onEdit: (context: Context) => void;
  onDelete: (context: Context) => void;
  onRefresh: () => void;
}) {
  if (loading) {
return (
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='lg'>
  <IconTags size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Your Contexts
  </Title>
</Group>
<Stack gap='md'>
  <Skeleton height={60} />
  <Skeleton height={60} />
  <Skeleton height={60} />
</Stack>
  </Paper>
);
  }

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group justify='space-between' mb='lg'>
<Group gap='sm'>
  <IconTags size={24} color='#4A7FE7' />
  <Title order={3} c='gray.8'>
Your Contexts
  </Title>
  <Badge variant='light' color='blue' size='sm'>
{contexts.length} total
  </Badge>
</Group>
<Button
  variant='light'
  color='brand'
  size='sm'
  onClick={onRefresh}
  leftSection={<IconSettings size={16} />}
>
  Refresh
</Button>
  </Group>

  {contexts.length === 0 ? (
<Center py='xl'>
  <Stack align='center' gap='md'>
<IconTags size={48} color='#ced4da' />
<Text size='lg' c='gray.6'>
  No contexts created yet
</Text>
<Text size='sm' c='gray.5' ta='center'>
  Create your first context to start organizing your name variants
</Text>
  </Stack>
</Center>
  ) : (
<Stack gap='md'>
  {contexts.map((context) => (
<Card key={context.id} p='md' withBorder radius='md' bg='gray.0'>
  <Group justify='space-between' align='flex-start'>
<Box flex={1}>
  <Group gap='sm' mb='xs'>
<Text fw={600} size='lg' c='gray.8'>
  {context.context_name}
</Text>
<Badge
  variant='light'
  color={
context.name_assignments_count > 0 ? 'blue' : 'gray'
  }
  size='sm'
>
  {context.name_assignments_count} names assigned
</Badge>
{context.has_active_consents && (
  <Badge variant='light' color='green' size='sm'>
Active consents
  </Badge>
)}
  </Group>

  {context.description && (
<Text size='sm' c='gray.6' mb='xs'>
  {context.description}
</Text>
  )}

  <Group gap='xs'>
<Text size='xs' c='gray.5'>
  Created:{' '}
  {new Date(context.created_at).toLocaleDateString()}
</Text>
{context.updated_at && (
  <Text size='xs' c='gray.5'>
Updated:{' '}
{new Date(context.updated_at).toLocaleDateString()}
  </Text>
)}
  </Group>
</Box>

<Group gap='xs'>
  <ActionIcon
variant='light'
color='blue'
size='sm'
onClick={() => onEdit(context)}
data-testid='edit-context-button'
aria-label='Edit context'
  >
<IconEdit size={16} />
  </ActionIcon>
  <ActionIcon
variant='light'
color='red'
size='sm'
onClick={() => onDelete(context)}
data-testid='delete-context-button'
aria-label='Delete context'
  >
<IconTrash size={16} />
  </ActionIcon>
</Group>
  </Group>
</Card>
  ))}
</Stack>
  )}
</Paper>
  );
}

// EditContextModal Component
function EditContextModal({
  opened,
  onClose,
  context,
  onSuccess,
}: {
  opened: boolean;
  onClose: () => void;
  context: Context | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContextFormData>({
contextName: '',
description: '',
  });
  const [errors, setErrors] = useState<Partial<ContextFormData>>({});

  // Update form data when context changes
  useEffect(() => {
if (context) {
  setFormData({
contextName: context.context_name,
description: context.description || '',
  });
  setErrors({});
}
  }, [context]);

  const validateForm = (): boolean => {
const newErrors: Partial<ContextFormData> = {};

if (!formData.contextName.trim()) {
  newErrors.contextName = 'Context name is required';
} else if (formData.contextName.length > 100) {
  newErrors.contextName = 'Context name cannot exceed 100 characters';
} else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.contextName)) {
  newErrors.contextName = 'Context name contains invalid characters';
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

setLoading(true);
try {
  const response = await fetch(`/api/contexts/${context.id}`, {
method: 'PUT',
headers: {
  'Content-Type': 'application/json',
},
body: JSON.stringify({
  contextName: formData.contextName.trim(),
  description: formData.description.trim() || null,
}),
  });

  const result = await response.json();

  if (result.success) {
notifications.show({
  title: 'Context Updated',
  message: `Successfully updated context "${formData.contextName}"`,
  color: 'green',
  autoClose: 4000,
});

onSuccess();
onClose();
  } else {
throw new Error(result.message || 'Failed to update context');
  }
} catch (error) {
  console.error('Context update error:', error);
  notifications.show({
title: 'Error Updating Context',
message:
  error instanceof Error
? error.message
: 'An unexpected error occurred',
color: 'red',
autoClose: 5000,
  });
} finally {
  setLoading(false);
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
  value={formData.contextName}
  onChange={(e) =>
setFormData((prev) => ({
  ...prev,
  contextName: e.target.value,
}))
  }
  style={{
width: '100%',
padding: '12px',
border: `1px solid ${errors.contextName ? '#e74c3c' : '#ced4da'}`,
borderRadius: '6px',
fontSize: '14px',
transition: 'border-color 0.2s ease',
  }}
/>
{errors.contextName && (
  <Text size='xs' c='red' mt='xs'>
{errors.contextName}
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
  disabled={loading}
>
  Cancel
</Button>
<Button
  type='submit'
  color='blue'
  loading={loading}
  disabled={loading}
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

// DeleteContextModal Component
function DeleteContextModal({
  opened,
  onClose,
  context,
  onSuccess,
}: {
  opened: boolean;
  onClose: () => void;
  context: Context | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);

  const handleDelete = async (force: boolean = false) => {
if (!context) return;

setLoading(true);
try {
  const url = force
? `/api/contexts/${context.id}?force=true`
: `/api/contexts/${context.id}`;

  const response = await fetch(url, {
method: 'DELETE',
headers: {
  'Content-Type': 'application/json',
},
  });

  const result = await response.json();

  if (result.success) {
notifications.show({
  title: 'Context Deleted',
  message: `Successfully deleted context "${context.context_name}"`,
  color: 'green',
  autoClose: 4000,
});

onSuccess();
onClose();
setForceDelete(false);
  } else {
// Check if this is a safeguards warning
if (result.data?.safeguards && !force) {
  setForceDelete(true);
  return;
}

throw new Error(result.message || 'Failed to delete context');
  }
} catch (error) {
  console.error('Context deletion error:', error);
  notifications.show({
title: 'Error Deleting Context',
message:
  error instanceof Error
? error.message
: 'An unexpected error occurred',
color: 'red',
autoClose: 5000,
  });
} finally {
  setLoading(false);
}
  };

  const hasAssignments = context && context.name_assignments_count > 0;
  const hasConsents = context && context.has_active_consents;

  return (
<Modal
  opened={opened}
  onClose={() => {
onClose();
setForceDelete(false);
  }}
  title={
<Group gap='sm'>
  <IconTrash size={20} color='#e74c3c' />
  <Text fw={600}>Delete Context</Text>
</Group>
  }
  size='lg'
>
  <Stack gap='md'>
<Text>
  Are you sure you want to delete the context{' '}
  <strong>&quot;{context?.context_name}&quot;</strong>?
</Text>

{(hasAssignments || hasConsents) && (
  <Alert
icon={<IconAlertTriangle size={16} />}
title='Warning: This action will affect existing data'
color='yellow'
  >
<Stack gap='xs'>
  {hasAssignments && (
<Text size='sm'>
  • {context.name_assignments_count} name assignment(s) will be
  removed
</Text>
  )}
  {hasConsents && (
<Text size='sm'>
  • Active consents for this context will be revoked
</Text>
  )}
</Stack>
  </Alert>
)}

{forceDelete && (
  <Alert
icon={<IconAlertTriangle size={16} />}
title='Confirm Force Deletion'
color='red'
  >
<Text size='sm'>
  This context has dependencies. Proceeding will remove all
  associated data permanently.
</Text>
  </Alert>
)}

<Group justify='flex-end' gap='md'>
  <Button
variant='light'
color='gray'
onClick={() => {
  onClose();
  setForceDelete(false);
}}
disabled={loading}
  >
Cancel
  </Button>
  <Button
color='red'
loading={loading}
disabled={loading}
leftSection={<IconTrash size={16} />}
onClick={() => handleDelete(forceDelete)}
  >
{forceDelete ? 'Force Delete' : 'Delete Context'}
  </Button>
</Group>
  </Stack>
</Modal>
  );
}

// Main ContextsContent Component
function ContextsContent() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('contexts');
  const [contexts, setContexts] = useState<Context[]>([]);
  const [contextsLoading, setContextsLoading] = useState(true);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);

  // Modal states
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
useDisclosure(false);
  const [
deleteModalOpened,
{ open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  // Fetch contexts
  const fetchContexts = useCallback(async () => {
if (!user?.profile?.id) return;

try {
  const response = await fetch('/api/contexts', {
method: 'GET',
headers: {
  'Content-Type': 'application/json',
},
  });

  if (response.ok) {
const result = await response.json();
if (result.success) {
  setContexts(result.data.contexts);
} else {
  throw new Error(result.message || 'Failed to fetch contexts');
}
  } else {
throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
} catch (error) {
  console.error('Error fetching contexts:', error);
  notifications.show({
title: 'Error Loading Contexts',
message:
  error instanceof Error ? error.message : 'Failed to load contexts',
color: 'red',
autoClose: 5000,
  });
} finally {
  setContextsLoading(false);
}
  }, [user?.profile?.id]);

  // Load contexts on mount
  useEffect(() => {
if (user?.profile?.id) {
  fetchContexts();
}
  }, [user?.profile?.id, fetchContexts]);

  // Handle logout
  const handleLogout = useCallback(async () => {
try {
  const result = await logout();

  if (!result.error) {
notifications.show({
  title: 'Signed out successfully',
  message: 'You have been signed out of TrueNamePath',
  color: 'blue',
  autoClose: 3000,
});

router.replace('/auth/login');
  } else {
notifications.show({
  title: 'Logout failed',
  message: result.error,
  color: 'red',
  autoClose: 5000,
});
  }
} catch (error) {
  notifications.show({
title: 'Logout error',
message:
  error instanceof Error
? error.message
: 'An unexpected error occurred during logout',
color: 'red',
autoClose: 5000,
  });
}
  }, [logout, router]);

  // Handle edit context
  const handleEditContext = (context: Context) => {
setSelectedContext(context);
openEditModal();
  };

  // Handle delete context
  const handleDeleteContext = (context: Context) => {
setSelectedContext(context);
openDeleteModal();
  };

  // Handle successful operations
  const handleOperationSuccess = () => {
fetchContexts();
  };

  return (
<Box
  style={{
minHeight: '100vh',
background:
  'linear-gradient(135deg, rgba(74, 127, 231, 0.05) 0%, rgba(195, 217, 247, 0.1) 100%)',
  }}
>
  <Container size='xl' py='md'>
{/* Header */}
<Paper p='xl' mb='xl' shadow='lg' radius='lg'>
  <Group justify='space-between' align='center'>
<Group>
  <Logo size='lg' />
  <Box>
<Title order={1} size='h2' c='brand.8'>
  Context Management
</Title>
<Text size='sm' c='gray.6'>
  Manage your custom contexts and name assignments
</Text>
  </Box>
</Group>
<Group>
  <Button
variant='light'
color='brand'
leftSection={<IconArrowLeft size={16} />}
onClick={() => router.push('/dashboard')}
  >
Back to Dashboard
  </Button>
  <Button
leftSection={<IconLogout size={16} />}
variant='light'
color='red'
onClick={handleLogout}
loading={authLoading}
disabled={authLoading}
  >
Sign Out
  </Button>
</Group>
  </Group>
</Paper>

{/* Navigation Tabs */}
<Paper p='md' mb='xl' shadow='md' radius='lg'>
  <Tabs
value={activeTab}
onChange={(value) => value && setActiveTab(value)}
  >
<Tabs.List>
  <Tabs.Tab value='contexts' leftSection={<IconTags size={16} />}>
Manage Contexts
  </Tabs.Tab>
  <Tabs.Tab
value='settings'
leftSection={<IconSettings size={16} />}
  >
Settings
  </Tabs.Tab>
</Tabs.List>

{/* Contexts Tab Content */}
<Tabs.Panel value='contexts' pt='xl'>
  <Grid>
{/* Create Context Form */}
<Grid.Col span={{ base: 12, lg: 5 }}>
  <ContextForm onSuccess={handleOperationSuccess} />
</Grid.Col>

{/* Context List */}
<Grid.Col span={{ base: 12, lg: 7 }}>
  <ContextList
contexts={contexts}
loading={contextsLoading}
onEdit={handleEditContext}
onDelete={handleDeleteContext}
onRefresh={fetchContexts}
  />
</Grid.Col>
  </Grid>
</Tabs.Panel>

{/* Settings Tab Content */}
<Tabs.Panel value='settings' pt='xl'>
  <Paper p='xl' shadow='md' radius='lg'>
<Group gap='sm' mb='md'>
  <IconSettings size={24} color='#4A7FE7' />
  <Title order={2} c='gray.8'>
Context Settings
  </Title>
</Group>
<Text c='gray.6'>
  Context settings and preferences will be implemented in future
  updates. This will include default context behavior, privacy
  settings, and bulk operations.
</Text>
  </Paper>
</Tabs.Panel>
  </Tabs>
</Paper>

{/* Footer */}
<Card p='lg' shadow='sm' withBorder radius='lg'>
  <Text size='xs' c='dimmed' ta='center'>
TrueNamePath v1.0.0 - University Final Project (CM3035 Advanced Web
Design)
<br />
Context-Aware Identity Management API Demo
  </Text>
</Card>
  </Container>

  {/* Edit Modal */}
  <EditContextModal
opened={editModalOpened}
onClose={closeEditModal}
context={selectedContext}
onSuccess={handleOperationSuccess}
  />

  {/* Delete Modal */}
  <DeleteContextModal
opened={deleteModalOpened}
onClose={closeDeleteModal}
context={selectedContext}
onSuccess={handleOperationSuccess}
  />
</Box>
  );
}

export default function ContextsPage() {
  return (
<AuthGuard redirectTo='/auth/login'>
  <ContextsContent />
</AuthGuard>
  );
}
