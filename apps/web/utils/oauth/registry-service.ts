/**
 * OAuth Client Registry Service
 * University Final Project - TrueNamePath
 *
 * @description Centralized OAuth client registry operations with service role client
 * @academic_constraint Functions ≤50 lines each
 * @performance <3ms target for all operations
 */

import { randomBytes } from 'crypto';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Creates service role client for admin operations
 */
function createServiceClient() {
  return createServerClient<Database>(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!,
{
  cookies: {
getAll: () => [],
setAll: () => {},
  },
},
  );
}

/**
 * Generates secure client ID with collision retry
 */
export function generateClientId(): string {
  return `tnp_${randomBytes(8).toString('hex')}`;
}

/**
 * Formats app name to display name (demo-hr -> Demo HR)
 */
function formatAppNameToDisplayName(appName: string): string {
  return appName
.split('-')
.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
.join(' ');
}

/**
 * Lookup existing OAuth client in registry
 */
export async function lookupExistingClient(domain: string, appName: string) {
  const supabase = createServiceClient();

  const { data: existingClient, error } = await supabase
.from('oauth_client_registry')
.select('*')
.eq('publisher_domain', domain)
.eq('app_name', appName)
.single();

  // Return null for "not found" (PGRST116), propagate other errors
  if (error && error.code === 'PGRST116') {
return { data: null, error: null };
  }

  return { data: existingClient, error };
}

/**
 * Update client last_used_at timestamp
 */
export async function updateClientUsage(clientId: string) {
  const supabase = createServiceClient();

  return await supabase
.from('oauth_client_registry')
.update({ last_used_at: new Date().toISOString() })
.eq('client_id', clientId);
}

/**
 * Create new OAuth client with collision retry
 */
export async function createNewClientWithRetry(
  domain: string,
  appName: string,
  requestId: string,
) {
  const supabase = createServiceClient();
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
const clientId = generateClientId();
const displayName = formatAppNameToDisplayName(appName);

const { data: newClient, error } = await supabase
  .from('oauth_client_registry')
  .insert({
client_id: clientId,
display_name: displayName,
app_name: appName,
publisher_domain: domain,
  })
  .select()
  .single();

if (!error && newClient) {
  return { data: newClient, error: null };
}

// If collision detected and retries available, continue
if (error?.code === '23505' && attempt < maxRetries) {
  console.warn(
`[${requestId}] Client ID collision on attempt ${attempt}, retrying...`,
  );
  continue;
}

// Final attempt failed or other error
return { data: null, error };
  }

  return { data: null, error: new Error('Max retries exceeded') };
}
