-- Step 16.1.3: OAuth App Context Assignments Table for User-App Context Mapping
-- Migration: 20250822000000_031_app_context_assignments.sql
-- Purpose: Create OAuth app context assignments table for bridging apps with user contexts
-- Date: August 22, 2025
-- Context: Part of Step 16 OAuth integration system - enables default context assignment to apps

-- =====================================================
-- SECTION 1: MIGRATION INITIALIZATION & LOGGING
-- =====================================================

-- Log migration start
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Starting OAuth App Context Assignments table creation';
RAISE LOG 'Migration: 031_app_context_assignments - Foundation for user-app context mapping';
RAISE LOG 'Performance Target: <3ms assignment lookup operations for OAuth flow';
END
$$;

-- =====================================================
-- SECTION 2: APP CONTEXT ASSIGNMENTS TABLE CREATION
-- =====================================================

-- Create the OAuth app context assignments table for mapping user contexts to applications
-- This table stores which context a user has assigned to each OAuth application
-- Supports default context assignment during OAuth authorization flow
CREATE TABLE public.app_context_assignments (
  -- Primary identifier (UUID for consistency with existing schema)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to profiles table (consistent with oauth_sessions pattern)
  -- CASCADE delete ensures assignments are cleaned up when user is deleted
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Foreign key to OAuth application registration
  -- CASCADE delete ensures assignments are cleaned up when app is deleted
  app_id uuid NOT NULL REFERENCES public.oauth_applications(id) ON DELETE CASCADE,
  
  -- Foreign key to user-defined contexts
  -- CASCADE delete ensures assignments are cleaned up when context is deleted
  context_id uuid NOT NULL REFERENCES public.user_contexts(id) ON DELETE CASCADE,
  
  -- Standard timestamp tracking
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Business constraints
  -- Critical: One context assignment per user per app (deterministic resolution)
  CONSTRAINT app_context_assignments_unique_user_app UNIQUE (profile_id, app_id)
);

-- Add comprehensive table documentation
COMMENT ON TABLE public.app_context_assignments IS 
'OAuth application context assignments for TrueNamePath context-aware identity system. 
Maps which user-defined context should be used when a specific OAuth application 
requests identity information. Supports default context assignment during OAuth 
authorization flow and user customization via dashboard interface.';

-- Add detailed column comments
COMMENT ON COLUMN public.app_context_assignments.profile_id IS 
'Foreign key to public.profiles. Identifies which user this assignment belongs to. 
Uses profile_id for consistency with oauth_sessions table pattern.';

COMMENT ON COLUMN public.app_context_assignments.app_id IS 
'Foreign key to public.oauth_applications. Identifies which registered OAuth application 
this context assignment applies to. One assignment per user-app combination.';

COMMENT ON COLUMN public.app_context_assignments.context_id IS 
'Foreign key to public.user_contexts. Identifies which user-defined context should be 
used when this app requests identity data. Enables context-aware name resolution.';

-- =====================================================
-- SECTION 3: PERFORMANCE INDEXES
-- =====================================================

-- Primary lookup index for OAuth flow (< 3ms requirement)
-- Most critical query: SELECT context_id FROM app_context_assignments WHERE profile_id = ? AND app_id = ?
CREATE INDEX idx_app_context_assignments_profile_app ON public.app_context_assignments(profile_id, app_id);

-- User's app assignments index for dashboard interface
-- Supports queries: user's context assignments across all apps
CREATE INDEX idx_app_context_assignments_profile ON public.app_context_assignments(profile_id);

-- App usage analytics index
-- Supports queries: which contexts are assigned to specific apps
CREATE INDEX idx_app_context_assignments_app ON public.app_context_assignments(app_id);

-- Context usage tracking index
-- Supports queries: which apps use specific contexts
CREATE INDEX idx_app_context_assignments_context ON public.app_context_assignments(context_id);

-- Log index creation
DO $$
BEGIN
RAISE LOG 'App Context Assignments: Created performance indexes for <3ms OAuth lookup requirement';
RAISE LOG 'Primary index: (profile_id, app_id) for instant assignment lookups';
RAISE LOG 'Analytics indexes: profile_id, app_id, context_id for dashboard and monitoring';
END
$$;

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on the app_context_assignments table
ALTER TABLE public.app_context_assignments ENABLE ROW LEVEL SECURITY;

-- Authenticated user policy: Users can manage their own app context assignments
-- Enables assignment management interface and OAuth flow customization
CREATE POLICY "app_context_assignments_own_assignments" ON public.app_context_assignments
  FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Service role management policy: Full access for system operations
-- Required for default assignment creation during OAuth flow
CREATE POLICY "app_context_assignments_service_role_all" ON public.app_context_assignments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Log RLS policy creation
DO $$
BEGIN
RAISE LOG 'App Context Assignments: Created RLS policies for user privacy and service management';
RAISE LOG 'Users can manage their own app context assignments only';
RAISE LOG 'Service role has full access for OAuth system operations';
RAISE LOG 'No public access - assignments are private user configuration';
END
$$;

-- =====================================================
-- SECTION 5: HELPER FUNCTIONS
-- =====================================================

-- Create helper function for default context assignment to apps
-- Assigns user's permanent "Default" context to a new OAuth application
CREATE OR REPLACE FUNCTION public.assign_default_context_to_app(
  p_profile_id uuid,
  p_app_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_context_id uuid;
  v_existing_assignment_id uuid;
BEGIN
  -- Check if assignment already exists
  SELECT id INTO v_existing_assignment_id
  FROM public.app_context_assignments
  WHERE profile_id = p_profile_id AND app_id = p_app_id;
  
  IF v_existing_assignment_id IS NOT NULL THEN
RAISE LOG 'App context assignment already exists for profile % and app %', p_profile_id, p_app_id;

-- Return the existing context_id for the assignment
SELECT context_id INTO v_default_context_id
FROM public.app_context_assignments
WHERE id = v_existing_assignment_id;

RETURN v_default_context_id;
  END IF;
  
  -- Find user's permanent default context
  SELECT id INTO v_default_context_id
  FROM public.user_contexts
  WHERE user_id = p_profile_id AND is_permanent = true;
  
  IF v_default_context_id IS NULL THEN
RAISE EXCEPTION 'No default context found for user %. User must have a permanent default context.', p_profile_id
  USING ERRCODE = '23503'; -- foreign_key_violation
  END IF;
  
  -- Create the assignment
  INSERT INTO public.app_context_assignments (
profile_id,
app_id,
context_id
  ) VALUES (
p_profile_id,
p_app_id,
v_default_context_id
  );
  
  RAISE LOG 'Assigned default context % to app % for user %', v_default_context_id, p_app_id, p_profile_id;
  
  RETURN v_default_context_id;
EXCEPTION
  WHEN unique_violation THEN
-- Handle race condition where assignment was created between check and insert
RAISE LOG 'Race condition detected during default context assignment, returning existing assignment';

SELECT context_id INTO v_default_context_id
FROM public.app_context_assignments
WHERE profile_id = p_profile_id AND app_id = p_app_id;

RETURN v_default_context_id;
END $$;

-- Add function documentation
COMMENT ON FUNCTION public.assign_default_context_to_app(uuid, uuid) IS 
'Assigns user''s permanent default context to specified OAuth application. 
Used during OAuth authorization flow to ensure every app has a context assignment. 
Returns the assigned context_id. Handles existing assignments gracefully and 
includes race condition protection for concurrent OAuth flows.';

-- =====================================================
-- SECTION 6: PERMISSIONS & GRANTS
-- =====================================================

-- Grant full access to authenticated users for their own assignments
GRANT ALL ON public.app_context_assignments TO authenticated;

-- Grant full access to service_role for OAuth system operations
GRANT ALL ON public.app_context_assignments TO service_role;

-- Grant usage on sequences to service_role for INSERT operations
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION public.assign_default_context_to_app(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_default_context_to_app(uuid, uuid) TO authenticated;

-- Log permissions setup
DO $$
BEGIN
RAISE LOG 'App Context Assignments: Granted appropriate permissions';
RAISE LOG 'Authenticated users: ALL operations (own assignments only via RLS)';
RAISE LOG 'Service role: ALL operations for OAuth system management';
RAISE LOG 'Helper function: EXECUTE access for authenticated and service_role';
END
$$;

-- =====================================================
-- SECTION 7: UPDATED_AT TRIGGER
-- =====================================================

-- Create trigger for updated_at column automation
CREATE TRIGGER update_app_context_assignments_updated_at
  BEFORE UPDATE ON public.app_context_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Log trigger creation
DO $$
BEGIN
RAISE LOG 'App Context Assignments: Created updated_at trigger for automatic timestamp management';
END
$$;

-- =====================================================
-- SECTION 8: MIGRATION VALIDATION & COMPLETION
-- =====================================================

-- Validate the created table structure and functions
DO $$
DECLARE
index_count integer;
policy_count integer;
constraint_count integer;
function_exists boolean;
BEGIN
-- Validate indexes exist
SELECT COUNT(*) INTO index_count 
FROM pg_indexes 
WHERE tablename = 'app_context_assignments' 
AND schemaname = 'public';

IF index_count >= 4 THEN
RAISE LOG 'App Context Assignments: Index validation passed - % indexes created', index_count;
ELSE
RAISE EXCEPTION 'App Context Assignments: Index validation failed - Expected >= 4 indexes, found %', index_count;
END IF;

-- Validate RLS policies exist
SELECT COUNT(*) INTO policy_count
FROM pg_policies
WHERE tablename = 'app_context_assignments'
AND schemaname = 'public';

IF policy_count >= 2 THEN
RAISE LOG 'App Context Assignments: RLS policy validation passed - % policies created', policy_count;
ELSE
RAISE EXCEPTION 'App Context Assignments: RLS policy validation failed - Expected >= 2 policies, found %', policy_count;
END IF;

-- Validate foreign key constraints
SELECT COUNT(*) INTO constraint_count
FROM information_schema.table_constraints 
WHERE table_name = 'app_context_assignments' 
AND constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';

IF constraint_count >= 3 THEN
RAISE LOG 'App Context Assignments: Foreign key validation passed - % constraints created', constraint_count;
ELSE
RAISE EXCEPTION 'App Context Assignments: Foreign key validation failed - Expected >= 3 constraints, found %', constraint_count;
END IF;

-- Validate unique constraint exists
IF EXISTS (
SELECT 1 FROM information_schema.table_constraints 
WHERE table_name = 'app_context_assignments' 
AND constraint_type = 'UNIQUE'
AND constraint_name = 'app_context_assignments_unique_user_app'
AND table_schema = 'public'
) THEN
RAISE LOG 'App Context Assignments: Unique constraint validation passed';
ELSE
RAISE EXCEPTION 'App Context Assignments: Unique constraint validation failed - Missing required unique constraint';
END IF;

-- Validate helper function exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'assign_default_context_to_app'
) INTO function_exists;

IF function_exists THEN
RAISE LOG 'App Context Assignments: Helper function validation passed';
ELSE
RAISE EXCEPTION 'App Context Assignments: Helper function validation failed - assign_default_context_to_app not found';
END IF;

RAISE LOG 'App Context Assignments: All validation checks passed successfully';
END
$$;

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Migration 031 completed successfully';
RAISE LOG '';
RAISE LOG '✅ APP CONTEXT ASSIGNMENTS INFRASTRUCTURE:';
RAISE LOG '  • Table created with comprehensive constraints and documentation';
RAISE LOG '  • Unique constraint: (profile_id, app_id) for deterministic assignments';
RAISE LOG '  • Foreign keys to profiles, oauth_applications, and user_contexts with CASCADE';
RAISE LOG '  • Updated_at trigger for automatic timestamp management';
RAISE LOG '';
RAISE LOG '✅ PERFORMANCE OPTIMIZATION:';
RAISE LOG '  • Primary index on (profile_id, app_id) for <3ms OAuth lookups';
RAISE LOG '  • Individual indexes on profile_id, app_id, context_id for analytics';
RAISE LOG '  • Optimized for OAuth flow assignment resolution queries';
RAISE LOG '';
RAISE LOG '✅ SECURITY & PRIVACY:';
RAISE LOG '  • RLS policies: users manage own assignments only';
RAISE LOG '  • Service role has full access for OAuth system operations';
RAISE LOG '  • No public access to private user-app configurations';
RAISE LOG '';
RAISE LOG '✅ OPERATIONAL FEATURES:';
RAISE LOG '  • assign_default_context_to_app() function for OAuth flow automation';
RAISE LOG '  • Race condition protection for concurrent OAuth authorizations';
RAISE LOG '  • Graceful handling of existing assignments and validation errors';
RAISE LOG '  • Integration with user_contexts permanent default contexts';
RAISE LOG '';
RAISE LOG '✅ INTEGRATION POINTS:';
RAISE LOG '  • Bridges oauth_applications with user_contexts for context-aware resolution';
RAISE LOG '  • Supports OAuth authorization flow default context assignment';
RAISE LOG '  • Enables dashboard interface for user customization of app contexts';
RAISE LOG '  • Foundation for context-aware OIDC claims generation';
RAISE LOG '';
RAISE LOG '🚀 Ready for Step 16.2: OAuth authorization endpoint implementation';
RAISE LOG '🚀 Ready for Phase 6: Dashboard OAuth app management interface';
RAISE LOG '🚀 Foundation established for user-controlled app context assignments';
END
$$;