import type { Database } from '@/generated/database';

// RPC function response type - uses generated database types
export type DashboardStatsRPC =
  Database['public']['Functions']['get_dashboard_stats']['Returns'];

// Full dashboard response type (includes user profile data)
export interface DashboardStatsResponse {
  user_profile: {
email: string;
profile_id: string;
member_since: string;
  };
  name_statistics: {
total_names: number;
names_by_type: Record<string, number>;
has_preferred_name: boolean;
  };
  context_statistics: {
custom_contexts: number;
active_consents: number;
pending_consent_requests: number;
  };
  activity_metrics: {
recent_activity_count: number;
api_calls_today: number;
total_api_calls: number;
  };
  privacy_metrics: {
privacy_score: number;
gdpr_compliance_status: 'compliant' | 'needs_attention';
audit_retention_days: number;
  };
}
