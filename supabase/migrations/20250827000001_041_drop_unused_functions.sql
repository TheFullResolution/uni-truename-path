-- TrueNamePath: Drop Unused Database Functions - Security Cleanup
-- Migration 041: Remove functions that are not actively used in the application
-- Purpose: Reduce security warnings and clean up database schema

-- Drop unused utility and test functions
DROP FUNCTION IF EXISTS public.cleanup_expired_oauth_sessions();
DROP FUNCTION IF EXISTS public.cleanup_old_app_logs(integer);
DROP FUNCTION IF EXISTS public.get_context_oidc_claims(uuid);
DROP FUNCTION IF EXISTS public.get_user_contexts(uuid);
DROP FUNCTION IF EXISTS public.get_active_consent(uuid, uuid);
DROP FUNCTION IF EXISTS public.verify_database_consistency();
DROP FUNCTION IF EXISTS public.validate_enhanced_signup_setup();
DROP FUNCTION IF EXISTS public.test_enhanced_signup_functionality();
DROP FUNCTION IF EXISTS public.get_cleanup_rollback_info();

-- Add comment explaining the cleanup
COMMENT ON SCHEMA public IS 'TrueNamePath database schema - cleaned up unused functions in migration 041';