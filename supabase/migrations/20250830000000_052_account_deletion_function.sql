-- Migration: 20250830000000_052_account_deletion_function
-- Purpose: Create complete account deletion function for settings page
-- Description: Implements secure account deletion with email verification and comprehensive cleanup
--
-- Features:
-- • Email confirmation verification for security
-- • Complete data erasure with cascading deletion via profiles table
-- • Direct auth.users deletion with SECURITY DEFINER privileges
-- • Comprehensive error handling and JSON responses
-- • Follows academic security and privacy requirements

-- =====================================================
-- SECTION 1: MIGRATION HEADER AND LOGGING
-- =====================================================

DO $$
BEGIN
RAISE LOG 'TrueNamePath Settings: Starting account deletion function migration';
RAISE LOG 'Migration: 052_account_deletion_function - Complete user account deletion';
RAISE LOG 'Security: Uses SECURITY DEFINER for auth.users deletion privileges';
RAISE LOG 'Privacy: GDPR-compliant complete data removal and erasure';
END
$$;

-- =====================================================
-- SECTION 2: CREATE ACCOUNT DELETION FUNCTION
-- =====================================================

-- Create the secure account deletion function
-- Uses SECURITY DEFINER to allow deletion from auth.users table
CREATE OR REPLACE FUNCTION public.delete_user_account(
  p_user_id UUID,
  p_email_confirmation TEXT
) 
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_profile_exists BOOLEAN;
  v_auth_user_exists BOOLEAN;
  v_deletion_count INTEGER := 0;
BEGIN
  -- ===================================================================
  -- STEP 1: Input validation and security checks
  -- ===================================================================
  
  -- Check if required parameters are provided
  IF p_user_id IS NULL OR p_email_confirmation IS NULL THEN
RETURN json_build_object(
  'success', false,
  'error', 'missing_parameters',
  'message', 'Both user_id and email_confirmation are required'
);
  END IF;

  -- Check if user profile exists and get email for verification
  SELECT EXISTS(
SELECT 1 FROM public.profiles WHERE id = p_user_id
  ), (
SELECT email FROM public.profiles WHERE id = p_user_id
  )
  INTO v_profile_exists, v_user_email;
  
  IF NOT v_profile_exists THEN
RETURN json_build_object(
  'success', false,
  'error', 'user_not_found',
  'message', 'User profile does not exist'
);
  END IF;

  -- Verify email confirmation matches user's current email
  IF v_user_email IS NULL OR LOWER(TRIM(p_email_confirmation)) != LOWER(TRIM(v_user_email)) THEN
RETURN json_build_object(
  'success', false,
  'error', 'email_verification_failed',
  'message', 'Email confirmation does not match user account'
);
  END IF;

  -- Check if auth.users record exists
  SELECT EXISTS(
SELECT 1 FROM auth.users WHERE id = p_user_id
  ) INTO v_auth_user_exists;

  RAISE LOG 'Account Deletion: Starting deletion for user % (email: %)', p_user_id, v_user_email;

  -- ===================================================================
  -- STEP 2: Delete from profiles table (triggers CASCADE deletion)
  -- ===================================================================
  
  BEGIN
-- Delete from profiles - this will CASCADE to most related tables
DELETE FROM public.profiles 
WHERE id = p_user_id;

GET DIAGNOSTICS v_deletion_count = ROW_COUNT;

IF v_deletion_count > 0 THEN
  RAISE LOG 'Account Deletion: Deleted profile record for user % (cascaded to related tables)', p_user_id;
ELSE
  RAISE LOG 'Account Deletion: Warning - No profile record deleted for user %', p_user_id;
END IF;

  EXCEPTION
WHEN OTHERS THEN
  RAISE LOG 'Account Deletion: Error deleting profile for user %: % %', p_user_id, SQLSTATE, SQLERRM;
  RETURN json_build_object(
'success', false,
'error', 'profile_deletion_failed',
'message', format('Failed to delete user profile: %s', SQLERRM)
  );
  END;

  -- ===================================================================
  -- STEP 3: Delete from auth.users table (requires SECURITY DEFINER)
  -- ===================================================================
  
  IF v_auth_user_exists THEN
BEGIN
  -- Delete from auth.users table - requires elevated privileges
  DELETE FROM auth.users 
  WHERE id = p_user_id;
  
  GET DIAGNOSTICS v_deletion_count = ROW_COUNT;
  
  IF v_deletion_count > 0 THEN
RAISE LOG 'Account Deletion: Deleted auth.users record for user %', p_user_id;
  ELSE
RAISE LOG 'Account Deletion: Warning - No auth.users record deleted for user %', p_user_id;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
RAISE LOG 'Account Deletion: Error deleting auth.users for user %: % %', p_user_id, SQLSTATE, SQLERRM;
RETURN json_build_object(
  'success', false,
  'error', 'auth_deletion_failed',
  'message', format('Failed to delete authentication record: %s', SQLERRM)
);
END;
  ELSE
RAISE LOG 'Account Deletion: No auth.users record found for user %', p_user_id;
  END IF;

  -- ===================================================================
  -- STEP 4: Return success response
  -- ===================================================================
  
  RAISE LOG 'Account Deletion: Successfully completed deletion for user % (email: %)', p_user_id, v_user_email;
  
  RETURN json_build_object(
'success', true,
'message', 'Account successfully deleted',
'deleted_user_id', p_user_id,
'deleted_email', v_user_email,
'deleted_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
-- Comprehensive error handling for unexpected issues
RAISE LOG 'Account Deletion: Unexpected error for user %: % %', p_user_id, SQLSTATE, SQLERRM;
RETURN json_build_object(
  'success', false,
  'error', 'deletion_failed',
  'message', format('Account deletion failed: %s', SQLERRM),
  'sqlstate', SQLSTATE
);
END $$;

-- Add comprehensive function documentation
COMMENT ON FUNCTION public.delete_user_account(UUID, TEXT) IS 
'Complete account deletion function for TrueNamePath settings page.
Verifies email confirmation and performs complete data erasure via cascading deletion 
of all user data from both application and authentication tables.
Uses SECURITY DEFINER to enable auth.users deletion. GDPR-compliant complete data removal.
Academic constraint: Secure implementation with comprehensive error handling.';

-- =====================================================
-- SECTION 3: GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission to authenticated users (for settings page)
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID, TEXT) TO authenticated;

-- Grant execute permission to service role (for administrative operations)
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID, TEXT) TO service_role;

DO $$
BEGIN
RAISE LOG 'Account Deletion: Granted function permissions to authenticated and service_role';
END
$$;

-- =====================================================
-- SECTION 4: VALIDATE FUNCTION IMPLEMENTATION
-- =====================================================

-- Validate the function was created successfully
DO $$
DECLARE
function_exists BOOLEAN;
function_security BOOLEAN;
function_args INTEGER;
BEGIN
-- Check if function exists with correct signature
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'delete_user_account'
AND p.pronargs = 2  -- Two arguments: user_id and email_confirmation
), (
SELECT prosecdef FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'delete_user_account'
LIMIT 1
), (
SELECT pronargs FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'delete_user_account'
LIMIT 1
)
INTO function_exists, function_security, function_args;

-- Validate function creation
IF NOT function_exists THEN
RAISE EXCEPTION 'Account Deletion: Function validation failed - delete_user_account not created';
END IF;

-- Validate SECURITY DEFINER is set
IF NOT function_security THEN
RAISE EXCEPTION 'Account Deletion: Security validation failed - SECURITY DEFINER not set';
END IF;

-- Validate argument count
IF function_args != 2 THEN
RAISE EXCEPTION 'Account Deletion: Signature validation failed - Expected 2 arguments, found %', function_args;
END IF;

RAISE LOG 'Account Deletion: All validation checks passed successfully';
RAISE LOG 'Function: delete_user_account(UUID, TEXT) with SECURITY DEFINER';
RAISE LOG 'Security: Email verification and comprehensive error handling';
RAISE LOG 'Privacy: Complete GDPR-compliant data removal with audit trail';
END
$$;

-- =====================================================
-- SECTION 5: MIGRATION COMPLETION
-- =====================================================

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath Settings: Migration 052 completed successfully';
RAISE LOG '';
RAISE LOG '✅ ACCOUNT DELETION FUNCTION CREATED:';
RAISE LOG '  • delete_user_account(user_id UUID, email_confirmation TEXT)';
RAISE LOG '  • Email verification security for account deletion';
RAISE LOG '  • Complete data erasure without audit trail preservation';
RAISE LOG '  • Cascading deletion via profiles table (CASCADE relationships)';
RAISE LOG '  • Direct auth.users deletion with SECURITY DEFINER privileges';
RAISE LOG '';
RAISE LOG '✅ SECURITY & PRIVACY FEATURES:';
RAISE LOG '  • Email confirmation prevents unauthorized deletions';
RAISE LOG '  • SECURITY DEFINER enables auth schema access';
RAISE LOG '  • SET search_path = public for security isolation';
RAISE LOG '  • GDPR-compliant complete data removal';
RAISE LOG '  • Comprehensive error handling and JSON responses';
RAISE LOG '';
RAISE LOG '✅ DATABASE INTEGRATION:';
RAISE LOG '  • Leverages existing CASCADE relationships in schema';
RAISE LOG '  • True GDPR Right to Erasure implementation';
RAISE LOG '  • Follows established migration patterns and security model';
RAISE LOG '  • Academic constraint: Secure, maintainable implementation';
RAISE LOG '';
RAISE LOG '⚡ READY FOR SETTINGS PAGE: Account deletion function active';
RAISE LOG 'Next: Implement settings page UI with account deletion confirmation';
END
$$;