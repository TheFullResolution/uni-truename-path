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
  Alert,
  Badge,
} from '@mantine/core';
import { IconShield, IconExternalLink } from '@tabler/icons-react';
import type {
  AppContextAssignment,
  OAuthClientRegistryInfo,
} from '@/app/api/oauth/types';
import type { UserContext } from '@/types/database';
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
  contexts: UserContext[];
  existingAssignment: AppContextAssignment | null;
  authorizeParams: AuthorizeParams;
  user: { id: string; email?: string };
}

/**
 * Server-side data fetching functions
 */
async function validateAuthorizeParams(searchParams: {
  [key: string]: string | undefined;
}): Promise<AuthorizeParams> {
  const { app_name, return_url, state } = searchParams;

  // Basic required parameter checks
  if (!return_url) {
notFound();
  }

  if (!app_name) {
notFound();
  }

  // Basic URL validation
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
  // Check for existing client using service role
  const { data: existingClient, error: lookupError } =
await lookupExistingClient(domain, appName);

  if (lookupError) {
throw new Error(`Failed to lookup OAuth client: ${lookupError.message}`);
  }

  if (existingClient) {
return existingClient;
  }

  // Create new client using service role with retry logic
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
): Promise<UserContext[]> {
  const { data: contexts, error } = await supabase
.from('user_contexts')
.select('*')
.eq('user_id', userId)
.order('created_at', { ascending: true });

  if (error) {
throw new Error(`Failed to fetch user contexts: ${error.message}`);
  }

  return contexts || [];
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

/**
 * Main page data fetching function
 */
async function fetchPageData(searchParams: {
  [key: string]: string | undefined;
}): Promise<PageData> {
  // Server-side authentication check
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

  // Validate parameters
  const authorizeParams = await validateAuthorizeParams(searchParams);

  // Get host from headers for domain extraction
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost';
  const domain = host.split(':')[0];

  // Parallel data fetching
  const [client, contexts] = await Promise.all([
fetchOAuthAppData(authorizeParams.app_name, domain),
fetchUserContexts(supabase, user.id),
  ]);

  // Fetch existing assignment after we have the client ID
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

/**
 * Page content component with pre-fetched data
 */
function OAuthAuthorizePageContent({ data }: { data: PageData }) {
  const { client, contexts, existingAssignment, authorizeParams, user } = data;

  return (
<Container size='lg' py='xl' data-testid='oauth-authorize-page'>
  <Paper
shadow='lg'
radius='lg'
p='xl'
style={{ backgroundColor: 'white' }}
  >
{/* Simple header */}
<Center mb='xl'>
  <Box style={{ textAlign: 'center' }}>
<Logo size='lg' />
<Title order={1} size='h2' fw={600} c='brand.8' mt='md'>
  TrueNamePath Authorization
</Title>
  </Box>
</Center>

{/* Simple content layout */}
<Box>
  <Group gap='xs' mb='lg'>
<IconExternalLink size={20} color='#4A7FE7' />
<Title order={2} c='gray.8'>
  Application Details
</Title>
  </Group>

  {/* App info */}
  <Box
style={{
  backgroundColor: 'white',
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  padding: '16px',
}}
mb='lg'
  >
<Text fw={600} size='lg' c='gray.8' mb='xs'>
  {client.display_name}
</Text>
<Text size='sm' c='gray.6'>
  {client.app_name}
</Text>
  </Box>

  {/* Security notice with domain display */}
  <Alert
icon={<IconShield size={16} />}
title='Security Notice'
color='yellow'
variant='light'
mb='md'
  >
<Box>
  <Text component='span' size='sm' fw={500}>
Application published by:{' '}
  </Text>
  <Badge color='blue' component='span'>
{client.publisher_domain}
  </Badge>
</Box>
<Text size='xs' c='dimmed'>
  Only authorize if you trust this domain.
</Text>
  </Alert>

  <Alert
icon={<IconShield size={16} />}
title='Privacy Notice'
color='blue'
variant='light'
mb='md'
  >
<Text size='xs'>
  This application will only receive the names you authorize.
</Text>
  </Alert>

  <Title order={2} c='gray.8' mb='md' mt='xl'>
Authorize Access
  </Title>

  <Text size='sm' c='gray.7' mb='md'>
{user.email} - Grant this application access to your names?
  </Text>

  {/* Simple assignment status */}
  {existingAssignment && (
<Alert
  icon={<IconShield size={16} />}
  title='Previously Authorized'
  color='green'
  variant='light'
  mb='lg'
>
  <Text size='sm'>
This application already has access to your names.
  </Text>
</Alert>
  )}

  {/* Simple context count */}
  <Text size='sm' fw={500} c='gray.8' mb='lg'>
Available Contexts: {contexts.length}
  </Text>

  {/* Authorization Form */}
  <OAuthAuthorizeClient
app={client}
contexts={contexts}
existingAssignment={existingAssignment || undefined}
returnUrl={authorizeParams.return_url}
state={authorizeParams.state}
  />
</Box>
  </Paper>
</Container>
  );
}

/**
 * OAuth Authorization Page - Server Component
 * Handles OAuth authorization requests with server-side rendering
 */
export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // Await searchParams and fetch all page data server-side
  // Note: Don't wrap in try-catch because redirect() needs to throw to work
  const params = await searchParams;

  try {
const data = await fetchPageData(params);
// Render page with pre-fetched data
return <OAuthAuthorizePageContent data={data} />;
  } catch (error) {
// Don't catch redirect errors - let them bubble up
if (
  error &&
  typeof error === 'object' &&
  'digest' in error &&
  (error.digest === 'NEXT_REDIRECT' ||
('message' in error && error.message === 'NEXT_REDIRECT'))
) {
  throw error;
}

// Handle other server-side errors
console.error('OAuth Authorization Page Error:', error);
return (
  <Center p='xl'>
<Alert
  color='red'
  title='Error Loading Authorization Request'
  data-testid='oauth-error-alert'
>
  <Text size='sm'>
Failed to load authorization request. Please try again.
  </Text>
  {process.env.NODE_ENV === 'development' && (
<Text size='xs' mt='sm' c='dimmed'>
  Debug: {error instanceof Error ? error.message : String(error)}
</Text>
  )}
</Alert>
  </Center>
);
  }
}
