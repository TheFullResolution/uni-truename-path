-- Migration: Dashboard Stats RPC Function
-- Creates a single RPC function to aggregate all dashboard statistics
-- Replaces multiple API queries with a single database call for better performance
-- UPDATED: Uses dynamic JSON aggregation for name types instead of hardcoded categories
-- This makes the function future-proof when new name categories are added to the enum

create or replace function get_dashboard_stats(p_profile_id uuid)
returns json
language plpgsql
security invoker
as $$
declare
result json;
name_stats record;
context_count int;
consent_stats record;
audit_count int;
recent_activity_count int;
api_calls_today int;
privacy_score int;
gdpr_compliant boolean;
today_start timestamp;
begin
-- Set today's start time for activity calculations
today_start := date_trunc('day', now());

-- Aggregate all statistics in optimized queries
with name_aggregates as (
select 
coalesce(sum(type_count), 0)::int as total_names,
-- Dynamic JSON aggregation for name types
coalesce(
json_object_agg(name_type::text, type_count) filter (where name_type is not null),
'{}'::json
) as names_by_type_json,
coalesce(sum(preferred_count), 0) > 0 as has_preferred_name
from (
select 
name_type,
count(*) as type_count,
count(*) filter (where is_preferred = true) as preferred_count
from names 
where user_id = p_profile_id
group by name_type
) type_counts
),
consent_aggregates as (
select 
count(*) filter (where status = 'GRANTED') as active_consents,
count(*) filter (where status = 'PENDING') as pending_requests
from consents 
where granter_user_id = p_profile_id
),
audit_aggregates as (
select 
count(*) as total_audit_entries,
count(*) filter (where accessed_at >= today_start) as api_calls_today_count
from audit_log_entries 
where target_user_id = p_profile_id
),
recent_activity_aggregates as (
select count(*) as recent_activity_count
from audit_log_entries 
where target_user_id = p_profile_id 
  and accessed_at >= (now() - interval '7 days')
)
select 
na.*,
(select count(*) from user_contexts where user_id = p_profile_id) as custom_contexts,
ca.active_consents,
ca.pending_requests,
aa.total_audit_entries,
aa.api_calls_today_count,
raa.recent_activity_count
into 
name_stats
from name_aggregates na
cross join consent_aggregates ca
cross join audit_aggregates aa
cross join recent_activity_aggregates raa;

-- Calculate privacy score using the same algorithm as the original
privacy_score := 50; -- Base score

-- Increase score for having name variants
if name_stats.total_names > 0 then
privacy_score := privacy_score + 20;
end if;

if name_stats.has_preferred_name then
privacy_score := privacy_score + 10;
end if;

-- Increase score for context management
if name_stats.custom_contexts > 0 then
privacy_score := privacy_score + 15;
end if;

-- Increase score for consent management
if name_stats.active_consents > 0 then
privacy_score := privacy_score + 5;
end if;

-- Ensure score is within bounds
privacy_score := least(100, greatest(0, privacy_score));

-- Determine GDPR compliance status
gdpr_compliant := name_stats.total_names > 0 and name_stats.total_audit_entries > 0;

-- Build the result JSON
result := json_build_object(
'name_statistics', json_build_object(
'total_names', name_stats.total_names,
'names_by_type', name_stats.names_by_type_json,
'has_preferred_name', name_stats.has_preferred_name
),
'context_statistics', json_build_object(
'custom_contexts', name_stats.custom_contexts,
'active_consents', name_stats.active_consents,
'pending_consent_requests', name_stats.pending_requests
),
'activity_metrics', json_build_object(
'recent_activity_count', name_stats.recent_activity_count,
'api_calls_today', name_stats.api_calls_today_count,
'total_api_calls', name_stats.total_audit_entries
),
'privacy_metrics', json_build_object(
'privacy_score', privacy_score,
'gdpr_compliance_status', case when gdpr_compliant then 'compliant' else 'needs_attention' end,
'audit_retention_days', 365
)
);

return result;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function get_dashboard_stats(uuid) to authenticated;

-- Add function comment for documentation
comment on function get_dashboard_stats(uuid) is 
'Aggregates all dashboard statistics for a user profile in a single optimized query. 
Returns JSON with name statistics (using dynamic name type aggregation), context statistics, 
activity metrics, and privacy metrics. The names_by_type field automatically includes any 
name categories present in the data, making it future-proof for new enum additions.
Used by the /api/dashboard/stats endpoint for improved performance.';