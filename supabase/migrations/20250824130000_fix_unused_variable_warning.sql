-- Migration: Fix unused variable warning in test function
-- Date: August 24, 2025
-- Purpose: Remove unused variable v_test_result from test_enhanced_signup_functionality function

-- Fix the linting warning by removing the unused variable declaration
CREATE OR REPLACE FUNCTION public.test_enhanced_signup_functionality()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
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

-- Add comment noting the fix
COMMENT ON FUNCTION public.test_enhanced_signup_functionality() IS 
'Comprehensive test of enhanced signup functionality after cleanup migration.
Returns complete status of enhanced signup system and cleanup results.
Fixed: Removed unused v_test_result variable (linting warning resolved).';