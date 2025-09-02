import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { randomBytes } from 'crypto';
import {
  Container,
  Paper,
  Title,
  Text,
  Box,
  Center,
  Group,
  Card,
  Badge,
  Divider,
  Alert,
} from '@mantine/core';
import type {
  AppContextAssignment,
  OAuthClientRegistryInfo,
} from '@/app/api/oauth/types';
import type { ContextWithStats } from '@/app/api/contexts/types';
import { createClient } from '@/utils/supabase/server';
import {
  lookupExistingClient,
  createNewClientWithRetry,
} from '@/utils/oauth/registry-service';
import { Logo } from '@/components/branding/Logo';
import { OAuthAuthorizeClient } from '@/components/auth/oauth-authorize/OAuthAuthorizeClient';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AuthorizeParams {
  app_name: string;
  return_url: string;
  state: string;
}

interface PageData {
  client: OAuthClientRegistryInfo;
  contexts: ContextWithStats[];
  existingAssignment: AppContextAssignment | null;
  authorizeParams: AuthorizeParams;
  user: { id: string; email?: string };
}

async function validateAuthorizeParams(searchParams: {
  [key: string]: string | undefined;
}): Promise<AuthorizeParams> {
  const { app_name, return_url, state } = searchParams;

  if (!return_url) {
notFound();
  }

  if (!app_name) {
notFound();
  }

  try {
new URL(return_url);
  } catch {
notFound();
  }

  return {
app_name,
return_url,
state: state || randomBytes(16).toString('hex'),
  };
}

async function fetchOAuthAppData(
  appName: string,
  domain: string,
): Promise<OAuthClientRegistryInfo> {
  const { data: existingClient, error: lookupError } =
await lookupExistingClient(domain, appName);

  if (lookupError) {
throw new Error(`Failed to lookup OAuth client: ${lookupError.message}`);
  }

  if (existingClient) {
return existingClient;
  }

  const requestId = randomBytes(8).toString('hex');
  const { data: newClient, error: createError } =
await createNewClientWithRetry(domain, appName, requestId);

  if (createError || !newClient) {
throw new Error(
  `Failed to create OAuth client: ${createError?.message || 'Unknown error'}`,
);
  }

  return newClient;
}

async function fetchUserContexts(
  supabase: SupabaseClient,
  userId: string,
): Promise<ContextWithStats[]> {
  try {
const { fetchContextsWithStats } = await import('@/utils/server/contexts');

const contextsWithStats = await fetchContextsWithStats(supabase, userId, {
  useAppAssignments: false,
  sortOrder: 'asc',
});

if (!contextsWithStats || contextsWithStats.length === 0) {
  console.log(
`No contexts found for user ${userId} - may be new user with signup trigger still processing`,
  );
  return [];
}

const { filterAvailableContexts } = await import(
  '@/utils/contexts/filtering'
);
const filteredContexts = filterAvailableContexts(contextsWithStats);

if (!filteredContexts || filteredContexts.length === 0) {
  console.log(
`No available contexts found for user ${userId} after OAuth filtering - contexts may be incomplete or restricted`,
  );
}

return filteredContexts || [];
  } catch (error) {
throw new Error(
  `Failed to fetch user contexts: ${error instanceof Error ? error.message : 'Unknown error'}`,
);
  }
}

async function fetchAppAssignment(
  supabase: SupabaseClient,
  userId: string,
  clientId: string,
): Promise<AppContextAssignment | null> {
  const { data: assignment, error } = await supabase
.from('app_context_assignments')
.select('*')
.eq('profile_id', userId)
.eq('client_id', clientId)
.single();

  if (error && error.code !== 'PGRST116') {
throw new Error(`Failed to fetch app assignment: ${error.message}`);
  }

  return assignment || null;
}

async function fetchPageData(searchParams: {
  [key: string]: string | undefined;
}): Promise<PageData> {
  const supabase = await createClient();
  const {
data: { user },
error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
const params = new URLSearchParams(searchParams as Record<string, string>);
const currentUrl = `/auth/oauth-authorize?${params}`;
redirect(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
  }

  const authorizeParams = await validateAuthorizeParams(searchParams);

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost';
  const domain = host.split(':')[0];

  const [client, contexts] = await Promise.all([
fetchOAuthAppData(authorizeParams.app_name, domain),
fetchUserContexts(supabase, user.id),
  ]);

  const existingAssignment = await fetchAppAssignment(
supabase,
user.id,
client.client_id,
  );

  return {
client,
contexts,
existingAssignment,
authorizeParams,
user: {
  id: user.id,
  email: user.email,
},
  };
}

function OAuthAuthorizePageContent({ data }: { data: PageData }) {
  const { client, contexts, existingAssignment, authorizeParams, user } = data;

  return (
<Container maw={600} px='md' py='xl' data-testid='oauth-authorize-page'>
  <Paper shadow='sm' radius='md' p='xl'>
<Center mb='xl'>
  <Box ta='center'>
<Logo size='lg' />
<Title order={1} size='xl' fw={600} c='brand.8' mt='md'>
  Application Authorization
</Title>
  </Box>
</Center>

<Card
  shadow='sm'
  padding='xl'
  radius='md'
  withBorder
  mb='xl'
  data-testid='oauth-app-info'
>
  <Group justify='space-between' mb='md'>
<Text size='xl' fw={600}>
  {client.display_name}
</Text>
<Badge color='green' size='xs'>
  Verified
</Badge>
  </Group>
  <Text c='dimmed' size='sm'>
<strong>{client.display_name}</strong> is requesting permission to
access your name information. You can choose which identity context
to share.
  </Text>
</Card>

<Divider my='xl' />

<Title order={2} size='lg' fw={500} c='gray.8' mb='md'>
  Choose Your Identity
</Title>

<Text size='md' c='dimmed' mb='lg'>
  Signed in as {user.email}. Select which context to share with this
  application.
</Text>

<OAuthAuthorizeClient
  app={client}
  contexts={contexts}
  existingAssignment={existingAssignment || undefined}
  returnUrl={authorizeParams.return_url}
  state={authorizeParams.state}
/>
  </Paper>
</Container>
  );
}

/**
 * OAuth Authorization Page - Server Component
 */
export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;

  try {
const data = await fetchPageData(params);
return <OAuthAuthorizePageContent data={data} />;
  } catch (error) {
if (
  error &&
  typeof error === 'object' &&
  'digest' in error &&
  (error.digest === 'NEXT_REDIRECT' ||
('message' in error && error.message === 'NEXT_REDIRECT'))
) {
  throw error;
}

console.error('OAuth Authorization Page Error:', error);
return (
  <Center p='xl'>
<Alert
  color='red'
  title='Error Loading Authorization Request'
  data-testid='oauth-error-alert'
>
  <Text size='md'>
Failed to load authorization request. Please try again.
  </Text>
  {process.env.NODE_ENV === 'development' && (
<Text size='sm' mt='md' c='dimmed'>
  Debug: {error instanceof Error ? error.message : String(error)}
</Text>
  )}
</Alert>
  </Center>
);
  }
}
