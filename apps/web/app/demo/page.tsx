'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Container,
  Title,
  Text,
  Card,
  Group,
  Stack,
  Code,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { IconUser, IconLogin } from '@tabler/icons-react';
import {
  createBrowserSupabaseClient,
  getCurrentUser,
  type AuthenticatedUser,
} from '@uni-final-project/database';

// Demo personas from your academic requirements
const PERSONAS = {
  jj: {
id: '11111111-1111-1111-1111-111111111111',
description:
  'Jędrzej Lewandowski (JJ) - Polish developer with nickname preference',
  },
  liwei: {
id: '22222222-2222-2222-2222-222222222222',
description: 'Li Wei - Chinese name with Western adaptation',
  },
  alex: {
id: '33333333-3333-3333-3333-333333333333',
description: 'Alex Smith - Developer with online persona',
  },
} as const;

const AUDIENCES = ['hr', 'slack', 'github', 'internal_systems'] as const;

export default function DemoPage() {
  const [selectedPersona, setSelectedPersona] =
useState<keyof typeof PERSONAS>('jj');
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(
null,
  );
  const [authLoading, setAuthLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
const supabase = createBrowserSupabaseClient();

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
const { user } = await getCurrentUser();
if (user) {
  setCurrentUser(user);
  setDemoMode(false);
}
  } else if (event === 'SIGNED_OUT') {
setCurrentUser(null);
setDemoMode(true);
  }
});

return () => subscription.unsubscribe();
  }, []);

  // Check for authenticated user on component mount
  useEffect(() => {
const checkAuth = async () => {
  setAuthLoading(true);
  try {
const { user, error } = await getCurrentUser();

if (user && !error) {
  setCurrentUser(user);
  setDemoMode(false);
} else {
  setCurrentUser(null);
  setDemoMode(true);
}
  } catch {
console.warn('Auth check failed, enabling demo mode');
setCurrentUser(null);
setDemoMode(true);
  } finally {
setAuthLoading(false);
  }
};

checkAuth();
  }, []);

  const testNameResolution = async (audience: string) => {
setLoading(true);
try {
  const supabase = createBrowserSupabaseClient();

  // Use authenticated user's ID if available, otherwise use demo persona
  const profileId = currentUser?.id || PERSONAS[selectedPersona].id;
  const purpose = currentUser ? 'user_testing' : 'demo_testing';

  const { data, error } = await supabase.rpc('resolve_name', {
p_profile: profileId,
p_audience: audience,
p_purpose: purpose,
  });

  if (error) {
setResults((prev) => ({
  ...prev,
  [audience]: `Error: ${error.message}`,
}));
  } else {
setResults((prev) => ({
  ...prev,
  [audience]: data || 'No name found',
}));
  }
} catch {
  setResults((prev) => ({ ...prev, [audience]: 'Network error' }));
} finally {
  setLoading(false);
}
  };

  if (authLoading) {
return (
  <Container size='md' py='xl'>
<Center>
  <Stack align='center' gap='md'>
<Loader size='lg' />
<Text>Loading authentication state...</Text>
  </Stack>
</Center>
  </Container>
);
  }

  return (
<Container size='md' py='xl'>
  <Stack gap='xl'>
<div>
  <Title order={1} mb='md'>
TrueNamePath Demo
  </Title>
  <Text size='lg' c='dimmed'>
Context-aware name resolution in action. Select a persona and test
how different audiences see different names.
  </Text>
</div>

{/* Authentication status alert */}
{currentUser ? (
  <Alert
color='green'
title='Authenticated Demo Mode'
icon={<IconUser size={16} />}
  >
Welcome, <strong>{currentUser.email}</strong>! You&apos;re testing
the context engine with your own profile. The system will use your
actual name variants and consent settings.
  </Alert>
) : (
  <Alert
color='blue'
title='Demo Mode - Academic Project'
icon={<IconLogin size={16} />}
  >
You&apos;re viewing the demo with academic personas. This
demonstrates the core TrueNamePath concept:{' '}
<strong>right name, right audience, right time</strong>. Each
persona has different name variants with different visibility and
consent settings.{' '}
<Button
  variant='subtle'
  size='xs'
  component='a'
  href='/auth/login'
  mt='sm'
>
  Sign in to test with your own profile
</Button>
  </Alert>
)}

{/* Only show persona selector in demo mode */}
{demoMode && (
  <Card withBorder>
<Title order={3} mb='md'>
  Select Demo Persona
</Title>
<Group gap='sm'>
  {Object.entries(PERSONAS).map(([key]) => (
<Button
  key={key}
  variant={selectedPersona === key ? 'filled' : 'outline'}
  onClick={() =>
setSelectedPersona(key as keyof typeof PERSONAS)
  }
  size='sm'
>
  {key.toUpperCase()}
</Button>
  ))}
</Group>
<Text size='sm' c='dimmed' mt='sm'>
  {PERSONAS[selectedPersona].description}
</Text>
  </Card>
)}

<Card withBorder>
  <Title order={3} mb='md'>
Test Name Resolution by Audience
  </Title>
  <Text size='sm' c='dimmed' mb='md'>
Click each button to see what name{' '}
{currentUser ? 'your profile' : 'this persona'} shows to different
audiences:
  </Text>

  <Group gap='sm' mb='md'>
{AUDIENCES.map((audience) => (
  <Button
key={audience}
onClick={() => testNameResolution(audience)}
loading={loading}
variant='outline'
size='sm'
  >
View as {audience.toUpperCase()}
  </Button>
))}
  </Group>

  {Object.keys(results).length > 0 && (
<Stack gap='xs'>
  <Text fw={500}>Results:</Text>
  {Object.entries(results).map(([audience, name]) => (
<Group key={audience} gap='xs'>
  <Code>{audience}:</Code>
  <Text>{name}</Text>
</Group>
  ))}
</Stack>
  )}
</Card>

<Card withBorder>
  <Title order={4} mb='sm'>
How This Works
  </Title>
  <Stack gap='xs'>
<Text size='sm'>
  • <strong>Context Engine</strong>: The <Code>resolve_name()</Code>{' '}
  function checks user consent and name visibility
</Text>
<Text size='sm'>
  • <strong>Privacy by Design</strong>: Each request is logged in
  the audit table for GDPR compliance
</Text>
<Text size='sm'>
  • <strong>Consent-Based</strong>: Users control which audiences
  can see which names
</Text>
<Text size='sm'>
  • <strong>Prioritized</strong>: preferred &gt; nickname &gt; legal
  &gt; alias based on context appropriateness
</Text>
{currentUser && (
  <Text size='sm' fw={500} c='green'>
• <strong>Live Data</strong>: You&apos;re seeing results from
your actual profile with real consent settings
  </Text>
)}
  </Stack>
</Card>
  </Stack>
</Container>
  );
}
