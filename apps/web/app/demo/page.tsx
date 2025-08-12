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
  TextInput,
  Select,
  Badge,
  Tabs,
  JsonInput,
  ScrollArea,
  Divider,
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

  // API Testing state
  interface ApiResult {
status?: number;
statusText?: string;
data?: unknown;
request?: unknown;
timestamp?: string;
error?: string;
  }
  const [apiResults, setApiResults] = useState<Record<string, ApiResult>>({});
  const [apiLoading, setApiLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('names');

  // Consent form state
  const [consentForm, setConsentForm] = useState({
action: 'request' as 'request' | 'grant' | 'revoke',
granterUserId: '',
requesterUserId: '',
contextName: '',
  });

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

  // API Testing Functions
  const testNamesAPI = async () => {
if (!currentUser) {
  setApiResults({
names: { error: 'Authentication required to test Names API' },
  });
  return;
}

setApiLoading({ ...apiLoading, names: true });

try {
  const supabase = createBrowserSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
setApiResults({
  names: { error: 'No access token found' },
});
return;
  }

  const response = await fetch(`/api/names/${currentUser.id}`, {
method: 'GET',
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`,
},
  });

  const data = await response.json();

  setApiResults({
...apiResults,
names: {
  status: response.status,
  statusText: response.ok ? 'Success' : 'Error',
  data: data,
  timestamp: new Date().toISOString(),
},
  });
} catch (error) {
  setApiResults({
...apiResults,
names: {
  error: error instanceof Error ? error.message : 'Network error',
  timestamp: new Date().toISOString(),
},
  });
} finally {
  setApiLoading({ ...apiLoading, names: false });
}
  };

  const testConsentsAPI = async () => {
if (!currentUser) {
  setApiResults({
consents: { error: 'Authentication required to test Consents API' },
  });
  return;
}

if (!consentForm.granterUserId || !consentForm.requesterUserId) {
  setApiResults({
consents: { error: 'Both granter and requester user IDs are required' },
  });
  return;
}

setApiLoading({ ...apiLoading, consents: true });

try {
  const supabase = createBrowserSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
setApiResults({
  consents: { error: 'No access token found' },
});
return;
  }

  interface ConsentRequestBody {
action: 'request' | 'grant' | 'revoke';
granterUserId: string;
requesterUserId: string;
contextName?: string;
expiresAt?: string | null;
  }

  const requestBody: ConsentRequestBody = {
action: consentForm.action,
granterUserId: consentForm.granterUserId,
requesterUserId: consentForm.requesterUserId,
  };

  if (consentForm.action === 'request' && consentForm.contextName) {
requestBody.contextName = consentForm.contextName;
requestBody.expiresAt = null; // Optional, can be set for testing
  }

  const response = await fetch('/api/consents', {
method: 'POST',
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`,
},
body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  setApiResults({
...apiResults,
consents: {
  status: response.status,
  statusText: response.ok ? 'Success' : 'Error',
  data: data,
  request: requestBody,
  timestamp: new Date().toISOString(),
},
  });
} catch (error) {
  setApiResults({
...apiResults,
consents: {
  error: error instanceof Error ? error.message : 'Network error',
  timestamp: new Date().toISOString(),
},
  });
} finally {
  setApiLoading({ ...apiLoading, consents: false });
}
  };

  const testAuditAPI = async () => {
if (!currentUser) {
  setApiResults({
audit: { error: 'Authentication required to test Audit API' },
  });
  return;
}

setApiLoading({ ...apiLoading, audit: true });

try {
  const supabase = createBrowserSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
setApiResults({
  audit: { error: 'No access token found' },
});
return;
  }

  // Add query parameters for demonstration
  const queryParams = new URLSearchParams({
limit: '10',
// action: 'name_resolved', // Optional filter
  });

  const response = await fetch(
`/api/audit/${currentUser.id}?${queryParams}`,
{
  method: 'GET',
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${accessToken}`,
  },
},
  );

  const data = await response.json();

  setApiResults({
...apiResults,
audit: {
  status: response.status,
  statusText: response.ok ? 'Success' : 'Error',
  data: data,
  timestamp: new Date().toISOString(),
},
  });
} catch (error) {
  setApiResults({
...apiResults,
audit: {
  error: error instanceof Error ? error.message : 'Network error',
  timestamp: new Date().toISOString(),
},
  });
} finally {
  setApiLoading({ ...apiLoading, audit: false });
}
  };

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

{/* API Endpoints Testing Section */}
{currentUser && (
  <Card withBorder>
<Title order={3} mb='md'>
  REST API Endpoints Testing
</Title>
<Text size='sm' c='dimmed' mb='md'>
  Interactive testing of the new REST API endpoints with JWT
  authentication. Test the three core API endpoints that demonstrate
  academic REST principles.
</Text>

<Tabs
  value={activeTab}
  onChange={(value) => value && setActiveTab(value)}
>
  <Tabs.List>
<Tabs.Tab value='names'>
  <Badge variant='light' color='blue' size='sm'>
GET
  </Badge>
  <Text ml='xs'>Names API</Text>
</Tabs.Tab>
<Tabs.Tab value='consents'>
  <Badge variant='light' color='green' size='sm'>
POST
  </Badge>
  <Text ml='xs'>Consents API</Text>
</Tabs.Tab>
<Tabs.Tab value='audit'>
  <Badge variant='light' color='orange' size='sm'>
GET
  </Badge>
  <Text ml='xs'>Audit API</Text>
</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panel value='names' pt='md'>
<Stack gap='sm'>
  <Group>
<Code>
  GET /api/names/{currentUser.id.substring(0, 8)}...
</Code>
<Button
  onClick={testNamesAPI}
  loading={apiLoading.names}
  variant='outline'
  size='sm'
>
  Test Names API
</Button>
  </Group>
  <Text size='sm' c='dimmed'>
Retrieves all name variants for your profile with optional
filtering. Requires JWT authentication and validates profile
ownership.
  </Text>
  {apiResults.names && (
<Card withBorder bg='gray.0' p='sm'>
  <Group mb='xs'>
<Badge
  color={
(apiResults.names.status ?? 500) < 400
  ? 'green'
  : 'red'
  }
  variant='filled'
>
  {apiResults.names.status || 'ERROR'}{' '}
  {apiResults.names.statusText}
</Badge>
<Text size='xs' c='dimmed'>
  {apiResults.names.timestamp}
</Text>
  </Group>
  <ScrollArea h={200}>
<JsonInput
  value={JSON.stringify(apiResults.names, null, 2)}
  readOnly
  minRows={8}
/>
  </ScrollArea>
</Card>
  )}
</Stack>
  </Tabs.Panel>

  <Tabs.Panel value='consents' pt='md'>
<Stack gap='sm'>
  <Group>
<Code>POST /api/consents</Code>
<Select
  value={consentForm.action}
  onChange={(value) =>
value &&
setConsentForm({
  ...consentForm,
  action: value as 'request' | 'grant' | 'revoke',
})
  }
  data={[
{ value: 'request', label: 'Request Consent' },
{ value: 'grant', label: 'Grant Consent' },
{ value: 'revoke', label: 'Revoke Consent' },
  ]}
  size='xs'
  w={150}
/>
  </Group>

  <Group grow>
<TextInput
  label='Granter User ID'
  placeholder={currentUser.id}
  value={consentForm.granterUserId}
  onChange={(e) =>
setConsentForm({
  ...consentForm,
  granterUserId: e.target.value,
})
  }
  size='xs'
/>
<TextInput
  label='Requester User ID'
  placeholder={currentUser.id}
  value={consentForm.requesterUserId}
  onChange={(e) =>
setConsentForm({
  ...consentForm,
  requesterUserId: e.target.value,
})
  }
  size='xs'
/>
  </Group>

  {consentForm.action === 'request' && (
<TextInput
  label='Context Name (for request action)'
  placeholder='e.g., Work Colleagues'
  value={consentForm.contextName}
  onChange={(e) =>
setConsentForm({
  ...consentForm,
  contextName: e.target.value,
})
  }
  size='xs'
/>
  )}

  <Group>
<Button
  onClick={testConsentsAPI}
  loading={apiLoading.consents}
  variant='outline'
  size='sm'
>
  Test Consents API
</Button>
<Button
  variant='subtle'
  size='xs'
  onClick={() =>
setConsentForm({
  action: 'request',
  granterUserId: currentUser.id,
  requesterUserId: PERSONAS.jj.id,
  contextName: 'Work Colleagues',
})
  }
>
  Fill with Demo Data
</Button>
  </Group>

  <Text size='sm' c='dimmed'>
Manages consent lifecycle: request, grant, or revoke consent
between users. Demonstrates comprehensive input validation
and business logic.
  </Text>

  {apiResults.consents && (
<Card withBorder bg='gray.0' p='sm'>
  <Group mb='xs'>
<Badge
  color={
(apiResults.consents.status ?? 500) < 400
  ? 'green'
  : 'red'
  }
  variant='filled'
>
  {apiResults.consents.status || 'ERROR'}{' '}
  {apiResults.consents.statusText}
</Badge>
<Text size='xs' c='dimmed'>
  {apiResults.consents.timestamp}
</Text>
  </Group>
  <ScrollArea h={200}>
<JsonInput
  value={JSON.stringify(apiResults.consents, null, 2)}
  readOnly
  minRows={8}
/>
  </ScrollArea>
</Card>
  )}
</Stack>
  </Tabs.Panel>

  <Tabs.Panel value='audit' pt='md'>
<Stack gap='sm'>
  <Group>
<Code>
  GET /api/audit/{currentUser.id.substring(0, 8)}
  ...?limit=10
</Code>
<Button
  onClick={testAuditAPI}
  loading={apiLoading.audit}
  variant='outline'
  size='sm'
>
  Test Audit API
</Button>
  </Group>
  <Text size='sm' c='dimmed'>
Retrieves GDPR-compliant audit log entries with
comprehensive filtering options. Shows the complete audit
trail for transparency and compliance.
  </Text>
  {apiResults.audit && (
<Card withBorder bg='gray.0' p='sm'>
  <Group mb='xs'>
<Badge
  color={
(apiResults.audit.status ?? 500) < 400
  ? 'green'
  : 'red'
  }
  variant='filled'
>
  {apiResults.audit.status || 'ERROR'}{' '}
  {apiResults.audit.statusText}
</Badge>
<Text size='xs' c='dimmed'>
  {apiResults.audit.timestamp}
</Text>
  </Group>
  <ScrollArea h={200}>
<JsonInput
  value={JSON.stringify(apiResults.audit, null, 2)}
  readOnly
  minRows={8}
/>
  </ScrollArea>
</Card>
  )}
</Stack>
  </Tabs.Panel>
</Tabs>

<Divider my='md' />

<Card bg='blue.0' withBorder>
  <Title order={5} mb='xs'>
Academic Demonstration Features
  </Title>
  <Stack gap='xs'>
<Text size='sm'>
  • <strong>REST API Principles</strong>: Proper HTTP methods
  (GET/POST), status codes, and resource URLs
</Text>
<Text size='sm'>
  • <strong>JWT Authentication</strong>: Bearer token validation
  with comprehensive error handling
</Text>
<Text size='sm'>
  • <strong>Input Validation</strong>: Zod schema validation
  with detailed error messages
</Text>
<Text size='sm'>
  • <strong>JSON Request/Response</strong>: Structured API
  communication with metadata
</Text>
<Text size='sm'>
  • <strong>Error Handling</strong>: Proper HTTP status codes
  and academic-quality error responses
</Text>
<Text size='sm'>
  • <strong>Documentation</strong>: Self-documenting endpoints
  with comprehensive logging
</Text>
  </Stack>
</Card>
  </Card>
)}

{!currentUser && (
  <Alert color='yellow' title='API Testing Requires Authentication'>
<Text size='sm'>
  The REST API endpoints require JWT authentication to demonstrate
  secure access patterns. Please sign in to test the interactive API
  functionality.
</Text>
  </Alert>
)}

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
