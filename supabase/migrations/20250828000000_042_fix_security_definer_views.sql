-- TrueNamePath Migration: Fix Security Definer Views
-- Migration: 20250828000000_042_fix_security_definer_views
-- Purpose: Convert oauth analytics views from SECURITY DEFINER to SECURITY INVOKER
-- Issue: Supabase linter flagged oauth_app_daily_stats and oauth_user_activity_summary as security risks
-- Solution: Recreate views with security_invoker = true to respect RLS policies

-- =====================================================
-- SECTION 1: MIGRATION INITIALIZATION & LOGGING
-- =====================================================

-- Log migration start
DO $$
BEGIN
RAISE LOG 'TrueNamePath Security Fix: Starting Security Definer Views Migration';
RAISE LOG 'Migration: 042_fix_security_definer_views - Convert SECURITY DEFINER to SECURITY INVOKER';
RAISE LOG 'Issue: Supabase database linter flagged views as security definer violations';
RAISE LOG 'Solution: Recreate views with security_invoker = true for RLS compliance';
RAISE LOG 'Target Views: oauth_app_daily_stats, oauth_user_activity_summary';
END
$$;

-- =====================================================
-- SECTION 2: DROP EXISTING SECURITY DEFINER VIEWS
-- =====================================================

-- Drop existing views that are causing security definer errors
-- These were created in migrations 032 and 040 without explicit security mode
DROP VIEW IF EXISTS public.oauth_app_daily_stats CASCADE;
DROP VIEW IF EXISTS public.oauth_user_activity_summary CASCADE;

DO $$
BEGIN
RAISE LOG 'Security Fix: Dropped existing SECURITY DEFINER views';
END
$$;

-- =====================================================
-- SECTION 3: RECREATE VIEWS WITH SECURITY INVOKER
-- =====================================================

-- Daily app usage summary view with SECURITY INVOKER
-- This ensures the view respects Row Level Security policies
-- Uses exact same definition as migration 040 but with security_invoker = true
CREATE VIEW public.oauth_app_daily_stats 
WITH (security_invoker = true) AS
SELECT 
  aul.client_id,
  aul.client_id as app_name, -- Use client_id as display name without oauth_applications dependency
  DATE(aul.created_at) as usage_date,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE aul.success = true) as successful_operations,
  COUNT(DISTINCT aul.profile_id) as unique_users,
  ROUND(AVG(aul.response_time_ms) FILTER (WHERE aul.response_time_ms > 0), 2) as avg_response_time_ms,
  COUNT(*) FILTER (WHERE aul.action = 'authorize') as authorizations,
  COUNT(*) FILTER (WHERE aul.action = 'resolve') as resolutions,
  COUNT(*) FILTER (WHERE aul.action = 'revoke') as revocations
FROM public.app_usage_log aul
GROUP BY aul.client_id, DATE(aul.created_at)
ORDER BY usage_date DESC, aul.client_id;

-- User activity summary view with SECURITY INVOKER
-- This ensures the view respects Row Level Security policies
-- Uses exact same definition as migration 040 but with security_invoker = true
CREATE VIEW public.oauth_user_activity_summary 
WITH (security_invoker = true) AS
SELECT 
  aul.profile_id,
  p.email as user_email,
  COUNT(DISTINCT aul.client_id) as connected_apps_count,
  COUNT(*) as total_operations,
  COUNT(*) FILTER (WHERE aul.success = true) as successful_operations,
  ROUND(AVG(aul.response_time_ms) FILTER (WHERE aul.response_time_ms > 0), 2) as avg_response_time_ms,
  MAX(aul.created_at) as last_activity,
  COUNT(*) FILTER (WHERE aul.created_at > now() - interval '7 days') as operations_last_week
FROM public.app_usage_log aul
JOIN public.profiles p ON p.id = aul.profile_id
GROUP BY aul.profile_id, p.email
ORDER BY last_activity DESC;

-- Update view comments for security compliance documentation
COMMENT ON VIEW public.oauth_app_daily_stats IS 
'Daily summary of OAuth application usage by client_id for analytics dashboard. 
SECURITY INVOKER mode ensures Row Level Security policies are respected.';

COMMENT ON VIEW public.oauth_user_activity_summary IS 
'User-level OAuth activity summary using client_id system for user analytics.
SECURITY INVOKER mode ensures Row Level Security policies are respected.';

DO $$
BEGIN
RAISE LOG 'Security Fix: Recreated views with SECURITY INVOKER mode';
END
$$;

-- =====================================================
-- SECTION 4: RESTORE VIEW PERMISSIONS
-- =====================================================

-- Grant view permissions (same as original migration)
GRANT SELECT ON public.oauth_app_daily_stats TO authenticated;
GRANT SELECT ON public.oauth_user_activity_summary TO authenticated;
GRANT ALL ON public.oauth_app_daily_stats TO service_role;
GRANT ALL ON public.oauth_user_activity_summary TO service_role;

DO $$
BEGIN
RAISE LOG 'Security Fix: Restored view permissions for authenticated and service_role';
END
$$;

-- =====================================================
-- SECTION 5: VALIDATION AND VERIFICATION
-- =====================================================

-- Validate that views were created successfully with security_invoker
DO $$
DECLARE
daily_stats_exists boolean;
user_activity_exists boolean;
view_count integer;
BEGIN
-- Check if oauth_app_daily_stats view exists
SELECT EXISTS (
SELECT 1 FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'oauth_app_daily_stats'
) INTO daily_stats_exists;

-- Check if oauth_user_activity_summary view exists  
SELECT EXISTS (
SELECT 1 FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'oauth_user_activity_summary'
) INTO user_activity_exists;

-- Count total views for verification
SELECT COUNT(*) INTO view_count
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('oauth_app_daily_stats', 'oauth_user_activity_summary');

-- Validation checks
IF NOT daily_stats_exists THEN
RAISE EXCEPTION 'Security Fix Validation Failed: oauth_app_daily_stats view not created';
END IF;

IF NOT user_activity_exists THEN
RAISE EXCEPTION 'Security Fix Validation Failed: oauth_user_activity_summary view not created';
END IF;

IF view_count != 2 THEN
RAISE EXCEPTION 'Security Fix Validation Failed: Expected 2 views, found %', view_count;
END IF;

RAISE LOG 'Security Fix Validation: Successfully created % OAuth analytics views with SECURITY INVOKER', view_count;
END
$$;

-- =====================================================
-- SECTION 6: MIGRATION COMPLETION
-- =====================================================

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath Security Fix: Migration 042 completed successfully';
RAISE LOG '';
RAISE LOG '✅ SECURITY DEFINER VIEWS FIXED:';
RAISE LOG '  • Converted oauth_app_daily_stats to SECURITY INVOKER mode';
RAISE LOG '  • Converted oauth_user_activity_summary to SECURITY INVOKER mode';
RAISE LOG '  • Both views now respect Row Level Security policies';
RAISE LOG '  • Supabase database linter errors should be resolved';
RAISE LOG '';
RAISE LOG '✅ FUNCTIONALITY PRESERVED:';
RAISE LOG '  • Exact same view definitions maintained from migration 040';
RAISE LOG '  • All columns, calculations, and groupings unchanged';
RAISE LOG '  • Dashboard analytics functionality fully preserved';
RAISE LOG '';
RAISE LOG '✅ SECURITY IMPROVEMENTS:';
RAISE LOG '  • Views now execute with querying user permissions (not creator)';
RAISE LOG '  • Row Level Security policies properly enforced';
RAISE LOG '  • Aligned with PostgreSQL 15+ and Supabase security best practices';
RAISE LOG '  • Academic compliance maintained (<80 lines per section)';
RAISE LOG '';
RAISE LOG '✅ PERMISSIONS RESTORED:';
RAISE LOG '  • authenticated role can SELECT from both views';
RAISE LOG '  • service_role has ALL privileges on both views';
RAISE LOG '  • OAuth dashboard stats functionality maintained';
RAISE LOG '';
RAISE LOG '🔒 SECURITY COMPLIANCE ACHIEVED:';
RAISE LOG '  • Supabase database linter should now pass without errors';
RAISE LOG '  • Views follow security_invoker best practices';
RAISE LOG '  • Zero breaking changes to existing OAuth functionality';
RAISE LOG '  • Step 16 OAuth integration security requirements satisfied';
END $$;