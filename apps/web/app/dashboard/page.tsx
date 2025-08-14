'use client';

import { useState, useCallback, useEffect } from 'react';
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
  Card,
  Badge,
  Tabs,
  Grid,
  Skeleton,
  Center,
  SimpleGrid,
  Select,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconLogout,
  IconUser,
  IconShieldCheck,
  IconSettings,
  IconDashboard,
  IconLock,
  IconApi,
  IconActivity,
  IconEye,
  IconTags,
} from '@tabler/icons-react';
import { useAuth } from '../../lib/context/AuthProvider';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { Logo } from '../../components/branding';

// Dashboard data types
interface DashboardStats {
  user_profile: {
email: string;
profile_id: string;
member_since: string;
  };
  name_statistics: {
total_names: number;
names_by_type: Record<string, number>;
has_preferred_name: boolean;
  };
  context_statistics: {
custom_contexts: number;
active_consents: number;
pending_consent_requests: number;
  };
  activity_metrics: {
recent_activity_count: number;
api_calls_today: number;
total_api_calls: number;
  };
  privacy_metrics: {
privacy_score: number;
gdpr_compliance_status: 'compliant' | 'needs_attention';
audit_retention_days: number;
  };
}

function DashboardContent() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
null,
  );
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch dashboard statistics
  useEffect(() => {
async function fetchDashboardStats() {
  try {
const response = await fetch('/api/dashboard/stats', {
  method: 'GET',
  headers: {
'Content-Type': 'application/json',
  },
});

if (response.ok) {
  const result = await response.json();
  if (result.success) {
setDashboardStats(result.data);
  } else {
throw new Error(
  result.message || 'Failed to fetch dashboard statistics',
);
  }
} else {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
  } catch (error) {
console.error('Dashboard stats error:', error);
notifications.show({
  title: 'Error Loading Dashboard',
  message:
error instanceof Error
  ? error.message
  : 'Failed to load dashboard statistics',
  color: 'red',
  autoClose: 5000,
});
  } finally {
setStatsLoading(false);
  }
}

if (user?.profile?.id) {
  fetchDashboardStats();
}
  }, [user?.profile?.id]);

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
  TrueNamePath Dashboard
</Title>
<Text size='sm' c='gray.6'>
  Context-Aware Identity Management
</Text>
  </Box>
</Group>
<Button
  leftSection={<IconLogout size={16} />}
  variant='light'
  color='red'
  onClick={handleLogout}
  loading={loading}
  disabled={loading}
>
  Sign Out
</Button>
  </Group>
</Paper>

{/* Navigation Tabs */}
<Paper p='md' mb='xl' shadow='md' radius='lg'>
  <Tabs
value={activeTab}
onChange={(value) => value && setActiveTab(value)}
  >
<Tabs.List>
  <Tabs.Tab
value='dashboard'
leftSection={<IconDashboard size={16} />}
  >
Dashboard
  </Tabs.Tab>
  <Tabs.Tab value='names' leftSection={<IconUser size={16} />}>
Names
  </Tabs.Tab>
  <Tabs.Tab value='contexts' leftSection={<IconTags size={16} />}>
Contexts
  </Tabs.Tab>
  <Tabs.Tab
value='consents'
leftSection={<IconShieldCheck size={16} />}
  >
Consents
  </Tabs.Tab>
  <Tabs.Tab
value='settings'
leftSection={<IconSettings size={16} />}
  >
Settings
  </Tabs.Tab>
</Tabs.List>

{/* Dashboard Tab Content */}
<Tabs.Panel value='dashboard' pt='xl'>
  <Grid>
{/* Welcome Card */}
<Grid.Col span={{ base: 12, md: 8 }}>
  <WelcomeCard
user={user}
stats={dashboardStats}
loading={statsLoading}
  />
</Grid.Col>

{/* Privacy Score Card */}
<Grid.Col span={{ base: 12, md: 4 }}>
  <PrivacyScoreCard
stats={dashboardStats}
loading={statsLoading}
  />
</Grid.Col>

{/* API Usage Statistics */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <APIUsageCard stats={dashboardStats} loading={statsLoading} />
</Grid.Col>

{/* Name Variants Overview */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <NameVariantsCard
stats={dashboardStats}
loading={statsLoading}
  />
</Grid.Col>

{/* Recent Activity */}
<Grid.Col span={12}>
  <RecentActivityCard
stats={dashboardStats}
loading={statsLoading}
  />
</Grid.Col>
  </Grid>
</Tabs.Panel>

{/* Names Tab Content */}
<Tabs.Panel value='names' pt='xl'>
  <NameManagementPanel />
</Tabs.Panel>

{/* Contexts Tab Content */}
<Tabs.Panel value='contexts' pt='xl'>
  <ContextManagementPanel />
</Tabs.Panel>

{/* Consents Tab Content */}
<Tabs.Panel value='consents' pt='xl'>
  <ConsentManagementPanel />
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
</Box>
  );
}

// Welcome Card Component
function WelcomeCard({
  user,
  stats,
  loading,
}: {
  user: { email?: string; profile?: { id: string } } | null;
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const memberSince = stats?.user_profile?.member_since
? new Date(stats.user_profile.member_since).toLocaleDateString()
: 'Unknown';

  return (
<Paper p='xl' shadow='md' radius='lg' style={{ height: '100%' }}>
  <Group gap='md' mb='xl'>
<Box
  style={{
width: 60,
height: 60,
borderRadius: '50%',
background:
  'linear-gradient(135deg, rgba(74, 127, 231, 0.1) 0%, rgba(195, 217, 247, 0.2) 100%)',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
  }}
>
  <IconUser size={24} color='#4A7FE7' />
</Box>
<Box>
  <Title order={2} c='gray.8' mb='xs'>
Welcome back!
  </Title>
  <Text size='sm' c='gray.6'>
{user?.email || 'Unknown user'}
  </Text>
</Box>
  </Group>

  <SimpleGrid cols={3} spacing='md'>
<Box>
  {loading ? (
<Skeleton height={28} width={40} />
  ) : (
<Text size='xl' fw={600} c='brand.7'>
  {stats?.name_statistics.total_names || 0}
</Text>
  )}
  <Text size='xs' c='gray.6'>
Name Variants
  </Text>
</Box>
<Box>
  {loading ? (
<Skeleton height={28} width={40} />
  ) : (
<Text size='xl' fw={600} c='blue.7'>
  {stats?.context_statistics.custom_contexts || 0}
</Text>
  )}
  <Text size='xs' c='gray.6'>
Custom Contexts
  </Text>
</Box>
<Box>
  {loading ? (
<Skeleton height={28} width={40} />
  ) : (
<Text size='xl' fw={600} c='green.7'>
  {stats?.activity_metrics.total_api_calls || 0}
</Text>
  )}
  <Text size='xs' c='gray.6'>
API Calls
  </Text>
</Box>
  </SimpleGrid>

  <Group gap='xs' mt='xl'>
<Text size='xs' c='gray.6'>
  Member since
</Text>
{loading ? (
  <Skeleton height={14} width={80} />
) : (
  <Text size='xs' c='gray.6'>
{memberSince}
  </Text>
)}
  </Group>
</Paper>
  );
}

// Privacy Score Card Component
function PrivacyScoreCard({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const privacyScore = stats?.privacy_metrics.privacy_score || 0;
  const isCompliant =
stats?.privacy_metrics.gdpr_compliance_status === 'compliant';

  return (
<Paper p='xl' shadow='md' radius='lg' style={{ height: '100%' }}>
  <Group gap='sm' mb='md'>
<IconLock size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Privacy Score
</Title>
  </Group>

  <Center mb='xl'>
{loading ? (
  <Skeleton circle height={80} />
) : (
  <Box ta='center'>
<Text
  size='40'
  fw={700}
  c={
privacyScore >= 70
  ? 'green.6'
  : privacyScore >= 50
? 'yellow.6'
: 'red.6'
  }
>
  {privacyScore}
</Text>
<Text size='xs' c='gray.6'>
  out of 100
</Text>
  </Box>
)}
  </Center>

  <Badge
variant='light'
color={loading ? 'gray' : isCompliant ? 'green' : 'yellow'}
fullWidth
size='lg'
  >
{loading
  ? 'Loading...'
  : isCompliant
? 'GDPR Compliant'
: 'Needs Attention'}
  </Badge>
</Paper>
  );
}

// API Usage Card Component
function APIUsageCard({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconApi size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  API Usage
</Title>
  </Group>

  <Stack gap='md'>
<Group justify='space-between'>
  <Text size='sm' c='gray.7'>
Today&apos;s API Calls
  </Text>
  {loading ? (
<Skeleton height={16} width={30} />
  ) : (
<Text size='sm' fw={600} c='brand.7'>
  {stats?.activity_metrics.api_calls_today || 0}
</Text>
  )}
</Group>
<Group justify='space-between'>
  <Text size='sm' c='gray.7'>
Recent Activity
  </Text>
  {loading ? (
<Skeleton height={16} width={30} />
  ) : (
<Text size='sm' fw={600} c='blue.7'>
  {stats?.activity_metrics.recent_activity_count || 0}
</Text>
  )}
</Group>
<Group justify='space-between'>
  <Text size='sm' c='gray.7'>
Active Consents
  </Text>
  {loading ? (
<Skeleton height={16} width={30} />
  ) : (
<Text size='sm' fw={600} c='green.7'>
  {stats?.context_statistics.active_consents || 0}
</Text>
  )}
</Group>
  </Stack>
</Paper>
  );
}

// Name Variants Card Component
function NameVariantsCard({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const nameTypes = ['LEGAL', 'PREFERRED', 'NICKNAME', 'ALIAS'];

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconUser size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Name Variants
</Title>
  </Group>

  <Stack gap='xs'>
{nameTypes.map((type) => {
  const count = stats?.name_statistics.names_by_type[type] || 0;
  return (
<Group key={type} justify='space-between'>
  <Badge variant='light' color='blue' size='sm'>
{type}
  </Badge>
  {loading ? (
<Skeleton height={16} width={20} />
  ) : (
<Text size='sm' c='gray.7'>
  {count}
</Text>
  )}
</Group>
  );
})}
  </Stack>
</Paper>
  );
}

// Recent Activity Card Component
function RecentActivityCard({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const { user } = useAuth();
  interface Activity {
action: string;
created_at: string;
metadata?: {
  context_name?: string;
  resolved_name?: string;
};
  }
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Fetch recent audit activities
  useEffect(() => {
async function fetchActivities() {
  if (!user?.profile?.id) return;

  try {
const response = await fetch(
  `/api/audit/${user.profile.id}?limit=5&days=7`,
  {
method: 'GET',
headers: { 'Content-Type': 'application/json' },
  },
);

if (response.ok) {
  const result = await response.json();
  if (result.success) {
setActivities(result.data);
  }
}
  } catch (error) {
console.error('Failed to fetch activities:', error);
  } finally {
setActivitiesLoading(false);
  }
}

if (user?.profile?.id) {
  fetchActivities();
}
  }, [user?.profile?.id]);

  // Format activity action for display
  const formatActivityAction = (action: string) => {
switch (action) {
  case 'name_resolution':
return 'Name Resolved';
  case 'consent_granted':
return 'Consent Granted';
  case 'consent_revoked':
return 'Consent Revoked';
  case 'profile_updated':
return 'Profile Updated';
  case 'name_created':
return 'Name Added';
  default:
return action.replace('_', ' ').toUpperCase();
}
  };

  // Get activity icon
  const getActivityIcon = (action: string) => {
switch (action) {
  case 'name_resolution':
return <IconEye size={16} color='#4A7FE7' />;
  case 'consent_granted':
return <IconShieldCheck size={16} color='#27ae60' />;
  case 'consent_revoked':
return <IconShieldCheck size={16} color='#e74c3c' />;
  case 'profile_updated':
return <IconUser size={16} color='#4A7FE7' />;
  case 'name_created':
return <IconUser size={16} color='#27ae60' />;
  default:
return <IconActivity size={16} color='#4A7FE7' />;
}
  };

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconActivity size={20} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Recent Activity
</Title>
{stats?.activity_metrics.recent_activity_count && (
  <Badge variant='light' color='blue' size='sm'>
{stats.activity_metrics.recent_activity_count} in last 7 days
  </Badge>
)}
  </Group>

  {loading || activitiesLoading ? (
<Stack gap='xs'>
  <Skeleton height={40} />
  <Skeleton height={40} />
  <Skeleton height={40} />
</Stack>
  ) : activities.length > 0 ? (
<Stack gap='md'>
  {activities.map((activity, index) => (
<Paper key={index} p='md' withBorder radius='md' bg='gray.0'>
  <Group gap='sm'>
{getActivityIcon(activity.action)}
<Box flex={1}>
  <Group justify='space-between' mb='xs'>
<Text size='sm' fw={500}>
  {formatActivityAction(activity.action)}
</Text>
<Text size='xs' c='gray.6'>
  {new Date(activity.created_at).toLocaleDateString()}
</Text>
  </Group>

  {activity.metadata?.context_name && (
<Text size='xs' c='gray.6'>
  Context: {activity.metadata.context_name}
</Text>
  )}

  {activity.metadata?.resolved_name && (
<Text size='xs' c='green.6'>
  Resolved to: &quot;{activity.metadata.resolved_name}&quot;
</Text>
  )}
</Box>
  </Group>
</Paper>
  ))}

  <Button
variant='subtle'
color='brand'
size='sm'
onClick={() => {
  notifications.show({
title: 'Coming Soon',
message:
  'Full activity log will be available in the next update',
color: 'blue',
autoClose: 4000,
  });
}}
  >
View Full Activity Log
  </Button>
</Stack>
  ) : (
<Text size='sm' c='gray.6' ta='center' py='xl'>
  No recent activity found
</Text>
  )}
</Paper>
  );
}

// Enhanced Name Management Panel with Live Resolution Preview
interface Name {
  name_type: string;
  name_text: string;
  is_preferred: boolean;
  description?: string;
  created_at: string;
  last_used_at?: string;
}

interface Context {
  id: string;
  name: string;
  description: string;
}

function NameManagementPanel() {
  const { user } = useAuth();
  const [names, setNames] = useState<Name[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  // Fetch user's name variants
  useEffect(() => {
async function fetchNames() {
  if (!user?.profile?.id) return;

  try {
const response = await fetch(`/api/names/${user.profile.id}`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
});

if (response.ok) {
  const result = await response.json();
  if (result.success) {
setNames(result.data);
  }
}
  } catch (error) {
console.error('Failed to fetch names:', error);
  } finally {
setNamesLoading(false);
  }
}

fetchNames();
  }, [user?.profile?.id]);

  // Fetch user contexts for resolution preview
  useEffect(() => {
async function fetchContexts() {
  if (!user?.profile?.id) return;

  try {
// This would use a contexts API endpoint when available
// For now, use demo contexts
setContexts([
  {
id: 'work',
name: 'Work Colleagues',
description: 'Professional workplace context',
  },
  {
id: 'friends',
name: 'Personal Friends',
description: 'Casual social context',
  },
  {
id: 'family',
name: 'Family Members',
description: 'Family and relatives',
  },
  {
id: 'public',
name: 'Public Profile',
description: 'Public-facing contexts',
  },
]);
  } catch (error) {
console.error('Failed to fetch contexts:', error);
  }
}

fetchContexts();
  }, [user?.profile?.id]);

  // Handle name resolution preview
  const handleResolvePreview = async (contextName: string) => {
if (!user?.profile?.id || !contextName) return;

setResolveLoading(true);
try {
  const response = await fetch('/api/names/resolve', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
  target_user_id: user.profile.id,
  requester_user_id: user.profile.id,
  context_name: contextName,
}),
  });

  if (response.ok) {
const result = await response.json();
if (result.success) {
  setResolvedName(result.data.resolved_name);
} else {
  setResolvedName('Resolution failed');
}
  }
} catch (error) {
  console.error('Name resolution error:', error);
  setResolvedName('Error occurred');
} finally {
  setResolveLoading(false);
}
  };

  // Get name type color
  const getNameTypeColor = (type: string) => {
switch (type) {
  case 'LEGAL':
return 'red';
  case 'PREFERRED':
return 'blue';
  case 'NICKNAME':
return 'green';
  case 'ALIAS':
return 'orange';
  case 'PROFESSIONAL':
return 'purple';
  case 'CULTURAL':
return 'teal';
  default:
return 'gray';
}
  };

  return (
<Grid>
  {/* Name Variants Table */}
  <Grid.Col span={{ base: 12, lg: 8 }}>
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconUser size={24} color='#4A7FE7' />
<Title order={2} c='gray.8'>
  Your Name Variants
</Title>
  </Group>

  {namesLoading ? (
<Stack gap='md'>
  <Skeleton height={50} />
  <Skeleton height={50} />
  <Skeleton height={50} />
</Stack>
  ) : names.length > 0 ? (
<Stack gap='md'>
  {names.map((name, index) => (
<Paper key={index} p='md' withBorder radius='md'>
  <Group justify='space-between' mb='xs'>
<Group gap='sm'>
  <Badge
variant='light'
color={getNameTypeColor(name.name_type)}
size='sm'
  >
{name.name_type}
  </Badge>
  <Text fw={600} size='lg'>
{name.name_text}
  </Text>
  {name.is_preferred && (
<Badge variant='filled' color='blue' size='xs'>
  Preferred
</Badge>
  )}
</Group>
<Group gap='xs'>
  <Button variant='light' color='blue' size='xs'>
Edit
  </Button>
  <Button variant='light' color='red' size='xs'>
Remove
  </Button>
</Group>
  </Group>

  {name.description && (
<Text size='sm' c='gray.6' mb='xs'>
  {name.description}
</Text>
  )}

  <Group gap='xs'>
<Text size='xs' c='gray.5'>
  Added: {new Date(name.created_at).toLocaleDateString()}
</Text>
{name.last_used_at && (
  <Text size='xs' c='gray.5'>
Last used:{' '}
{new Date(name.last_used_at).toLocaleDateString()}
  </Text>
)}
  </Group>
</Paper>
  ))}

  <Button
variant='light'
color='brand'
leftSection={<IconUser size={16} />}
onClick={() => {
  notifications.show({
title: 'Coming Soon',
message:
  'Add new name variant functionality will be available in Step 11',
color: 'blue',
autoClose: 4000,
  });
}}
  >
Add New Name Variant
  </Button>
</Stack>
  ) : (
<Box ta='center' py='xl'>
  <Text c='gray.6' mb='md'>
No name variants found
  </Text>
  <Button
variant='light'
color='brand'
leftSection={<IconUser size={16} />}
  >
Add Your First Name Variant
  </Button>
</Box>
  )}
</Paper>
  </Grid.Col>

  {/* Live Name Resolution Preview */}
  <Grid.Col span={{ base: 12, lg: 4 }}>
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconEye size={24} color='#4A7FE7' />
<Title order={3} c='gray.8'>
  Resolution Preview
</Title>
  </Group>

  <Text size='sm' c='gray.6' mb='lg'>
See how your name appears in different contexts
  </Text>

  <Stack gap='md'>
<Select
  label='Select Context'
  placeholder='Choose a context...'
  value={selectedContext}
  onChange={(value) => {
setSelectedContext(value || '');
if (value) {
  handleResolvePreview(value);
} else {
  setResolvedName(null);
}
  }}
  data={contexts.map((ctx) => ({
value: ctx.name,
label: ctx.name,
  }))}
/>

{selectedContext && (
  <Paper p='md' bg='gray.0' radius='md'>
<Text size='xs' c='gray.6' mb='xs'>
  Resolved Name:
</Text>
{resolveLoading ? (
  <Skeleton height={24} width='80%' />
) : (
  <Text
size='lg'
fw={600}
c={resolvedName ? 'green.7' : 'red.7'}
  >
{resolvedName || 'No name resolved'}
  </Text>
)}
  </Paper>
)}

{contexts.length > 0 && (
  <Box>
<Text size='xs' c='gray.6' mb='xs'>
  Available Contexts:
</Text>
<Stack gap='xs'>
  {contexts.map((context) => (
<Paper key={context.id} p='xs' withBorder radius='sm'>
  <Text size='sm' fw={500}>
{context.name}
  </Text>
  <Text size='xs' c='gray.6'>
{context.description}
  </Text>
</Paper>
  ))}
</Stack>
  </Box>
)}
  </Stack>
</Paper>
  </Grid.Col>
</Grid>
  );
}

function ContextManagementPanel() {
  const router = useRouter();

  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group justify='space-between' mb='md'>
<Group gap='sm'>
  <IconTags size={24} color='#4A7FE7' />
  <Title order={2} c='gray.8'>
Context Management
  </Title>
</Group>
<Button
  color='brand'
  leftSection={<IconTags size={16} />}
  onClick={() => router.push('/contexts')}
>
  Manage Contexts
</Button>
  </Group>
  <Text c='gray.6' mb='lg'>
Create and manage custom contexts for your name variants. This allows
you to control how your name appears to different audiences and
applications.
  </Text>

  <Grid>
<Grid.Col span={{ base: 12, md: 6 }}>
  <Paper p='md' withBorder radius='md' bg='gray.0'>
<Text fw={600} size='sm' mb='xs'>
  What are contexts?
</Text>
<Text size='xs' c='gray.6'>
  Contexts are custom categories that determine which name variant
  to use. Examples: &quot;Work Colleagues&quot;, &quot;Gaming
  Friends&quot;, &quot;HR Systems&quot;, &quot;Client Portal&quot;
</Text>
  </Paper>
</Grid.Col>

<Grid.Col span={{ base: 12, md: 6 }}>
  <Paper p='md' withBorder radius='md' bg='blue.0'>
<Text fw={600} size='sm' mb='xs'>
  Ready to get started?
</Text>
<Text size='xs' c='gray.6'>
  Click &quot;Manage Contexts&quot; to create your first custom
  context and assign name variants to control your identity
  presentation.
</Text>
  </Paper>
</Grid.Col>
  </Grid>
</Paper>
  );
}

function ConsentManagementPanel() {
  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconShieldCheck size={24} color='#4A7FE7' />
<Title order={2} c='gray.8'>
  Consent Management
</Title>
  </Group>
  <Text c='gray.6'>
Consent management interface will be implemented in Step 14. This will
include managing consent requests and privacy preferences.
  </Text>
</Paper>
  );
}

function SettingsPanel() {
  return (
<Paper p='xl' shadow='md' radius='lg'>
  <Group gap='sm' mb='md'>
<IconSettings size={24} color='#4A7FE7' />
<Title order={2} c='gray.8'>
  Account Settings
</Title>
  </Group>
  <Text c='gray.6'>
Account settings will be implemented in future steps. This will include
profile management, security settings, and API key management.
  </Text>
</Paper>
  );
}

export default function DashboardPage() {
  return (
<AuthGuard redirectTo='/auth/login'>
  <DashboardContent />
</AuthGuard>
  );
}
