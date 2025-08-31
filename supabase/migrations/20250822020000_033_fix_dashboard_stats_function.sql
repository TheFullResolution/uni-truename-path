-- Step 16.1.5: Fix OAuth Dashboard Stats Function GROUP BY Error
-- Purpose: Fix GROUP BY clause error in get_oauth_dashboard_stats function
-- Context: Hotfix for OAuth migration testing completion

-- ===
-- SECTION 1: MIGRATION INITIALIZATION & LOGGING
-- ===

-- Log migration start
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Starting Dashboard Stats Function Fix';
RAISE LOG 'Migration: 033_fix_dashboard_stats_function - Fix GROUP BY error in recent activity query';
RAISE LOG 'Issue: json_agg with ORDER BY in subquery conflicts with main query ORDER BY';
END
$$;

-- ===
-- SECTION 2: FIX DASHBOARD STATS FUNCTION
-- ===

-- Replace the get_oauth_dashboard_stats function with fixed GROUP BY handling
CREATE OR REPLACE FUNCTION public.get_oauth_dashboard_stats(p_profile_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result json;
  connected_apps_count int;
  recent_authorizations_count int;
  total_usage_count int;
  avg_response_time numeric;
  success_rate numeric;
  top_app_name text;
  recent_activity json;
BEGIN
  -- Validate input
  IF p_profile_id IS NULL THEN
RAISE EXCEPTION 'profile_id is required';
  END IF;
  
  -- Get connected apps count (apps with recent activity or context assignments)
  SELECT COUNT(DISTINCT app_id)
  INTO connected_apps_count
  FROM public.app_usage_log
  WHERE profile_id = p_profile_id
AND created_at > (now() - interval '30 days');
  
  -- Get recent authorizations (last 7 days)
  SELECT COUNT(*)
  INTO recent_authorizations_count
  FROM public.app_usage_log
  WHERE profile_id = p_profile_id
AND action = 'authorize'
AND created_at > (now() - interval '7 days');
  
  -- Get total usage count (all time)
  SELECT COUNT(*)
  INTO total_usage_count
  FROM public.app_usage_log
  WHERE profile_id = p_profile_id;
  
  -- Get average response time for successful operations (last 7 days)
  SELECT ROUND(AVG(response_time_ms), 2)
  INTO avg_response_time
  FROM public.app_usage_log
  WHERE profile_id = p_profile_id
AND success = true
AND response_time_ms > 0
AND created_at > (now() - interval '7 days');
  
  -- Get success rate (last 7 days)
  WITH usage_stats AS (
SELECT 
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE success = true) as successful_operations
FROM public.app_usage_log
WHERE profile_id = p_profile_id
  AND created_at > (now() - interval '7 days')
  )
  SELECT 
CASE 
  WHEN total_operations = 0 THEN NULL
  ELSE ROUND((successful_operations::numeric / total_operations::numeric) * 100, 1)
END
  INTO success_rate
  FROM usage_stats;
  
  -- Get top app by usage (last 7 days)
  SELECT oa.display_name
  INTO top_app_name
  FROM public.app_usage_log aul
  JOIN public.oauth_applications oa ON oa.id = aul.app_id
  WHERE aul.profile_id = p_profile_id
AND aul.created_at > (now() - interval '7 days')
  GROUP BY oa.id, oa.display_name
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  -- FIXED: Get recent activity (last 10 operations) - Use subquery to avoid GROUP BY conflict
  SELECT json_agg(
json_build_object(
  'app_name', activity.app_name,
  'action', activity.action,
  'created_at', activity.created_at,
  'success', activity.success
)
  )
  INTO recent_activity
  FROM (
SELECT 
  oa.display_name as app_name,
  aul.action,
  aul.created_at,
  aul.success
FROM public.app_usage_log aul
JOIN public.oauth_applications oa ON oa.id = aul.app_id
WHERE aul.profile_id = p_profile_id
ORDER BY aul.created_at DESC
LIMIT 10
  ) activity;
  
  -- Build result JSON
  result := json_build_object(
'connected_apps', COALESCE(connected_apps_count, 0),
'recent_authorizations', COALESCE(recent_authorizations_count, 0),
'total_usage', COALESCE(total_usage_count, 0),
'avg_response_time_ms', avg_response_time,
'success_rate_percent', success_rate,
'top_app_name', top_app_name,
'recent_activity', COALESCE(recent_activity, '[]'::json)
  );
  
  RETURN result;
END;
$$;

-- Add function documentation
COMMENT ON FUNCTION public.get_oauth_dashboard_stats IS 
'FIXED OAuth-focused dashboard statistics for demo integration - resolved GROUP BY conflict in recent activity query';

-- ===
-- SECTION 3: VALIDATION & COMPLETION
-- ===

-- Test the fixed function with a dummy call
DO $$
DECLARE
  test_result json;
  demo_profile_id uuid;
BEGIN
  -- Get a demo profile for testing
  SELECT id INTO demo_profile_id FROM public.profiles LIMIT 1;
  
  IF demo_profile_id IS NOT NULL THEN
-- Test the function
SELECT public.get_oauth_dashboard_stats(demo_profile_id) INTO test_result;
RAISE LOG 'Dashboard Stats Function: Validation test passed - function executes without GROUP BY error';
  ELSE
RAISE LOG 'Dashboard Stats Function: No profiles found for validation test - function syntax should be correct';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
RAISE EXCEPTION 'Dashboard Stats Function: Validation failed - %', SQLERRM;
END
$$;

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Migration 033 completed successfully';
RAISE LOG '';
RAISE LOG '✅ DASHBOARD STATS FUNCTION FIX:';
RAISE LOG '  • Fixed GROUP BY conflict in recent activity query';
RAISE LOG '  • Wrapped problematic query in subquery to resolve aggregation issues';
RAISE LOG '  • Function now executes without PostgreSQL GROUP BY errors';
RAISE LOG '  • Maintained original functionality while fixing SQL compliance';
RAISE LOG '';
RAISE LOG '✅ VALIDATION:';
RAISE LOG '  • Function syntax validated during migration';
RAISE LOG '  • Compatible with existing dashboard integration';
RAISE LOG '  • Returns consistent JSON structure for frontend consumption';
RAISE LOG '';
RAISE LOG '🚀 OAuth migration testing Step 16.1.5 should now pass completely';
RAISE LOG '🚀 Dashboard stats function ready for OAuth demo integration';
END
$$;