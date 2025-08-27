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

// OAuth activity record type
export interface OAuthActivityRecord {
  app_name: string;
  action: string;
  created_at: string;
  success: boolean;
}

// Type for the complete dashboard stats response (OAuth-focused architecture)
export interface DashboardStatsResponse {
  user_profile: {
email: string;
profile_id: string;
member_since: string;
  };
  oauth_metrics: {
connected_apps: number;
recent_authorizations: number;
total_usage: number;
avg_response_time_ms: number | null;
success_rate_percent: number | null;
top_app_name: string | null;
recent_activity: OAuthActivityRecord[];
  };
}
