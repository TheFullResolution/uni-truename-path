'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Container,
  Paper,
  Title,
  Text,
  Box,
  Button,
  Group,
  Tabs,
  Grid,
  Card,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconLogout,
  IconSettings,
  IconArrowLeft,
  IconTags,
  IconUserCheck,
  IconEye,
  IconUser,
} from '@tabler/icons-react';
import { CACHE_KEYS } from '../../lib/swr-keys';
import { useAuth } from '../../lib/context';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { Logo } from '../../components/branding';
import { createLogoutHandler } from '../../lib/utils';
import { swrFetcher } from '../../lib/swr-fetcher';
import {
  ContextAssignmentPanel,
  AssignmentPreview,
  NameCreationForm,
  NameManagement,
  ContextForm,
  ContextList,
  SettingsPanel,
  EditContextModal,
  DeleteContextModal,
} from '../../components/contexts';
import type {
  ContextsResponseData,
  ContextWithStats,
} from '../../types/api-responses';

// Main ContextsContent Component
function ContextsContent() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('contexts');
  const [selectedContext, setSelectedContext] =
useState<ContextWithStats | null>(null);

  // Track if welcome notification was already shown
  const [welcomeShown, setWelcomeShown] = useState(false);

  // SWR hook for contexts data
  const {
data: contextsData,
error: contextsError,
mutate,
  } = useSWR<ContextsResponseData>(
user?.id ? CACHE_KEYS.CONTEXTS : null,
swrFetcher,
  );

  // Derived state from SWR
  const contexts = contextsData?.contexts || [];
  const contextsLoading = !contextsData && !contextsError;

  // Modal states
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
useDisclosure(false);
  const [
deleteModalOpened,
{ open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);

  // Handle welcome notification when contexts data changes
  useEffect(() => {
if (
  contextsData?.contexts &&
  contextsData.contexts.length > 0 &&
  !welcomeShown
) {
  const contexts = contextsData.contexts;
  // Show onboarding notification for users with only default contexts
  const defaultContextNames = ['Professional', 'Social', 'Public'];
  const hasOnlyDefaultContexts =
contexts.length === 3 &&
contexts.every((ctx: ContextWithStats) =>
  defaultContextNames.includes(ctx.context_name),
);

  if (contexts.length === 0 || hasOnlyDefaultContexts) {
notifications.show({
  title: 'Welcome to Context Management!',
  message: hasOnlyDefaultContexts
? "We've created three starter contexts for you: Professional, Social, and Public. You can customize these names, create new contexts, or assign your name variants to these contexts to control how different audiences see your name."
: 'Create your first context to organize how different audiences see your name. Start with something like "Work Colleagues" or "HR Systems" to get going.',
  color: 'blue',
  autoClose: false,
});
setWelcomeShown(true);
  }
}
  }, [contextsData, welcomeShown]);

  // Note: Error handling is now done in ContextList component for better UX
  // This prevents duplicate error notifications and provides inline retry functionality

  // Handle logout using utility function
  const handleLogout = useCallback(
() => createLogoutHandler(logout, router)(),
[logout, router],
  );

  // Handle edit context
  const handleEditContext = (context: ContextWithStats) => {
setSelectedContext(context);
openEditModal();
  };

  // Handle delete context
  const handleDeleteContext = (context: ContextWithStats) => {
setSelectedContext(context);
openDeleteModal();
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
  <Tabs.Tab value='names' leftSection={<IconUser size={16} />}>
Manage Names
  </Tabs.Tab>
  <Tabs.Tab
value='assign'
leftSection={<IconUserCheck size={16} />}
  >
Assign Names
  </Tabs.Tab>
  <Tabs.Tab value='preview' leftSection={<IconEye size={16} />}>
Preview Resolution
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
  <ContextForm />
</Grid.Col>

{/* Context List */}
<Grid.Col span={{ base: 12, lg: 7 }}>
  <ContextList
contexts={contexts}
loading={contextsLoading}
error={contextsError}
onEdit={handleEditContext}
onDelete={handleDeleteContext}
onRefresh={mutate}
  />
</Grid.Col>
  </Grid>
</Tabs.Panel>

{/* Names Tab Content */}
<Tabs.Panel value='names' pt='xl'>
  <Grid>
{/* Name Creation Form */}
<Grid.Col span={{ base: 12, lg: 5 }}>
  <NameCreationForm />
</Grid.Col>

{/* Name Management */}
<Grid.Col span={{ base: 12, lg: 7 }}>
  <NameManagement userId={user?.id || ''} />
</Grid.Col>
  </Grid>
</Tabs.Panel>

{/* Assignment Tab Content */}
<Tabs.Panel value='assign' pt='xl'>
  <ContextAssignmentPanel
onRefresh={() => {
  mutate();
}}
  />
</Tabs.Panel>

{/* Preview Tab Content */}
<Tabs.Panel value='preview' pt='xl'>
  <AssignmentPreview userId={user?.id || ''} />
</Tabs.Panel>

{/* Settings Tab Content */}
<Tabs.Panel value='settings' pt='xl'>
  <SettingsPanel />
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
  />

  {/* Delete Modal */}
  <DeleteContextModal
opened={deleteModalOpened}
onClose={closeDeleteModal}
context={selectedContext}
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
