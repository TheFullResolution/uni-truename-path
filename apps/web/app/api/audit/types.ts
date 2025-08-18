import type { QueryData } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import type { AuditAction } from '@/types/database';

// Query for audit log entries
export const getAuditLogQuery = (profileId: string, limit = 50) =>
  createClient().rpc('get_user_audit_log', {
p_user_id: profileId,
p_limit: limit,
  });

export type AuditLogQueryResult = QueryData<
  ReturnType<typeof getAuditLogQuery>
>;

// Extract the individual entry type from the array result
export type AuditLogEntry = AuditLogQueryResult extends (infer T)[] ? T : never;

export interface AuditFilters {
  limit?: number;
  action?: AuditAction;
  // Support both naming conventions for backward compatibility
  startDate?: string; // @deprecated - use date_from instead
  endDate?: string; // @deprecated - use date_to instead
  date_from?: string; // Preferred snake_case format
  date_to?: string; // Preferred snake_case format
  context_name?: string;
}

export interface AuditLogResponseData {
  entries: AuditLogEntry[];
  total: number;
  profile_id: string;
  filters: {
limit?: number;
action?: AuditAction;
date_from?: string; // Always use snake_case in responses
date_to?: string; // Always use snake_case in responses
  };
  metadata: {
retrieved_at: string;
request_id: string;
total_entries: number;
filtered_entries: number;
  };
}
