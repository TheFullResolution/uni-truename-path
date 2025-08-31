-- Purpose: Step 18 Session 7 - Auto-Population from Default Context
-- Description: Implement automatic population of new contexts with OIDC assignments from user's default context
-- Performance: <10ms operation time with atomic transactions

-- ===
-- OVERVIEW & REQUIREMENTS
-- ===

-- AUTO-POPULATION FROM DEFAULT CONTEXT:
-- This migration implements automatic population of new contexts with OIDC assignments
-- from the user's default (permanent) context when new contexts are created.
--
-- Source Context Selection:
-- • User's permanent public context (is_permanent = true, visibility = 'public')
-- • This context is created during signup with full OIDC assignments
-- • Contains all required properties: name, given_name, family_name
--
-- Target Context Requirements:
-- • Non-permanent contexts only (avoid recursion on default context creation)
-- • Newly inserted contexts via /api/contexts endpoint
-- • Empty contexts that need OIDC assignments for completeness
--
-- Implementation Design:
-- • auto_populate_context(new_context_id, user_id) function for atomic operations
-- • AFTER INSERT trigger on user_contexts table for automatic execution
-- • Comprehensive error handling and edge case management
-- • Performance optimized with indexed queries (<10ms requirement)
--
-- Benefits:
-- - New contexts automatically have required OIDC properties for completeness
-- - Reduces manual work for users to assign names to contexts
-- - Follows existing pattern of default context providing baseline assignments
-- - Note: Simple, maintainable auto-population logic

-- ===
-- SECTION 1: MIGRATION HEADER AND LOGGING
-- ===

DO $$
BEGIN
RAISE LOG 'TrueNamePath Step 18: Starting auto-populate context migration';
RAISE LOG 'Migration: 056_auto_populate_context - Automatic context population from default';
RAISE LOG 'Feature: New contexts automatically receive OIDC assignments from user default context';
RAISE LOG 'Performance: <10ms atomic operation with indexed queries on context_oidc_assignments';
END
$$;

-- ===
-- SECTION 2: AUTO-POPULATE CONTEXT FUNCTION
-- ===

-- Function to automatically populate new context with OIDC assignments from default context
-- Returns JSONB with operation status and details
CREATE OR REPLACE FUNCTION public.auto_populate_context(p_new_context_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
v_source_context_id UUID;
v_source_context_name TEXT;
v_target_context_name TEXT;
v_copied_assignments INTEGER := 0;
v_required_properties text[] := ARRAY['name', 'given_name', 'family_name'];
v_available_assignments INTEGER;
v_target_context_info record;
BEGIN
-- Validate input parameters
IF p_new_context_id IS NULL OR p_user_id IS NULL THEN
RETURN jsonb_build_object(
'success', false,
'error', 'invalid_parameters',
'message', 'Context ID and User ID are required'
);
END IF;

-- Get target context information and validate it exists
SELECT id, context_name, is_permanent, visibility, user_id
INTO v_target_context_info
FROM user_contexts
WHERE id = p_new_context_id AND user_id = p_user_id;

IF NOT FOUND THEN
RETURN jsonb_build_object(
'success', false,
'error', 'context_not_found',
'message', 'Target context does not exist or does not belong to user'
);
END IF;

-- Skip auto-population for permanent contexts to avoid recursion
-- Permanent contexts are populated during signup, not through this mechanism
IF v_target_context_info.is_permanent THEN
RETURN jsonb_build_object(
'success', true,
'skipped', true,
'reason', 'permanent_context',
'message', 'Permanent contexts are not auto-populated to avoid recursion'
);
END IF;

v_target_context_name := v_target_context_info.context_name;

-- Find user's permanent default context (source for assignments)
SELECT id, context_name INTO v_source_context_id, v_source_context_name
FROM user_contexts
WHERE user_id = p_user_id 
  AND is_permanent = TRUE 
  AND visibility = 'public';

-- Handle case where user has no default context (shouldn't happen after signup)
IF v_source_context_id IS NULL THEN
RETURN jsonb_build_object(
'success', false,
'error', 'no_default_context',
'message', format('User %s has no permanent default context. This indicates incomplete signup process.', p_user_id)
);
END IF;

-- Check if source context has any OIDC assignments
SELECT COUNT(*)::integer INTO v_available_assignments
FROM context_oidc_assignments
WHERE context_id = v_source_context_id AND user_id = p_user_id;

IF v_available_assignments = 0 THEN
RETURN jsonb_build_object(
'success', false,
'error', 'empty_source_context',
'message', format('Source context "%s" has no OIDC assignments to copy', v_source_context_name)
);
END IF;

-- Check if target context already has assignments (avoid overwriting)
IF EXISTS (
SELECT 1 FROM context_oidc_assignments 
WHERE context_id = p_new_context_id AND user_id = p_user_id
) THEN
RETURN jsonb_build_object(
'success', true,
'skipped', true,
'reason', 'context_has_assignments',
'message', format('Context "%s" already has OIDC assignments', v_target_context_name)
);
END IF;

-- Atomic operation: Copy all OIDC assignments from source to target context
BEGIN
INSERT INTO context_oidc_assignments (user_id, context_id, name_id, oidc_property, created_at)
SELECT 
p_user_id,
p_new_context_id,
coa.name_id,
coa.oidc_property,
now()
FROM context_oidc_assignments coa
WHERE coa.context_id = v_source_context_id 
  AND coa.user_id = p_user_id
ON CONFLICT (context_id, oidc_property) DO NOTHING;

-- Count successful assignments
GET DIAGNOSTICS v_copied_assignments = ROW_COUNT;

RAISE LOG 'Auto-Populate Context: Copied % OIDC assignments from context "%" (%) to context "%" (%)',
v_copied_assignments, v_source_context_name, v_source_context_id, v_target_context_name, p_new_context_id;

EXCEPTION
WHEN OTHERS THEN
-- Log error and return failure status
RAISE LOG 'Auto-Populate Context Error: Failed to copy assignments from % to %: % (SQLSTATE: %)',
v_source_context_id, p_new_context_id, SQLERRM, SQLSTATE;
RETURN jsonb_build_object(
'success', false,
'error', 'copy_failed',
'message', format('Failed to copy OIDC assignments: %s', SQLERRM),
'sqlstate', SQLSTATE
);
END;

-- Verify completeness of target context after population
DECLARE
v_is_complete boolean;
v_missing_properties text[];
BEGIN
-- Check if target context now has all required properties
SELECT public.is_context_complete(p_new_context_id) INTO v_is_complete;

-- Get missing properties for detailed reporting
IF NOT v_is_complete THEN
SELECT array_agg(required_prop ORDER BY required_prop)
INTO v_missing_properties
FROM unnest(v_required_properties) AS required_prop
WHERE required_prop NOT IN (
SELECT coa.oidc_property::text
FROM context_oidc_assignments coa
WHERE coa.context_id = p_new_context_id
);
END IF;

-- Return comprehensive success status with completion details
RETURN jsonb_build_object(
'success', true,
'context_id', p_new_context_id,
'context_name', v_target_context_name,
'source_context_id', v_source_context_id,
'source_context_name', v_source_context_name,
'assignments_copied', v_copied_assignments,
'available_assignments', v_available_assignments,
'completion_status', jsonb_build_object(
'is_complete', v_is_complete,
'missing_properties', COALESCE(v_missing_properties, ARRAY[]::text[]),
'total_required', array_length(v_required_properties, 1),
'completion_percentage', CASE 
WHEN v_is_complete THEN 100
ELSE ROUND(
((array_length(v_required_properties, 1) - COALESCE(array_length(v_missing_properties, 1), 0))::numeric / 
 array_length(v_required_properties, 1)::numeric) * 100, 2
)
END
),
'operation_timestamp', now()
);
END;

EXCEPTION
WHEN OTHERS THEN
-- Comprehensive error handling with context
RAISE LOG 'Auto-Populate Context: Critical Error for context % user %: % (SQLSTATE: %)', 
p_new_context_id, p_user_id, SQLERRM, SQLSTATE;
RETURN jsonb_build_object(
'success', false,
'error', 'critical_failure',
'message', format('Auto-population failed: %s', SQLERRM),
'sqlstate', SQLSTATE,
'context_id', p_new_context_id,
'user_id', p_user_id
);
END $$;

-- Add comprehensive function documentation
COMMENT ON FUNCTION public.auto_populate_context(UUID, UUID) IS 
'Auto-populates new context with OIDC assignments from user permanent default context.
Copies all OIDC assignments (name, given_name, family_name, etc.) from source to target context.
Designed for new context creation to ensure OIDC completeness without manual assignment.
Performance: <10ms atomic operation with comprehensive error handling and validation.
Used by auto_populate_new_context_trigger to automatically populate contexts on creation.';

-- ===
-- SECTION 3: AUTO-POPULATE TRIGGER FUNCTION
-- ===

-- Trigger function to automatically populate new contexts after insertion
CREATE OR REPLACE FUNCTION public.auto_populate_new_context_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_populate_result JSONB;
BEGIN
-- Only auto-populate non-permanent contexts to avoid recursion
-- Permanent contexts are populated during signup process
IF NOT NEW.is_permanent THEN
-- Call auto-populate function for the new context
SELECT public.auto_populate_context(NEW.id, NEW.user_id) INTO v_populate_result;

-- Log the result for debugging and monitoring
IF (v_populate_result->>'success')::boolean THEN
IF (v_populate_result ? 'skipped') AND (v_populate_result->>'skipped')::boolean THEN
RAISE LOG 'Auto-Populate Trigger: Skipped context "%" (%) - %', 
NEW.context_name, NEW.id, v_populate_result->>'reason';
ELSE
RAISE LOG 'Auto-Populate Trigger: Successfully populated context "%" (%) with % assignments', 
NEW.context_name, NEW.id, (v_populate_result->>'assignments_copied')::integer;
END IF;
ELSE
RAISE LOG 'Auto-Populate Trigger: Failed to populate context "%" (%): %', 
NEW.context_name, NEW.id, v_populate_result->>'message';
END IF;
ELSE
RAISE LOG 'Auto-Populate Trigger: Skipped permanent context "%" (%) - permanent contexts are not auto-populated', 
NEW.context_name, NEW.id;
END IF;

-- Always return NEW to allow the insert to proceed
-- Auto-population failure should not prevent context creation
RETURN NEW;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail the context creation
RAISE LOG 'Auto-Populate Trigger: Error processing context "%" (%): % (SQLSTATE: %)', 
NEW.context_name, NEW.id, SQLERRM, SQLSTATE;
-- Return NEW to allow context creation to succeed
RETURN NEW;
END $$;

-- Add trigger documentation
COMMENT ON FUNCTION public.auto_populate_new_context_trigger() IS 
'Trigger function to automatically populate new non-permanent contexts with OIDC assignments.
Fires AFTER INSERT on user_contexts table for each new context created.
Calls auto_populate_context function to copy assignments from user default context.
Designed to fail gracefully - context creation succeeds even if auto-population fails.
Avoids recursion by skipping permanent contexts (populated during signup).';

-- ===
-- SECTION 4: CREATE TRIGGER ON USER_CONTEXTS
-- ===

-- Create trigger that fires after new context insertion
DROP TRIGGER IF EXISTS auto_populate_new_context_trigger ON user_contexts;
CREATE TRIGGER auto_populate_new_context_trigger
AFTER INSERT ON user_contexts
FOR EACH ROW
EXECUTE FUNCTION auto_populate_new_context_trigger();

-- Log trigger creation
DO $$
BEGIN
RAISE LOG 'Auto-Populate Context: Created auto_populate_new_context_trigger on user_contexts table';
RAISE LOG 'Trigger will automatically populate new non-permanent contexts with OIDC assignments from default context';
END
$$;

-- ===
-- SECTION 5: GRANT PERMISSIONS
-- ===

-- Grant execute permissions to authenticated users for API access
GRANT EXECUTE ON FUNCTION public.auto_populate_context(UUID, UUID) TO authenticated;

-- Grant execute permissions to service role for administrative operations
GRANT EXECUTE ON FUNCTION public.auto_populate_context(UUID, UUID) TO service_role;

-- Log permissions granted
DO $$
BEGIN
RAISE LOG 'Auto-Populate Context: Granted function permissions to authenticated and service_role';
RAISE LOG '  • auto_populate_context() - manual context population function';
RAISE LOG '  • auto_populate_new_context_trigger() - automatic trigger function';
END
$$;

-- ===
-- SECTION 6: VALIDATE IMPLEMENTATION
-- ===

-- Comprehensive validation of the auto-populate context system
DO $$
DECLARE
v_function_exists boolean;
v_trigger_function_exists boolean;
v_trigger_exists boolean;
v_test_invalid_params JSONB;
v_test_invalid_context JSONB;
v_permissions_granted boolean;
BEGIN
-- Check if main function exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'auto_populate_context'
AND p.pronargs = 2
) INTO v_function_exists;

-- Check if trigger function exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'auto_populate_new_context_trigger'
AND p.pronargs = 0
) INTO v_trigger_function_exists;

-- Check if trigger exists on user_contexts table
SELECT EXISTS (
SELECT 1 FROM pg_trigger 
WHERE tgname = 'auto_populate_new_context_trigger'
AND tgrelid = 'public.user_contexts'::regclass
) INTO v_trigger_exists;

-- Test function with invalid parameters (should handle gracefully)
SELECT public.auto_populate_context(NULL, NULL) INTO v_test_invalid_params;

-- Test function with invalid context ID (should handle gracefully)
SELECT public.auto_populate_context('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
INTO v_test_invalid_context;

-- Check if permissions are granted to authenticated role
SELECT EXISTS (
SELECT 1 FROM information_schema.routine_privileges 
WHERE routine_name = 'auto_populate_context'
AND grantee = 'authenticated'
AND privilege_type = 'EXECUTE'
) INTO v_permissions_granted;

-- Validate all components exist
IF NOT v_function_exists THEN
RAISE EXCEPTION 'Auto-Populate Context: auto_populate_context function not found';
END IF;

IF NOT v_trigger_function_exists THEN
RAISE EXCEPTION 'Auto-Populate Context: auto_populate_new_context_trigger function not found';
END IF;

IF NOT v_trigger_exists THEN
RAISE EXCEPTION 'Auto-Populate Context: auto_populate_new_context_trigger trigger not found';
END IF;

-- Validate function behavior with invalid inputs
IF NOT (v_test_invalid_params ? 'success') OR (v_test_invalid_params->>'success')::boolean THEN
RAISE EXCEPTION 'Auto-Populate Context: auto_populate_context should handle NULL parameters gracefully';
END IF;

IF NOT (v_test_invalid_params->>'error' = 'invalid_parameters') THEN
RAISE EXCEPTION 'Auto-Populate Context: auto_populate_context should return invalid_parameters error for NULL inputs';
END IF;

IF NOT (v_test_invalid_context ? 'success') OR (v_test_invalid_context->>'success')::boolean THEN
RAISE EXCEPTION 'Auto-Populate Context: auto_populate_context should handle invalid context gracefully';
END IF;

IF NOT (v_test_invalid_context->>'error' = 'context_not_found') THEN
RAISE EXCEPTION 'Auto-Populate Context: auto_populate_context should return context_not_found error for invalid context';
END IF;

-- Validate permissions
IF NOT v_permissions_granted THEN
RAISE EXCEPTION 'Auto-Populate Context: Execute permissions not granted to authenticated role';
END IF;

RAISE LOG 'Auto-Populate Context: All validation checks passed successfully';
RAISE LOG '  • auto_populate_context() function validated';
RAISE LOG '  • auto_populate_new_context_trigger() trigger function validated';
RAISE LOG '  • auto_populate_new_context_trigger trigger validated';
RAISE LOG '  • Error handling validated for invalid parameters and contexts';
RAISE LOG '  • Execute permissions validated for authenticated role';
END
$$;

-- ===
-- SECTION 7: MIGRATION COMPLETION
-- ===

-- Final migration completion log with detailed summary
DO $$
BEGIN
RAISE LOG 'TrueNamePath Step 18: Migration 056 completed successfully';
RAISE LOG '';
RAISE LOG '🔄 AUTO-POPULATE CONTEXT SYSTEM ACTIVE:';
RAISE LOG '  • auto_populate_context(context_id, user_id) - Manual context population function';
RAISE LOG '  • auto_populate_new_context_trigger() - Automatic trigger on context creation';
RAISE LOG '  • auto_populate_new_context_trigger - AFTER INSERT trigger on user_contexts';
RAISE LOG '';
RAISE LOG '📋 AUTO-POPULATION RULES:';
RAISE LOG '  • SOURCE: User permanent default context (is_permanent = true, visibility = public)';
RAISE LOG '  • TARGET: New non-permanent contexts created via /api/contexts';
RAISE LOG '  • OPERATION: Copy all OIDC assignments from source to target context';
RAISE LOG '  • REQUIRED PROPERTIES: name, given_name, family_name (for completeness)';
RAISE LOG '  • RECURSION PREVENTION: Skip permanent contexts (populated during signup)';
RAISE LOG '';
RAISE LOG 'TECHNICAL IMPLEMENTATION:';
RAISE LOG '  • Atomic operation with comprehensive error handling and rollback';
RAISE LOG '  • Performance optimized with indexed queries (<10ms requirement)';
RAISE LOG '  • Graceful failure - context creation succeeds even if auto-population fails';
RAISE LOG '  • Conflict resolution with ON CONFLICT DO NOTHING for duplicate assignments';
RAISE LOG '  • SECURITY INVOKER for user-context operations with proper validation';
RAISE LOG '';
RAISE LOG '🔒 SECURITY & ERROR HANDLING:';
RAISE LOG '  • Input validation prevents injection and ensures context ownership';
RAISE LOG '  • Comprehensive error logging with detailed context information';
RAISE LOG '  • Edge case handling for missing default context or empty assignments';
RAISE LOG '  • Race condition protection with conflict resolution';
RAISE LOG '';
RAISE LOG 'ACADEMIC COMPLIANCE:';
RAISE LOG '  • Simple, maintainable auto-population logic within constraints';
RAISE LOG '  • Clear separation between manual function and automatic trigger';
RAISE LOG '  • Database-level automation reduces manual user work';
RAISE LOG '  • Educational demonstration of trigger-based automation patterns';
RAISE LOG '';
RAISE LOG '✅ READY FOR STEP 18 SESSION 8: Auto-population from default context operational';
RAISE LOG 'Next: Test new context creation via /api/contexts to verify auto-population';
RAISE LOG 'Integration: New contexts automatically receive OIDC assignments for completeness';
END
$$;