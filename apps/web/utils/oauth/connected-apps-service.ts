/**
 * OAuth Connected Apps Service
 * University Final Project - TrueNamePath
 *
 * @description Service layer for managing connected OAuth applications
 * @academic_constraint Functions ≤30 lines each
 * @performance <3ms target for all operations
 */

import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import type {
  ConnectedApp,
  AssignmentUpdateServiceResult,
} from '@/types/oauth';

/**
 * Usage statistics aggregated by client ID
 */
interface UsageStatistics {
  client_id: string;
  total_usage_count: number;
}

/**
 * Raw app data from database query
 */
interface RawAppData {
  client_id: string;
  context_id: string;
  user_contexts: { id: string; context_name: string };
  oauth_client_registry: {
client_id: string;
display_name: string;
publisher_domain: string;
last_used_at: string | null;
  } | null;
}

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
 * Get connected apps for user (simplified for academic project)
 * Manual JOIN through service layer for flexibility
 */
export async function getConnectedAppsForUser(profileId: string) {
  const supabase = createServiceClient();

  // Get assignments with contexts (simplified for academic project)
  const { data: assignments, error: assignError } = await supabase
.from('app_context_assignments')
.select(`client_id, context_id, user_contexts!context_id(id, context_name)`)
.eq('profile_id', profileId);

  if (assignError) {
return { data: null, error: assignError };
  }

  if (!assignments || assignments.length === 0) {
return { data: [], error: null };
  }

  // Get client registry info (maintain stable order)
  const clientIds = assignments.map((a) => a.client_id);
  const { data: clients, error: clientError } = await supabase
.from('oauth_client_registry')
.select('client_id, display_name, publisher_domain, last_used_at')
.in('client_id', clientIds);

  if (clientError) {
return { data: null, error: clientError };
  }

  // Combine data manually
  const combinedData = assignments
.map((assignment) => {
  const client = clients?.find((c) => c.client_id === assignment.client_id);
  return {
...assignment,
oauth_client_registry: client || null,
  };
})
.filter((item) => item.oauth_client_registry !== null);

  return { data: combinedData, error: null };
}

/**
 * Helper function to aggregate usage counts by client_id
 */
function aggregateUsageCounts(
  usageData: Array<{ client_id: string }>,
): Record<string, number> {
  return usageData.reduce((acc: Record<string, number>, row) => {
acc[row.client_id] = (acc[row.client_id] || 0) + 1;
return acc;
  }, {});
}

/**
 * Get usage statistics for multiple client IDs
 * Aggregates data from app_usage_log
 */
export async function getUsageStatisticsForApps(
  clientIds: string[],
): Promise<{ data: UsageStatistics[] | null; error: unknown }> {
  if (clientIds.length === 0) {
return { data: [], error: null };
  }

  const supabase = createServiceClient();
  const { data: usageData, error } = await supabase
.from('app_usage_log')
.select('client_id')
.in('client_id', clientIds)
.eq('success', true);

  if (error) {
return { data: null, error };
  }

  const counts = aggregateUsageCounts(usageData);
  const statistics = clientIds.map((clientId) => ({
client_id: clientId,
total_usage_count: counts[clientId] || 0,
  }));

  return { data: statistics, error: null };
}

/**
 * Get active session counts for client IDs
 */
async function getActiveSessionCounts(
  profileId: string,
  clientIds: string[],
): Promise<Record<string, number>> {
  if (clientIds.length === 0) {
return {};
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: sessionData, error } = await supabase
.from('oauth_sessions')
.select('client_id')
.eq('profile_id', profileId)
.in('client_id', clientIds)
.gt('expires_at', now);

  if (error) {
return {};
  }

  return sessionData.reduce((acc: Record<string, number>, row) => {
acc[row.client_id] = (acc[row.client_id] || 0) + 1;
return acc;
  }, {});
}

/**
 * Helper function to create usage lookup map
 */
function createUsageMap(
  usageStats: UsageStatistics[] | null,
): Record<string, number> {
  return (usageStats || []).reduce((acc: Record<string, number>, stat) => {
acc[stat.client_id] = stat.total_usage_count;
return acc;
  }, {});
}

/**
 * Format connected app response consistently
 * Combines registry data with usage statistics and session counts
 */
export async function formatConnectedAppResponse(
  appsData: RawAppData[],
  profileId: string,
): Promise<ConnectedApp[]> {
  if (!appsData || appsData.length === 0) {
return [];
  }

  const clientIds = appsData.map((app) => app.client_id);
  const [{ data: usageStats }, sessionCounts] = await Promise.all([
getUsageStatisticsForApps(clientIds),
getActiveSessionCounts(profileId, clientIds),
  ]);

  const usageMap = createUsageMap(usageStats);
  return appsData
.filter((app) => app.oauth_client_registry !== null)
.map((app) => ({
  client_id: app.client_id,
  display_name: app.oauth_client_registry!.display_name,
  publisher_domain: app.oauth_client_registry!.publisher_domain,
  context_id: app.context_id,
  context_name: app.user_contexts.context_name,
  last_used_at: app.oauth_client_registry!.last_used_at,
  active_sessions: sessionCounts[app.client_id] || 0,
  total_usage_count: usageMap[app.client_id] || 0,
}));
}

/**
 * Update app context assignment for a user
 * Performs UPSERT operation and updates registry usage timestamp
 * @academic_constraint ≤30 lines
 */
export async function updateAppContextAssignment(
  profileId: string,
  clientId: string,
  newContextId: string,
): Promise<AssignmentUpdateServiceResult> {
  const supabase = createServiceClient();

  // UPSERT the context assignment
  const { data: assignment, error: assignError } = await supabase
.from('app_context_assignments')
.upsert(
  { profile_id: profileId, client_id: clientId, context_id: newContextId },
  { onConflict: 'profile_id,client_id' },
)
.select('id, profile_id, client_id, context_id')
.single();

  if (assignError) {
return { data: null, error: assignError };
  }

  // Update last_used_at in oauth_client_registry
  const { error: registryError } = await supabase
.from('oauth_client_registry')
.update({ last_used_at: new Date().toISOString() })
.eq('client_id', clientId);

  if (registryError) {
return { data: null, error: registryError };
  }

  return { data: assignment, error: null };
}
