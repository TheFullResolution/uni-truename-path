import type { QueryData } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import type { Enums } from '@/generated/database';

// Use generated database types for reference
export type AuditAction = Enums<'audit_action'>;

// Query for audit log entries
export const getAuditLogQuery = (profileId: string, limit = 50) =>
  createClient().rpc('get_user_audit_log', {
p_user_id: profileId,
p_limit: limit,
  });

export type AuditLogQueryResult = QueryData<
  ReturnType<typeof getAuditLogQuery>
>;

// Extract the individual entry type from the RPC result
export type AuditLogEntry = AuditLogQueryResult extends (infer T)[] ? T : never;

export interface AuditFilters {
  limit?: number;
  action?: AuditAction;
  date_from?: string;
  date_to?: string;
  context_name?: string;
}

export interface AuditLogResponseData {
  entries: AuditLogEntry[];
  total: number;
  profile_id: string;
  filters: {
limit?: number;
action?: AuditAction;
date_from?: string;
date_to?: string;
  };
  metadata: {
retrieved_at: string;
request_id: string;
total_entries: number;
filtered_entries: number;
  };
}
