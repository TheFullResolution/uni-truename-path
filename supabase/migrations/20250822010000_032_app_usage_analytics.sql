-- Step 16.1.4: OAuth Analytics Infrastructure Replacement
-- Purpose: Replace broken context_usage_analytics with OAuth-focused app_usage_log system
-- Context: Part of Step 16 OAuth integration system - enables real dashboard analytics

-- ===
-- SECTION 1: MIGRATION INITIALIZATION & LOGGING
-- ===

-- Log migration start
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Starting Analytics Infrastructure Replacement';
RAISE LOG 'Migration: 032_app_usage_analytics - Replace broken analytics with OAuth-focused system';
RAISE LOG 'Action: Dropping over-engineered context_usage_analytics, creating simplified app_usage_log';
RAISE LOG 'Performance Target: <3ms analytics queries for dashboard integration';
END
$$;

-- ===
-- SECTION 2: BACKUP AND REMOVE OLD ANALYTICS SYSTEM
-- ===

-- Backup existing analytics data (if any valuable data exists)
-- This allows rollback if needed during development
DO $$
DECLARE
record_count int;
BEGIN
-- Check if we have any data worth preserving
SELECT COUNT(*) INTO record_count FROM public.context_usage_analytics;

IF record_count > 0 THEN
-- Create backup table for potential data migration
CREATE TABLE IF NOT EXISTS public.context_usage_analytics_backup AS 
SELECT * FROM public.context_usage_analytics WHERE false; -- Structure only initially

-- Backup data if exists
INSERT INTO public.context_usage_analytics_backup 
SELECT * FROM public.context_usage_analytics;

RAISE LOG 'Analytics Migration: Backed up % existing records from context_usage_analytics', record_count;
ELSE
RAISE LOG 'Analytics Migration: No existing analytics data to backup';
END IF;
END
$$;

-- Drop old analytics infrastructure
-- Order matters: functions first, then tables, then types

-- Drop old analytics functions
DROP FUNCTION IF EXISTS public.log_context_usage(
uuid, uuid, varchar(100), varchar(50), text[], jsonb, 
integer, boolean, varchar(50), inet, text, varchar(100), jsonb
) CASCADE;

DROP FUNCTION IF EXISTS public.get_dashboard_stats(uuid) CASCADE;

-- Drop old analytics table and all its dependencies
DROP TABLE IF EXISTS public.context_usage_analytics CASCADE;

-- Drop backup table if it was created empty (cleanup)
DO $$
DECLARE
backup_count int;
BEGIN
SELECT COUNT(*) INTO backup_count FROM public.context_usage_analytics_backup;
IF backup_count = 0 THEN
DROP TABLE IF EXISTS public.context_usage_analytics_backup;
RAISE LOG 'Analytics Migration: Removed empty backup table';
ELSE
RAISE LOG 'Analytics Migration: Preserved backup table with % records', backup_count;
END IF;
EXCEPTION
WHEN undefined_table THEN
-- Backup table doesn't exist, that's fine
NULL;
END
$$;

DO $$
BEGIN
  RAISE LOG '✅ Analytics Migration: Removed old context_usage_analytics system';
END
$$;

-- ===
-- SECTION 3: CREATE NEW OAuth-FOCUSED ANALYTICS SYSTEM
-- ===

-- Create the OAuth app usage log table for simplified analytics
-- This table tracks OAuth application usage with focus on demo scenarios
CREATE TABLE public.app_usage_log (
  -- Primary identifier (bigserial for performance in high-volume logging)
  id bigserial PRIMARY KEY,
  
  -- Foreign key to profiles table (consistent with OAuth tables pattern)
  -- CASCADE delete ensures logs are cleaned up when user is deleted
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Foreign key to OAuth application registration
  -- CASCADE delete ensures logs are cleaned up when app is deleted
  app_id uuid NOT NULL REFERENCES public.oauth_applications(id) ON DELETE CASCADE,
  
  -- Optional foreign key to OAuth session for token-based operations
  -- SET NULL on delete allows keeping usage history even after session expires
  -- Note: This will be a plain UUID field until oauth_sessions table is created in migration 030
  session_id uuid,
  
  -- Action type for OAuth operations tracking
  -- 'authorize' - User authorized app access
  -- 'resolve' - App resolved OIDC claims  
  -- 'revoke' - User revoked app access
  -- 'assign_context' - User changed app's context assignment
  action varchar(50) NOT NULL CHECK (action IN ('authorize', 'resolve', 'revoke', 'assign_context')),
  
  -- Optional context used for this operation
  -- NULL for operations not context-specific (like revocation)
  context_id uuid REFERENCES public.user_contexts(id) ON DELETE SET NULL,
  
  -- Performance tracking for <3ms requirement
  response_time_ms integer DEFAULT 0 CHECK (response_time_ms >= 0),
  
  -- Success tracking for reliability metrics
  success boolean NOT NULL DEFAULT true,
  
  -- Error categorization for failure analysis
  error_type varchar(50) CHECK (error_type IN ('authorization_denied', 'invalid_token', 'context_missing', 'server_error', 'rate_limited')),
  
  -- Timestamp for analytics and cleanup
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add comprehensive table and column comments for maintenance
COMMENT ON TABLE public.app_usage_log IS 'OAuth application usage analytics for demo integration and dashboard metrics';
COMMENT ON COLUMN public.app_usage_log.profile_id IS 'User who performed the OAuth operation';
COMMENT ON COLUMN public.app_usage_log.app_id IS 'OAuth application involved in the operation';
COMMENT ON COLUMN public.app_usage_log.session_id IS 'OAuth session token used (if applicable) - FK constraint will be added when oauth_sessions table exists';
COMMENT ON COLUMN public.app_usage_log.action IS 'Type of OAuth operation: authorize, resolve, revoke, assign_context';
COMMENT ON COLUMN public.app_usage_log.context_id IS 'User context used for name resolution (if applicable)';
COMMENT ON COLUMN public.app_usage_log.response_time_ms IS 'Operation response time in milliseconds for performance monitoring';

-- ===
-- SECTION 4: CREATE PERFORMANCE INDEXES
-- ===

-- Primary dashboard query index: user's recent activity
CREATE INDEX idx_app_usage_log_profile_time 
  ON public.app_usage_log (profile_id, created_at DESC);

-- App analytics index: application usage patterns
CREATE INDEX idx_app_usage_log_app_time 
  ON public.app_usage_log (app_id, created_at DESC);

-- Session tracking index: token usage analysis
CREATE INDEX idx_app_usage_log_session 
  ON public.app_usage_log (session_id) 
  WHERE session_id IS NOT NULL;

-- Action-specific analytics index: operation type analysis
CREATE INDEX idx_app_usage_log_action_time 
  ON public.app_usage_log (action, created_at DESC);

-- Performance monitoring index: response time analysis for successful operations
CREATE INDEX idx_app_usage_log_performance 
  ON public.app_usage_log (response_time_ms, created_at DESC) 
  WHERE success = true AND response_time_ms > 0;

-- Context usage index: context-specific analytics
CREATE INDEX idx_app_usage_log_context_time 
  ON public.app_usage_log (context_id, created_at DESC) 
  WHERE context_id IS NOT NULL;

DO $$
BEGIN
  RAISE LOG '✅ Analytics Migration: Created app_usage_log table with 6 performance indexes';
END
$$;

-- ===
-- SECTION 5: IMPLEMENT ROW LEVEL SECURITY
-- ===

-- Enable RLS for privacy compliance
ALTER TABLE public.app_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage logs
CREATE POLICY "users_view_own_usage" ON public.app_usage_log
  FOR SELECT 
  USING (profile_id = auth.uid());

-- Service role can manage all logs for system operations and analytics
CREATE POLICY "service_log_usage" ON public.app_usage_log
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Grant appropriate permissions
GRANT SELECT ON public.app_usage_log TO authenticated;
GRANT ALL ON public.app_usage_log TO service_role;

-- Grant sequence permissions for inserts
GRANT USAGE ON SEQUENCE public.app_usage_log_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.app_usage_log_id_seq TO service_role;

DO $$
BEGIN
  RAISE LOG '✅ Analytics Migration: Implemented RLS policies and permissions';
END
$$;

-- ===
-- SECTION 6: CREATE HELPER FUNCTIONS
-- ===

-- Simplified OAuth usage logging function
-- Replaces complex 13-parameter log_context_usage with 7 focused parameters
CREATE OR REPLACE FUNCTION public.log_app_usage(
  p_profile_id uuid,
  p_app_id uuid,
  p_action varchar(50),
  p_context_id uuid DEFAULT NULL,
  p_session_id uuid DEFAULT NULL,
  p_response_time_ms integer DEFAULT 0,
  p_success boolean DEFAULT true,
  p_error_type varchar(50) DEFAULT NULL
) RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  log_id bigint;
BEGIN
  -- Validate required parameters
  IF p_profile_id IS NULL OR p_app_id IS NULL OR p_action IS NULL THEN
RAISE EXCEPTION 'profile_id, app_id, and action are required parameters';
  END IF;
  
  -- Insert usage log record
  INSERT INTO public.app_usage_log (
profile_id,
app_id,
session_id,
action,
context_id,
response_time_ms,
success,
error_type
  ) VALUES (
p_profile_id,
p_app_id,
p_session_id,
p_action,
p_context_id,
p_response_time_ms,
p_success,
p_error_type
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Grant execute permission to log OAuth usage
GRANT EXECUTE ON FUNCTION public.log_app_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_app_usage TO service_role;

COMMENT ON FUNCTION public.log_app_usage IS 
'Simplified OAuth usage logging for app_usage_log table - replaces complex log_context_usage';

-- ===
-- SECTION 7: CREATE DASHBOARD ANALYTICS FUNCTION
-- ===

-- OAuth-focused dashboard statistics function
-- Replaces complex get_dashboard_stats with simplified OAuth metrics
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
  
  -- Get recent activity (last 10 operations)
  SELECT json_agg(
json_build_object(
  'app_name', oa.display_name,
  'action', aul.action,
  'created_at', aul.created_at,
  'success', aul.success
) ORDER BY aul.created_at DESC
  )
  INTO recent_activity
  FROM public.app_usage_log aul
  JOIN public.oauth_applications oa ON oa.id = aul.app_id
  WHERE aul.profile_id = p_profile_id
  ORDER BY aul.created_at DESC
  LIMIT 10;
  
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

-- Grant execute permission for dashboard stats
GRANT EXECUTE ON FUNCTION public.get_oauth_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_oauth_dashboard_stats TO service_role;

COMMENT ON FUNCTION public.get_oauth_dashboard_stats IS 
'OAuth-focused dashboard statistics for demo integration - replaces complex get_dashboard_stats';

DO $$
BEGIN
  RAISE LOG '✅ Analytics Migration: Created OAuth dashboard stats function';
END
$$;

-- ===
-- SECTION 8: CREATE CLEANUP AND MAINTENANCE FUNCTIONS
-- ===

-- Cleanup function for old app usage logs
-- Removes logs older than specified days to manage storage
CREATE OR REPLACE FUNCTION public.cleanup_old_app_logs(days_to_keep integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Validate input
  IF days_to_keep < 1 THEN
RAISE EXCEPTION 'days_to_keep must be at least 1';
  END IF;
  
  -- Delete old logs
  DELETE FROM public.app_usage_log
  WHERE created_at < (now() - (days_to_keep || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE LOG 'App Usage Cleanup: Removed % log entries older than % days', deleted_count, days_to_keep;
  
  RETURN deleted_count;
END;
$$;

-- Grant execute permission for cleanup (service role only for security)
GRANT EXECUTE ON FUNCTION public.cleanup_old_app_logs TO service_role;

COMMENT ON FUNCTION public.cleanup_old_app_logs IS 
'Cleanup function to remove old app usage logs for storage management';

-- ===
-- SECTION 9: CREATE ANALYTICS VIEWS
-- ===

-- Daily app usage summary view
CREATE VIEW public.oauth_app_daily_stats AS
SELECT 
  aul.app_id,
  oa.display_name as app_name,
  DATE(aul.created_at) as usage_date,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE aul.success = true) as successful_operations,
  COUNT(DISTINCT aul.profile_id) as unique_users,
  ROUND(AVG(aul.response_time_ms) FILTER (WHERE aul.response_time_ms > 0), 2) as avg_response_time_ms,
  COUNT(*) FILTER (WHERE aul.action = 'authorize') as authorizations,
  COUNT(*) FILTER (WHERE aul.action = 'resolve') as resolutions,
  COUNT(*) FILTER (WHERE aul.action = 'revoke') as revocations
FROM public.app_usage_log aul
JOIN public.oauth_applications oa ON oa.id = aul.app_id
GROUP BY aul.app_id, oa.display_name, DATE(aul.created_at)
ORDER BY usage_date DESC, app_name;

COMMENT ON VIEW public.oauth_app_daily_stats IS 
'Daily summary of OAuth application usage for analytics dashboard';

-- User activity summary view
CREATE VIEW public.oauth_user_activity_summary AS
SELECT 
  aul.profile_id,
  p.email as user_email,
  COUNT(DISTINCT aul.app_id) as connected_apps_count,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE aul.success = true) as successful_operations,
  ROUND(AVG(aul.response_time_ms) FILTER (WHERE aul.response_time_ms > 0), 2) as avg_response_time_ms,
  MAX(aul.created_at) as last_activity,
  COUNT(*) FILTER (WHERE aul.created_at > now() - interval '7 days') as operations_last_week
FROM public.app_usage_log aul
JOIN public.profiles p ON p.id = aul.profile_id
GROUP BY aul.profile_id, p.email
ORDER BY last_activity DESC;

COMMENT ON VIEW public.oauth_user_activity_summary IS 
'User-level OAuth activity summary for user analytics';

-- Grant view permissions
GRANT SELECT ON public.oauth_app_daily_stats TO authenticated;
GRANT SELECT ON public.oauth_user_activity_summary TO authenticated;
GRANT ALL ON public.oauth_app_daily_stats TO service_role;
GRANT ALL ON public.oauth_user_activity_summary TO service_role;

DO $$
BEGIN
  RAISE LOG '✅ Analytics Migration: Created analytics views for dashboard integration';
END
$$;

-- ===
-- SECTION 10: SEED DEMO DATA (Optional)
-- ===

-- Create some demo analytics data for development and testing
-- This will be replaced by real data from OAuth operations
DO $$
DECLARE
  demo_profile_id uuid;
  hr_app_id uuid;
  chat_app_id uuid;
  professional_context_id uuid;
  session_uuid uuid;
BEGIN
  -- Only create demo data if we have demo applications
  SELECT id INTO hr_app_id FROM public.oauth_applications WHERE app_name = 'demo-hr' LIMIT 1;
  SELECT id INTO chat_app_id FROM public.oauth_applications WHERE app_name = 'demo-chat' LIMIT 1;
  
  IF hr_app_id IS NOT NULL OR chat_app_id IS NOT NULL THEN
-- Find a demo profile (if exists)
SELECT id INTO demo_profile_id FROM public.profiles LIMIT 1;

IF demo_profile_id IS NOT NULL THEN
  -- Find a context (if exists)
  SELECT id INTO professional_context_id FROM public.user_contexts 
  WHERE user_id = demo_profile_id LIMIT 1;
  
  -- Generate a demo session UUID
  session_uuid := gen_random_uuid();
  
  -- Create demo usage logs for HR app (if exists)
  IF hr_app_id IS NOT NULL THEN
INSERT INTO public.app_usage_log (profile_id, app_id, session_id, action, context_id, response_time_ms, success, created_at) VALUES
(demo_profile_id, hr_app_id, session_uuid, 'authorize', professional_context_id, 45, true, now() - interval '2 days'),
(demo_profile_id, hr_app_id, session_uuid, 'resolve', professional_context_id, 12, true, now() - interval '2 days'),
(demo_profile_id, hr_app_id, session_uuid, 'resolve', professional_context_id, 8, true, now() - interval '1 day'),
(demo_profile_id, hr_app_id, NULL, 'assign_context', professional_context_id, 25, true, now() - interval '1 day');
  END IF;
  
  -- Create demo usage logs for Chat app (if exists)
  IF chat_app_id IS NOT NULL THEN
INSERT INTO public.app_usage_log (profile_id, app_id, action, response_time_ms, success, created_at) VALUES
(demo_profile_id, chat_app_id, 'authorize', 38, true, now() - interval '3 days'),
(demo_profile_id, chat_app_id, 'resolve', 15, true, now() - interval '3 days'),
(demo_profile_id, chat_app_id, 'resolve', 7, true, now() - interval '2 hours');
  END IF;
  
  RAISE LOG 'Analytics Migration: Created demo usage data for development';
END IF;
  ELSE
RAISE LOG 'Analytics Migration: No demo apps found, skipping demo data creation';
  END IF;
END
$$;

-- ===
-- SECTION 11: MIGRATION COMPLETION
-- ===

DO $$
BEGIN
  RAISE LOG '✅ OAuth Analytics Infrastructure: Successfully replaced context_usage_analytics with app_usage_log';
  RAISE LOG '✅ OAuth Analytics Infrastructure: Created simplified 7-parameter logging function';
  RAISE LOG '✅ OAuth Analytics Infrastructure: Created OAuth-focused dashboard stats function';
  RAISE LOG '✅ OAuth Analytics Infrastructure: Implemented performance indexes for <3ms queries';
  RAISE LOG '✅ OAuth Analytics Infrastructure: Added RLS policies for privacy compliance';
  RAISE LOG '✅ OAuth Analytics Infrastructure: Created analytics views for dashboard integration';
  RAISE LOG '📊 Ready for OAuth demo integration with functional dashboard analytics';
  RAISE LOG '🔧 Next: Update dashboard API to use get_oauth_dashboard_stats function';
END $$;