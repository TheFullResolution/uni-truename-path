import type { QueryData } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

// Query for OAuth dashboard statistics
export const getDashboardStatsQuery = (profileId: string) =>
  createClient().rpc('get_oauth_dashboard_stats', {
p_profile_id: profileId,
  });

export type DashboardStatsRPCResult = QueryData<
  ReturnType<typeof getDashboardStatsQuery>
>;

// Type for the complete dashboard stats response that includes user profile data
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
active_contexts_today: number;
active_contexts_week: number;
  };
  usage_analytics: {
total_applications: number;
applications_today: number;
applications_this_week: number;
total_context_usages: number;
context_usages_today: number;
context_usages_week: number;
top_application_today: string | null;
top_context_today: string | null;
unique_properties_disclosed_week: number;
  };
  performance_metrics: {
avg_response_time_today_ms: number;
avg_response_time_week_ms: number;
success_rate_today_percent: number;
target_response_time_ms: number;
  };
  privacy_metrics: {
privacy_score: number;
gdpr_compliance_status: 'compliant' | 'needs_attention';
audit_retention_days: number;
context_usage_tracked: boolean;
  };
}
