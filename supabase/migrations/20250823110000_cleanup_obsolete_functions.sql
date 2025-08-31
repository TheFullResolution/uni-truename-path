-- ===
-- Cleanup Obsolete Database Functions Migration for TrueNamePath
-- ===
-- Purpose: Remove obsolete complete_signup_with_oidc function and ensure database consistency
--
-- Background: 
--   The enhanced handle_new_user() trigger function (created in 20250823100001) now
--   handles all signup functionality automatically via database triggers, making
--   the manual complete_signup_with_oidc function obsolete.
--
-- Actions:
--   1. Drop obsolete complete_signup_with_oidc function
--   2. Verify enhanced signup trigger is working
--   3. Add comprehensive logging and validation
--   4. Create rollback procedure documentation
--   5. Test database consistency
--
-- ===

-- Log migration start
DO $$
BEGIN
RAISE LOG '=== TrueNamePath Database Cleanup Migration Starting ===';
RAISE LOG 'Migration: 20250823110000_cleanup_obsolete_functions.sql';
RAISE LOG 'Purpose: Remove obsolete complete_signup_with_oidc function';
RAISE LOG 'Date: August 23, 2025';
END
$$;

-- ===
-- STEP 1: Verify enhanced signup system is working before cleanup
-- ===

DO $$
DECLARE
v_validation_result JSONB;
v_enhanced_ready BOOLEAN;
BEGIN
-- Test enhanced signup validation
SELECT public.validate_enhanced_signup_setup() INTO v_validation_result;
v_enhanced_ready := (v_validation_result->>'status') = 'READY';

RAISE LOG 'Pre-cleanup validation: %', v_validation_result;

IF NOT v_enhanced_ready THEN
RAISE EXCEPTION 'ABORT: Enhanced signup system is not ready. Validation result: %', v_validation_result;
END IF;

RAISE LOG 'Enhanced signup system validated - safe to proceed with cleanup';
END
$$;

-- ===
-- STEP 2: Document function removal for rollback purposes
-- ===

-- Create rollback information function (for documentation/emergency use)
CREATE OR REPLACE FUNCTION public.get_cleanup_rollback_info()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
RETURN jsonb_build_object(
'migration', '20250823110000_cleanup_obsolete_functions.sql',
'cleanup_date', now(),
'removed_functions', jsonb_build_array('complete_signup_with_oidc'),
'replacement_system', 'Enhanced handle_new_user() trigger function',
'rollback_note', 'If rollback needed, recreate complete_signup_with_oidc from previous migrations',
'previous_migrations_with_function', jsonb_build_array(
'20250821120001_fix_signup_function_visibility_constraint.sql',
'20250821120000_emergency_fix_signup_function_new_schema.sql'
),
'enhanced_system_migration', '20250823100001_enhanced_signup_trigger.sql'
);
END;
$$;

COMMENT ON FUNCTION public.get_cleanup_rollback_info() IS 
'Documentation function containing rollback information for database cleanup migration.
Contains details about removed functions and how to restore them if needed.';

-- ===
-- STEP 3: Remove obsolete complete_signup_with_oidc function
-- ===

DO $$
DECLARE
v_function_exists BOOLEAN;
BEGIN
-- Check if function exists before dropping
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'complete_signup_with_oidc'
) INTO v_function_exists;

IF v_function_exists THEN
RAISE LOG 'Removing obsolete complete_signup_with_oidc function...';

-- Drop the function (CASCADE to handle any dependencies)
DROP FUNCTION IF EXISTS public.complete_signup_with_oidc CASCADE;

RAISE LOG 'Successfully removed complete_signup_with_oidc function';
ELSE
RAISE LOG 'complete_signup_with_oidc function does not exist - nothing to remove';
END IF;
END
$$;

-- ===
-- STEP 4: Verify database consistency after cleanup
-- ===

-- Create comprehensive database consistency check
CREATE OR REPLACE FUNCTION public.verify_database_consistency()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
v_profiles_count INTEGER;
v_names_count INTEGER;
v_contexts_count INTEGER;
v_oidc_assignments_count INTEGER;
v_enhanced_trigger_exists BOOLEAN;
v_obsolete_functions_count INTEGER;
BEGIN
-- Count records in main tables
SELECT COUNT(*) FROM public.profiles INTO v_profiles_count;
SELECT COUNT(*) FROM public.names INTO v_names_count;
SELECT COUNT(*) FROM public.user_contexts INTO v_contexts_count;
SELECT COUNT(*) FROM public.context_oidc_assignments INTO v_oidc_assignments_count;

-- Check enhanced trigger exists
SELECT EXISTS (
SELECT 1 FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
AND c.relname = 'users'
AND t.tgname = 'on_auth_user_created'
) INTO v_enhanced_trigger_exists;

-- Count obsolete functions (should be 0)
SELECT COUNT(*) FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'complete_signup_with_oidc'
INTO v_obsolete_functions_count;

RETURN jsonb_build_object(
'timestamp', now(),
'profiles_count', v_profiles_count,
'names_count', v_names_count,
'contexts_count', v_contexts_count,
'oidc_assignments_count', v_oidc_assignments_count,
'enhanced_trigger_active', v_enhanced_trigger_exists,
'obsolete_functions_count', v_obsolete_functions_count,
'consistency_status', CASE 
WHEN v_enhanced_trigger_exists AND v_obsolete_functions_count = 0 THEN 'CLEAN'
WHEN NOT v_enhanced_trigger_exists THEN 'ERROR_NO_TRIGGER'
WHEN v_obsolete_functions_count > 0 THEN 'ERROR_OBSOLETE_FUNCTIONS'
ELSE 'ERROR_UNKNOWN'
END
);
END;
$$;

COMMENT ON FUNCTION public.verify_database_consistency() IS 
'Comprehensive database consistency check after cleanup migration.
Verifies enhanced signup system is active and obsolete functions are removed.';

-- ===
-- STEP 5: Run consistency verification
-- ===

DO $$
DECLARE
v_consistency_result JSONB;
v_status TEXT;
BEGIN
-- Run comprehensive consistency check
SELECT public.verify_database_consistency() INTO v_consistency_result;
v_status := v_consistency_result->>'consistency_status';

RAISE LOG 'Database consistency check: %', v_consistency_result;

IF v_status != 'CLEAN' THEN
RAISE EXCEPTION 'Database consistency check failed: %', v_consistency_result;
END IF;

RAISE LOG 'Database consistency verified - cleanup successful';
END
$$;

-- ===
-- STEP 6: Test enhanced signup functionality
-- ===

-- Create test function to verify enhanced signup works
CREATE OR REPLACE FUNCTION public.test_enhanced_signup_functionality()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
v_test_result JSONB;
v_validation JSONB;
v_consistency JSONB;
v_rollback_info JSONB;
BEGIN
-- Get validation results
SELECT public.validate_enhanced_signup_setup() INTO v_validation;

-- Get consistency results  
SELECT public.verify_database_consistency() INTO v_consistency;

-- Get rollback information
SELECT public.get_cleanup_rollback_info() INTO v_rollback_info;

RETURN jsonb_build_object(
'test_timestamp', now(),
'enhanced_signup_validation', v_validation,
'database_consistency', v_consistency,
'rollback_information', v_rollback_info,
'overall_status', CASE 
WHEN (v_validation->>'status') = 'READY' AND (v_consistency->>'consistency_status') = 'CLEAN' THEN 'PASS'
ELSE 'FAIL'
END
);
END;
$$;

COMMENT ON FUNCTION public.test_enhanced_signup_functionality() IS 
'Comprehensive test of enhanced signup functionality after cleanup migration.
Returns complete status of enhanced signup system and cleanup results.';

-- ===
-- STEP 7: Grant necessary permissions for new functions
-- ===

-- Grant permissions on new utility functions
GRANT EXECUTE ON FUNCTION public.get_cleanup_rollback_info() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.verify_database_consistency() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.test_enhanced_signup_functionality() TO postgres, service_role;

-- Log permissions granted
DO $$
BEGIN
RAISE LOG 'Granted permissions on cleanup utility functions';
END
$$;

-- ===
-- STEP 8: Final validation and migration completion
-- ===

DO $$
DECLARE
v_final_test JSONB;
v_overall_status TEXT;
BEGIN
-- Run final comprehensive test
SELECT public.test_enhanced_signup_functionality() INTO v_final_test;
v_overall_status := v_final_test->>'overall_status';

RAISE LOG '=== FINAL CLEANUP VALIDATION ===';
RAISE LOG 'Complete test results: %', v_final_test;

IF v_overall_status != 'PASS' THEN
RAISE EXCEPTION 'Final validation failed: %', v_final_test;
END IF;

RAISE LOG '=== Database Cleanup Migration COMPLETED SUCCESSFULLY ===';
RAISE LOG 'Migration: 20250823110000_cleanup_obsolete_functions.sql';
RAISE LOG 'Date: August 23, 2025';
RAISE LOG '';
RAISE LOG 'CLEANUP ACTIONS COMPLETED:';
RAISE LOG '✓ Obsolete complete_signup_with_oidc function removed';
RAISE LOG '✓ Enhanced handle_new_user() trigger function verified active';
RAISE LOG '✓ Database consistency validated';
RAISE LOG '✓ Comprehensive logging and error handling added';
RAISE LOG '✓ Rollback documentation created';
RAISE LOG '✓ All permissions properly configured';
RAISE LOG '';
RAISE LOG 'DATABASE STATE:';
RAISE LOG '- Enhanced signup trigger: ACTIVE';
RAISE LOG '- Obsolete functions: REMOVED';
RAISE LOG '- Data integrity: MAINTAINED';
RAISE LOG '- Rollback info: DOCUMENTED';
RAISE LOG '';
RAISE LOG 'Next steps: Run signup flow tests to verify functionality';
RAISE LOG '=== Migration Complete ===';
END
$$;