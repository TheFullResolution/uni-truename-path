-- ===================================================================
-- MIGRATION: Optimize RLS Performance and Remove Duplicate Indexes
-- Purpose: Fix auth.uid() re-evaluation performance issues and remove duplicate indexes
-- Impact: Significant performance improvement at scale, reduced storage overhead
-- ===================================================================

-- Log migration start
DO $$
BEGIN
RAISE LOG 'Migration: optimize_rls_performance - Starting';
RAISE LOG 'Purpose: Optimize RLS policies for better performance and remove duplicate indexes';
END $$;

-- ===
-- SECTION 1: DROP DUPLICATE INDEXES
-- ===

-- Drop duplicate index (idx_user_contexts_lookup is duplicate of idx_user_contexts_user_name)
DROP INDEX IF EXISTS public.idx_user_contexts_lookup;

-- Drop duplicate index (idx_one_permanent_context_per_user is duplicate of unique_permanent_context_per_user)
DROP INDEX IF EXISTS public.idx_one_permanent_context_per_user;

DO $$
BEGIN
RAISE LOG 'Performance Fix: Removed duplicate indexes from user_contexts table';
END $$;

-- ===
-- SECTION 2: OPTIMIZE PROFILES TABLE RLS POLICIES
-- ===

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "service_role_profiles" ON public.profiles;

-- Recreate with optimized auth.uid() subquery pattern
CREATE POLICY "users_own_profile" ON public.profiles
  FOR ALL USING ((SELECT auth.uid()) = id);

CREATE POLICY "service_role_profiles" ON public.profiles
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

DO $$
BEGIN
RAISE LOG 'Performance Fix: Optimized profiles table RLS policies';
END $$;

-- ===
-- SECTION 3: OPTIMIZE NAMES TABLE RLS POLICIES
-- ===

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_names" ON public.names;
DROP POLICY IF EXISTS "service_role_names" ON public.names;
DROP POLICY IF EXISTS "Users can view their own names" ON public.names;
DROP POLICY IF EXISTS "Users can insert their own names" ON public.names;
DROP POLICY IF EXISTS "Users can update their own names" ON public.names;

-- Recreate with optimized pattern
CREATE POLICY "users_own_names" ON public.names
  FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "service_role_names" ON public.names
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Users can view their own names" ON public.names
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own names" ON public.names
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own names" ON public.names
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DO $$
BEGIN
RAISE LOG 'Performance Fix: Optimized names table RLS policies';
END $$;

-- ===
-- SECTION 4: OPTIMIZE USER_CONTEXTS TABLE RLS POLICIES
-- ===

-- Drop existing policies
DROP POLICY IF EXISTS "users_own_contexts" ON public.user_contexts;
DROP POLICY IF EXISTS "service_role_contexts" ON public.user_contexts;
DROP POLICY IF EXISTS "Users can manage their own contexts" ON public.user_contexts;

-- Recreate with optimized pattern
CREATE POLICY "users_own_contexts" ON public.user_contexts
  FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "service_role_contexts" ON public.user_contexts
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Users can manage their own contexts" ON public.user_contexts
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id)
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

DO $$
BEGIN
RAISE LOG 'Performance Fix: Optimized user_contexts table RLS policies';
END $$;

-- ===
-- SECTION 5: OPTIMIZE CONTEXT_OIDC_ASSIGNMENTS TABLE RLS POLICIES
-- ===

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own OIDC assignments" ON public.context_oidc_assignments;
DROP POLICY IF EXISTS "user_manage_oidc_assignments" ON public.context_oidc_assignments;
DROP POLICY IF EXISTS "service_role_oidc_assignments" ON public.context_oidc_assignments;

-- Recreate with optimized pattern
CREATE POLICY "Users can manage their own OIDC assignments" ON public.context_oidc_assignments
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid())::uuid = user_id)
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

CREATE POLICY "service_role_oidc_assignments" ON public.context_oidc_assignments
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

DO $$
BEGIN
RAISE LOG 'Performance Fix: Optimized context_oidc_assignments table RLS policies';
END $$;

-- ===
-- SECTION 6: OPTIMIZE OAUTH_SESSIONS TABLE RLS POLICIES
-- ===

-- Drop existing policies
DROP POLICY IF EXISTS "oauth_sessions_own_sessions" ON public.oauth_sessions;
DROP POLICY IF EXISTS "oauth_sessions_own_cleanup" ON public.oauth_sessions;
DROP POLICY IF EXISTS "oauth_sessions_own_insert" ON public.oauth_sessions;
DROP POLICY IF EXISTS "oauth_sessions_service_role_all" ON public.oauth_sessions;

-- Recreate with optimized pattern
CREATE POLICY "oauth_sessions_own_sessions" ON public.oauth_sessions
  FOR SELECT
  TO authenticated
  USING (profile_id = (SELECT auth.uid()));

CREATE POLICY "oauth_sessions_own_cleanup" ON public.oauth_sessions
  FOR DELETE
  TO authenticated
  USING (profile_id = (SELECT auth.uid()) AND expires_at < now());

CREATE POLICY "oauth_sessions_own_insert" ON public.oauth_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = (SELECT auth.uid()));

-- Service role policy doesn't need optimization (uses true)
CREATE POLICY "oauth_sessions_service_role_all" ON public.oauth_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
RAISE LOG 'Performance Fix: Optimized oauth_sessions table RLS policies';
END $$;

-- ===
-- SECTION 7: OPTIMIZE APP_CONTEXT_ASSIGNMENTS TABLE RLS POLICIES
-- ===

-- Drop existing policies
DROP POLICY IF EXISTS "app_context_assignments_own_assignments" ON public.app_context_assignments;

-- Recreate with optimized pattern
CREATE POLICY "app_context_assignments_own_assignments" ON public.app_context_assignments
  FOR ALL
  TO authenticated
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

DO $$
BEGIN
RAISE LOG 'Performance Fix: Optimized app_context_assignments table RLS policies';
END $$;

-- ===
-- SECTION 8: OPTIMIZE APP_USAGE_LOG TABLE RLS POLICIES
-- ===

-- Drop existing policies
DROP POLICY IF EXISTS "users_view_own_usage" ON public.app_usage_log;
DROP POLICY IF EXISTS "service_log_usage" ON public.app_usage_log;

-- Recreate with optimized pattern
CREATE POLICY "users_view_own_usage" ON public.app_usage_log
  FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

CREATE POLICY "service_log_usage" ON public.app_usage_log
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

DO $$
BEGIN
RAISE LOG 'Performance Fix: Optimized app_usage_log table RLS policies';
END $$;

-- ===
-- SECTION 9: OPTIMIZE AUTH_EVENTS TABLE RLS POLICIES
-- ===

-- Drop existing policies
DROP POLICY IF EXISTS "users_view_own_auth_events" ON public.auth_events;
DROP POLICY IF EXISTS "service_manage_auth_events" ON public.auth_events;

-- Recreate with optimized pattern
CREATE POLICY "users_view_own_auth_events" ON public.auth_events
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "service_manage_auth_events" ON public.auth_events
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

DO $$
BEGIN
RAISE LOG 'Performance Fix: Optimized auth_events table RLS policies';
END $$;

-- ===
-- SECTION 10: OPTIMIZE DATA_CHANGES TABLE RLS POLICIES
-- ===

-- Drop existing policies
DROP POLICY IF EXISTS "users_view_own_data_changes" ON public.data_changes;
DROP POLICY IF EXISTS "service_manage_data_changes" ON public.data_changes;

-- Recreate with optimized pattern
CREATE POLICY "users_view_own_data_changes" ON public.data_changes
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "service_manage_data_changes" ON public.data_changes
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

DO $$
BEGIN
RAISE LOG 'Performance Fix: Optimized data_changes table RLS policies';
END $$;

-- ===
-- SECTION 11: VALIDATION
-- ===

-- Validate that all policies were recreated
DO $$
DECLARE
policy_count integer;
table_count integer;
BEGIN
-- Count policies on key tables
SELECT COUNT(*) INTO policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
'profiles', 'names', 'user_contexts', 'context_oidc_assignments',
'oauth_sessions', 'app_context_assignments', 'app_usage_log',
'auth_events', 'data_changes'
);

-- Count tables with RLS enabled
SELECT COUNT(*) INTO table_count
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
AND tablename IN (
'profiles', 'names', 'user_contexts', 'context_oidc_assignments',
'oauth_sessions', 'app_context_assignments', 'app_usage_log',
'auth_events', 'data_changes'
);

IF policy_count < 15 THEN
RAISE EXCEPTION 'Performance Fix: Validation failed - Expected at least 15 policies, found %', policy_count;
END IF;

IF table_count < 9 THEN
RAISE EXCEPTION 'Performance Fix: Validation failed - Expected 9 tables with RLS, found %', table_count;
END IF;

RAISE LOG 'Performance Fix: Validation successful';
RAISE LOG '  Total optimized policies: %', policy_count;
RAISE LOG '  Tables with RLS enabled: %', table_count;
END $$;

-- ===
-- SECTION 12: PERFORMANCE DOCUMENTATION
-- ===

DO $$
BEGIN
RAISE LOG '';
RAISE LOG '🚀 PERFORMANCE OPTIMIZATIONS APPLIED:';
RAISE LOG '  • auth.uid() calls now use subquery pattern (called once instead of per-row)';
RAISE LOG '  • auth.role() calls now use subquery pattern for better performance';
RAISE LOG '  • Removed 2 duplicate indexes from user_contexts table';
RAISE LOG '';
RAISE LOG '📊 EXPECTED IMPROVEMENTS:';
RAISE LOG '  • Significant query performance improvement at scale';
RAISE LOG '  • Reduced storage overhead from duplicate indexes';
RAISE LOG '  • Faster write operations on user_contexts table';
RAISE LOG '';
RAISE LOG '🔒 SECURITY MAINTAINED:';
RAISE LOG '  • All existing access controls preserved';
RAISE LOG '  • No functional changes to RLS policies';
RAISE LOG '  • Service role access patterns unchanged';
END $$;

-- ===
-- SECTION 13: MIGRATION COMPLETION
-- ===

-- Final migration completion log
DO $$
BEGIN
RAISE LOG '';
RAISE LOG '✅ MIGRATION COMPLETED SUCCESSFULLY';
RAISE LOG 'Performance Issue: RLS auth function re-evaluation fixed';
RAISE LOG 'Solution: Wrapped auth functions in subqueries';
RAISE LOG 'Result: Significant performance improvement at scale';
RAISE LOG 'Duplicate Indexes: Removed from user_contexts table';
RAISE LOG 'Impact: No functional changes, only performance improvements';
RAISE LOG '';
END $$;