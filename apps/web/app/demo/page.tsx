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

// Demo personas matching real authenticated users
const PERSONAS = {
  jj: {
id: '54c00e81-cda9-4251-9456-7778df91b988',
description:
  'Jędrzej Lewandowski (JJ) - Polish developer with nickname preference',
contexts: ['Work Colleagues', 'Gaming Friends', 'Open Source'],
  },
  liwei: {
id: '809d0224-81f1-48a0-9405-2258de21ea60',
description: 'Li Wei - Chinese name with Western adaptation',
contexts: ['Professional Network', 'Close Friends', 'Family & Cultural'],
  },
  alex: {
id: '257113c8-7a62-4758-9b1b-7992dd8aca1e',
description: 'Alex Smith - Developer with online persona',
contexts: [
  'Development Community',
  'Professional Services',
  'Casual Acquaintances',
],
  },
} as const;

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
  // Use authenticated user's ID if available, otherwise use demo persona
  const profileId = currentUser?.id || PERSONAS[selectedPersona].id;

  // Always use the Next.js API endpoint (Step 3 TypeScript implementation)
  // Authentication is optional for now (demo mode support)
  const headers: Record<string, string> = {
'Content-Type': 'application/json',
  };

  // Add authentication header if user is authenticated
  if (currentUser) {
const supabase = createBrowserSupabaseClient();
const { data: sessionData } = await supabase.auth.getSession();
const accessToken = sessionData.session?.access_token;

if (accessToken) {
  headers['Authorization'] = `Bearer ${accessToken}`;
}
  }

  const response = await fetch('/api/names/resolve', {
method: 'POST',
headers,
body: JSON.stringify({
  targetUserId: profileId,
  requesterUserId: currentUser?.id || null,
  contextName: audience,
}),
  });

  if (!response.ok) {
const errorData = await response.json();
setResults((prev) => ({
  ...prev,
  [audience]: `Error: ${errorData.error || 'API request failed'}`,
}));
return;
  }

  const apiData = await response.json();
  setResults((prev) => ({
...prev,
[audience]: apiData.name || 'No name found',
  }));
} catch (err) {
  console.error('Name resolution error:', err);
  setResults((prev) => ({
...prev,
[audience]: 'Network error occurred',
  }));
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
  {currentUser ? (
<Text size='sm' c='dimmed' mb='md'>
  When authenticated, the system uses your own contexts and name
  assignments. To see the demo personas, please log out.
</Text>
  ) : (
<>
  <Text size='sm' c='dimmed' mb='md'>
Click each button to see what name this persona shows to
different audiences:
  </Text>

  <Group gap='sm' mb='md'>
{PERSONAS[selectedPersona].contexts.map((context) => (
  <Button
key={context}
onClick={() => testNameResolution(context)}
loading={loading}
variant='outline'
size='sm'
  >
{context}
  </Button>
))}
  </Group>
</>
  )}

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
