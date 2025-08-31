-- Name Deletion Protection Enhancement
-- Enhance can_delete_name() function with comprehensive protection against deletion of context-assigned names

-- PROTECTION TYPES IMPLEMENTED:
-- • "last_name": Cannot delete the user's only remaining name
-- • "public_context": Name is assigned to a context with visibility = 'public'
-- • "permanent_context": Name is assigned to a context with is_permanent = true
-- • "none": Name can be safely deleted

-- Log migration start
DO $$
BEGIN
RAISE LOG 'Name Deletion Protection Enhancement: Starting can_delete_name() function upgrade';
RAISE LOG 'Migration will add context-aware name deletion protection';
END
$$;

-- Enhanced can_delete_name function

-- Replace existing function with comprehensive protection logic
CREATE OR REPLACE FUNCTION public.can_delete_name(p_name_id UUID, p_user_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
v_name_count INTEGER;
v_can_delete BOOLEAN;
v_reason TEXT;
v_reason_code TEXT;
v_protection_type TEXT;
v_public_contexts JSONB := '[]'::JSONB;
v_permanent_contexts JSONB := '[]'::JSONB;
v_context_info JSONB;
v_public_count INTEGER := 0;
v_permanent_count INTEGER := 0;
BEGIN
-- Step 1: Check ownership first (security validation)
IF NOT EXISTS (
SELECT 1 FROM names 
WHERE id = p_name_id AND user_id = p_user_id
) THEN
RETURN jsonb_build_object(
'can_delete', false,
'reason', 'Name not found or not owned by user',
'reason_code', 'OWNERSHIP_ERROR',
'protection_type', 'ownership',
'name_count', 0,
'context_info', jsonb_build_object(
'public_contexts', '[]'::JSONB,
'permanent_contexts', '[]'::JSONB
)
);
END IF;

-- Step 2: Check for public context assignments
-- Find all public contexts this name is assigned to
SELECT 
COALESCE(jsonb_agg(
jsonb_build_object(
'id', uc.id::text,
'context_name', uc.context_name
)
), '[]'::JSONB),
COUNT(*)
INTO v_public_contexts, v_public_count
FROM context_oidc_assignments coa
INNER JOIN user_contexts uc ON coa.context_id = uc.id
WHERE coa.name_id = p_name_id 
  AND coa.user_id = p_user_id
  AND uc.visibility = 'public';

-- If name is assigned to public contexts, prevent deletion
IF v_public_count > 0 THEN
v_can_delete := false;
v_reason := format('Cannot delete name assigned to %s public context%s', 
  v_public_count, 
  CASE WHEN v_public_count > 1 THEN 's' ELSE '' END);
v_reason_code := 'PUBLIC_CONTEXT_ASSIGNED';
v_protection_type := 'public_context';
END IF;

-- Step 3: Check for permanent context assignments (if not already protected)
-- Find all permanent contexts this name is assigned to
SELECT 
COALESCE(jsonb_agg(
jsonb_build_object(
'id', uc.id::text,
'context_name', uc.context_name
)
), '[]'::JSONB),
COUNT(*)
INTO v_permanent_contexts, v_permanent_count
FROM context_oidc_assignments coa
INNER JOIN user_contexts uc ON coa.context_id = uc.id
WHERE coa.name_id = p_name_id 
  AND coa.user_id = p_user_id
  AND uc.is_permanent = true;

-- If not already protected and name is assigned to permanent contexts, prevent deletion
IF v_can_delete IS NULL AND v_permanent_count > 0 THEN
v_can_delete := false;
v_reason := format('Cannot delete name assigned to %s permanent context%s', 
  v_permanent_count, 
  CASE WHEN v_permanent_count > 1 THEN 's' ELSE '' END);
v_reason_code := 'PERMANENT_CONTEXT_ASSIGNED';
v_protection_type := 'permanent_context';
END IF;

-- Step 4: Check last name protection (existing logic) if not already protected
IF v_can_delete IS NULL THEN
-- Count total names for user
SELECT COUNT(*) INTO v_name_count
FROM names
WHERE user_id = p_user_id;

-- Apply last name protection
IF v_name_count <= 1 THEN
v_can_delete := false;
v_reason := 'Cannot delete last remaining name';
v_reason_code := 'LAST_NAME_PROTECTION';
v_protection_type := 'last_name';
ELSE
-- Name can be safely deleted
v_can_delete := true;
v_reason := 'Name can be safely deleted';
v_reason_code := 'DELETION_ALLOWED';
v_protection_type := 'none';
END IF;
ELSE
-- Get name count for response even if already protected
SELECT COUNT(*) INTO v_name_count
FROM names
WHERE user_id = p_user_id;
END IF;

-- Step 5: Build comprehensive context info object
v_context_info := jsonb_build_object(
'public_contexts', v_public_contexts,
'permanent_contexts', v_permanent_contexts
);

-- Step 6: Return enhanced protection information
RETURN jsonb_build_object(
'can_delete', v_can_delete,
'reason', v_reason,
'reason_code', v_reason_code,
'protection_type', v_protection_type,
'name_count', v_name_count,
'context_info', v_context_info
);

EXCEPTION
WHEN OTHERS THEN
-- Comprehensive error logging with context
RAISE LOG 'Name Deletion Protection: Error in can_delete_name for name_id=%, user_id=%: % %', 
  p_name_id, p_user_id, SQLSTATE, SQLERRM;

-- Return safe error response
RETURN jsonb_build_object(
'can_delete', false,
'reason', format('Internal error during deletion validation: %s', SQLERRM),
'reason_code', 'VALIDATION_ERROR',
'protection_type', 'error',
'name_count', 0,
'context_info', jsonb_build_object(
'public_contexts', '[]'::JSONB,
'permanent_contexts', '[]'::JSONB
)
);
END;
$$;

-- Function documentation

COMMENT ON FUNCTION public.can_delete_name(UUID, UUID) IS 
'Enhanced name deletion protection function.
Validates whether a name can be safely deleted with context-aware protection.';

-- Validation and testing setup

-- Create validation function to test enhanced protection logic
CREATE OR REPLACE FUNCTION public.validate_name_deletion_protection_setup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
v_function_exists BOOLEAN;
v_indexes_exist BOOLEAN;
v_test_result JSONB;
BEGIN
-- Check if enhanced function exists with correct signature
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'can_delete_name'
AND pg_get_function_result(p.oid) = 'jsonb'
) INTO v_function_exists;

-- Check if required indexes exist for performance
SELECT EXISTS (
SELECT 1 FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'context_oidc_assignments'
AND indexname = 'idx_context_oidc_assignments_user_context'
) INTO v_indexes_exist;

-- Test function with null parameters (should handle gracefully)
BEGIN
SELECT public.can_delete_name(
gen_random_uuid(), -- non-existent name_id
gen_random_uuid()  -- non-existent user_id
) INTO v_test_result;

-- Verify function returns proper error structure
IF v_test_result ? 'can_delete' 
   AND v_test_result ? 'reason' 
   AND v_test_result ? 'protection_type'
   AND v_test_result ? 'context_info' THEN
v_test_result := jsonb_build_object('test_passed', true);
ELSE
v_test_result := jsonb_build_object('test_passed', false);
END IF;
EXCEPTION
WHEN OTHERS THEN
v_test_result := jsonb_build_object('test_passed', false, 'error', SQLERRM);
END;

RETURN jsonb_build_object(
'enhanced_function_exists', v_function_exists,
'required_indexes_exist', v_indexes_exist,
'function_test_result', v_test_result,
'validation_timestamp', now(),
'status', CASE 
WHEN v_function_exists AND v_indexes_exist AND (v_test_result->>'test_passed')::boolean THEN 'READY'
ELSE 'ERROR'
END
);
END;
$$;

COMMENT ON FUNCTION public.validate_name_deletion_protection_setup() IS 
'Validation function to verify enhanced name deletion protection is properly configured.';

-- Log successful completion
DO $$
DECLARE
v_validation_result JSONB;
BEGIN
SELECT public.validate_name_deletion_protection_setup() INTO v_validation_result;

RAISE LOG 'Name Deletion Protection Enhancement COMPLETED';
RAISE LOG 'VALIDATION RESULT: %', v_validation_result;
END
$$;