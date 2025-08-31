import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContextWithStats } from '@/app/api/contexts/types';
import { getContextCompletionStatus } from '@/utils/contexts/completeness';

interface FetchContextsOptions {
  /** Use app_context_assignments instead of context_oidc_assignments (for OAuth pages) */
  useAppAssignments?: boolean;
  /** Sort order for contexts */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetches contexts with statistics and completeness data for a user.
 *
 * This is the centralized implementation that eliminates duplication between
 * the /api/contexts route and OAuth authorization page.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch contexts for
 * @param options - Optional configuration for different use cases
 * @returns Promise resolving to array of contexts with stats
 */
export async function fetchContextsWithStats(
  supabase: SupabaseClient,
  userId: string,
  options: FetchContextsOptions = {},
): Promise<ContextWithStats[]> {
  const { useAppAssignments = false, sortOrder = 'desc' } = options;
  // Get contexts
  const { data: contexts } = await supabase
.from('user_contexts')
.select('*')
.eq('user_id', userId)
.order('created_at', { ascending: sortOrder === 'asc' });

  if (!contexts?.length) {
return [];
  }

  const contextIds = contexts.map((c) => c.id);

  // Choose the appropriate OIDC assignments table
  const oidcAssignmentsTable = useAppAssignments
? 'app_context_assignments'
: 'context_oidc_assignments';

  // Batch fetch statistics
  const [{ data: oidcAssignments }, { data: appAssignments }] =
await Promise.all([
  supabase
.from(oidcAssignmentsTable)
.select('context_id, oidc_property')
.in('context_id', contextIds),
  // Always check for app assignments to know if context is in use by apps
  supabase
.from('app_context_assignments')
.select('context_id')
.in('context_id', contextIds),
]);

  // Build statistics maps
  const oidcAssignmentsByContext = new Map<string, string[]>();
  const appAssignmentsByContext = new Set<string>();

  // Group OIDC assignments by context
  oidcAssignments?.forEach((o) => {
if (!oidcAssignmentsByContext.has(o.context_id)) {
  oidcAssignmentsByContext.set(o.context_id, []);
}
oidcAssignmentsByContext.get(o.context_id)!.push(o.oidc_property);
  });

  // Track which contexts have app assignments
  appAssignments?.forEach((a) => appAssignmentsByContext.add(a.context_id));

  // Return contexts with stats and completeness data
  const contextsWithStats: ContextWithStats[] = contexts.map((ctx) => {
const assignedProperties = oidcAssignmentsByContext.get(ctx.id) || [];
const completionInfo = getContextCompletionStatus(assignedProperties);

return {
  ...ctx,
  has_active_consents: appAssignmentsByContext.has(ctx.id), // Now tracks if apps are using this context
  oidc_assignment_count: assignedProperties.length,
  is_complete: completionInfo.status === 'complete',
  missing_properties: [
...completionInfo.missingRequired,
...completionInfo.missingOptional,
  ],
  completion_status: completionInfo.status,
};
  });

  return contextsWithStats;
}
