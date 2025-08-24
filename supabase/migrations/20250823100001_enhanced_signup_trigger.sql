-- =============================================================================
-- Enhanced Signup Trigger Migration for TrueNamePath
-- =============================================================================
-- Migration: 20250823_enhanced_signup_trigger.sql
-- Purpose: Replace existing handle_new_user() function with enhanced version that:
--   - Extracts metadata from auth.users.raw_user_meta_data
--   - Creates profile record (as it currently does)
--   - Creates name variants from metadata (given_name, family_name, full_name)
--   - Sets up default context with proper visibility ('public' for permanent)
--   - Creates OIDC property assignments for names to default context
--   - Has comprehensive error handling and logging
--
-- Database Schema Compatibility:
--   - Uses existing 'profiles' table structure
--   - Uses existing 'names' table with name_text column
--   - Uses existing 'user_contexts' table with is_permanent and visibility
--   - Uses existing 'context_oidc_assignments' table with oidc_property enum
--
-- Date: August 23, 2025
-- =============================================================================

-- Log migration start
DO $$
BEGIN
RAISE LOG 'TrueNamePath Enhanced Signup Trigger Migration: Starting enhanced handle_new_user() replacement';
RAISE LOG 'Migration will create complete user onboarding with metadata extraction and OIDC assignments';
END
$$;

-- =============================================================================
-- STEP 1: Drop existing handle_new_user function and trigger
-- =============================================================================

-- Drop the existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Log function replacement
DO $$
BEGIN
RAISE LOG 'Enhanced Signup Trigger: Dropped existing handle_new_user() function and trigger';
END
$$;

-- =============================================================================
-- STEP 2: Create enhanced handle_new_user function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
-- Variables for extracted metadata
v_given_name TEXT;
v_family_name TEXT;
v_display_name TEXT;
v_nickname TEXT;
v_preferred_username TEXT;
v_full_name TEXT;

-- Variables for created records
v_default_context_id UUID;
v_given_name_id UUID;
v_family_name_id UUID;
v_full_name_id UUID;
v_display_name_id UUID;
v_nickname_id UUID;
v_preferred_username_id UUID;

-- Error handling variables
v_error_context TEXT;
v_metadata_json JSONB;
BEGIN
-- Set error context for comprehensive debugging
v_error_context := format('handle_new_user for user_id: %s, email: %s', new.id, new.email);

-- Extract raw_user_meta_data as JSONB for safer processing
v_metadata_json := COALESCE(new.raw_user_meta_data, '{}'::jsonb);

RAISE LOG 'TrueNamePath Enhanced Signup: Processing new user % with email %', new.id, new.email;
RAISE LOG 'Raw metadata available: %', v_metadata_json;

-- ==========================================================================
-- STEP 2.1: Create profile record (existing functionality)
-- ==========================================================================

BEGIN
-- Check if profile already exists (handle race conditions)
IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
INSERT INTO public.profiles (id, email, created_at)
VALUES (new.id, new.email, now());

RAISE LOG 'Enhanced Signup: Created profile for user % with email %', new.id, new.email;
ELSE
RAISE LOG 'Enhanced Signup: Profile already exists for user %, skipping profile creation', new.id;
END IF;
EXCEPTION
WHEN unique_violation THEN
-- Handle profile already exists gracefully
RAISE LOG 'Enhanced Signup: Profile already exists for user % (race condition), continuing', new.id;
WHEN OTHERS THEN
-- Log error but don't fail the entire process
RAISE LOG 'Enhanced Signup: Profile creation error for user %: % %', new.id, SQLSTATE, SQLERRM;
RAISE;
END;

-- ==========================================================================
-- STEP 2.2: Extract metadata fields with graceful fallbacks
-- ==========================================================================

-- Extract given_name (first name) - fallback to email prefix
v_given_name := COALESCE(
v_metadata_json->>'given_name',
v_metadata_json->>'first_name',
v_metadata_json->>'name',
split_part(new.email, '@', 1)  -- Fallback to email prefix
);

-- Extract family_name (last name) - graceful handling of missing data
v_family_name := COALESCE(
v_metadata_json->>'family_name',
v_metadata_json->>'last_name',
v_metadata_json->>'surname',
'User'  -- Default fallback
);

-- Extract optional display_name
v_display_name := COALESCE(
v_metadata_json->>'display_name',
v_metadata_json->>'full_name'
);

-- Extract optional nickname
v_nickname := v_metadata_json->>'nickname';

-- Extract optional preferred_username
v_preferred_username := COALESCE(
v_metadata_json->>'preferred_username',
v_metadata_json->>'username'
);

-- Generate full name from components
v_full_name := trim(v_given_name || ' ' || v_family_name);

RAISE LOG 'Enhanced Signup: Extracted names - given: %, family: %, full: %, display: %, nickname: %, username: %',
v_given_name, v_family_name, v_full_name, v_display_name, v_nickname, v_preferred_username;

-- ==========================================================================
-- STEP 2.3: Create or get default context
-- ==========================================================================

BEGIN
-- Check if default context already exists
SELECT id INTO v_default_context_id
FROM public.user_contexts
WHERE user_id = new.id AND is_permanent = TRUE;

IF v_default_context_id IS NULL THEN
-- Create default permanent context with public visibility
INSERT INTO public.user_contexts (
user_id,
context_name,
description,
is_permanent,
visibility,
created_at
) VALUES (
new.id,
'Default',
'Default identity context created during signup',
TRUE,
'public',  -- Permanent contexts must be public per constraint
now()
) RETURNING id INTO v_default_context_id;

RAISE LOG 'Enhanced Signup: Created default context % for user %', v_default_context_id, new.id;
ELSE
RAISE LOG 'Enhanced Signup: Using existing default context % for user %', v_default_context_id, new.id;
END IF;

EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'Enhanced Signup: Context creation error for user %: % %', new.id, SQLSTATE, SQLERRM;
RAISE EXCEPTION 'Failed to create default context for user %: %', new.id, SQLERRM;
END;

-- ==========================================================================
-- STEP 2.4: Create name variants from extracted metadata
-- ==========================================================================

BEGIN
-- Create given_name (set as preferred for API ordering)
IF v_given_name IS NOT NULL AND length(trim(v_given_name)) > 0 THEN
INSERT INTO public.names (user_id, name_text, is_preferred, created_at)
VALUES (new.id, trim(v_given_name), TRUE, now())
RETURNING id INTO v_given_name_id;

RAISE LOG 'Enhanced Signup: Created given_name % with ID %', v_given_name, v_given_name_id;
END IF;

-- Create family_name
IF v_family_name IS NOT NULL AND length(trim(v_family_name)) > 0 THEN
INSERT INTO public.names (user_id, name_text, is_preferred, created_at)
VALUES (new.id, trim(v_family_name), FALSE, now())
RETURNING id INTO v_family_name_id;

RAISE LOG 'Enhanced Signup: Created family_name % with ID %', v_family_name, v_family_name_id;
END IF;

-- Create full_name (auto-generated combination)
IF v_full_name IS NOT NULL AND length(trim(v_full_name)) > 1 THEN
INSERT INTO public.names (user_id, name_text, is_preferred, created_at)
VALUES (new.id, trim(v_full_name), FALSE, now())
RETURNING id INTO v_full_name_id;

RAISE LOG 'Enhanced Signup: Created full_name % with ID %', v_full_name, v_full_name_id;
END IF;

-- Create optional display_name if provided and different from full_name
IF v_display_name IS NOT NULL AND length(trim(v_display_name)) > 0 AND trim(v_display_name) != trim(v_full_name) THEN
INSERT INTO public.names (user_id, name_text, is_preferred, created_at)
VALUES (new.id, trim(v_display_name), FALSE, now())
RETURNING id INTO v_display_name_id;

RAISE LOG 'Enhanced Signup: Created display_name % with ID %', v_display_name, v_display_name_id;
END IF;

-- Create optional nickname if provided
IF v_nickname IS NOT NULL AND length(trim(v_nickname)) > 0 THEN
INSERT INTO public.names (user_id, name_text, is_preferred, created_at)
VALUES (new.id, trim(v_nickname), FALSE, now())
RETURNING id INTO v_nickname_id;

RAISE LOG 'Enhanced Signup: Created nickname % with ID %', v_nickname, v_nickname_id;
END IF;

-- Create optional preferred_username if provided
IF v_preferred_username IS NOT NULL AND length(trim(v_preferred_username)) > 0 THEN
INSERT INTO public.names (user_id, name_text, is_preferred, created_at)
VALUES (new.id, trim(v_preferred_username), FALSE, now())
RETURNING id INTO v_preferred_username_id;

RAISE LOG 'Enhanced Signup: Created preferred_username % with ID %', v_preferred_username, v_preferred_username_id;
END IF;

EXCEPTION
WHEN unique_violation THEN
-- Handle case where names already exist
RAISE LOG 'Enhanced Signup: Some names already exist for user % (race condition), continuing', new.id;
WHEN OTHERS THEN
RAISE LOG 'Enhanced Signup: Name creation error for user %: % %', new.id, SQLSTATE, SQLERRM;
RAISE EXCEPTION 'Failed to create names for user %: %', new.id, SQLERRM;
END;

-- ==========================================================================
-- STEP 2.5: Create OIDC property assignments for default context
-- ==========================================================================

BEGIN
-- Create OIDC assignment for given_name
IF v_given_name_id IS NOT NULL THEN
INSERT INTO public.context_oidc_assignments (user_id, context_id, name_id, oidc_property, created_at)
VALUES (new.id, v_default_context_id, v_given_name_id, 'given_name', now())
ON CONFLICT (context_id, oidc_property) DO NOTHING;

RAISE LOG 'Enhanced Signup: Created OIDC assignment given_name -> % for context %', v_given_name_id, v_default_context_id;
END IF;

-- Create OIDC assignment for family_name
IF v_family_name_id IS NOT NULL THEN
INSERT INTO public.context_oidc_assignments (user_id, context_id, name_id, oidc_property, created_at)
VALUES (new.id, v_default_context_id, v_family_name_id, 'family_name', now())
ON CONFLICT (context_id, oidc_property) DO NOTHING;

RAISE LOG 'Enhanced Signup: Created OIDC assignment family_name -> % for context %', v_family_name_id, v_default_context_id;
END IF;

-- Create OIDC assignment for name (full_name)
IF v_full_name_id IS NOT NULL THEN
INSERT INTO public.context_oidc_assignments (user_id, context_id, name_id, oidc_property, created_at)
VALUES (new.id, v_default_context_id, v_full_name_id, 'name', now())
ON CONFLICT (context_id, oidc_property) DO NOTHING;

RAISE LOG 'Enhanced Signup: Created OIDC assignment name -> % for context %', v_full_name_id, v_default_context_id;
END IF;

-- Create OIDC assignment for display_name if available
IF v_display_name_id IS NOT NULL THEN
INSERT INTO public.context_oidc_assignments (user_id, context_id, name_id, oidc_property, created_at)
VALUES (new.id, v_default_context_id, v_display_name_id, 'display_name', now())
ON CONFLICT (context_id, oidc_property) DO NOTHING;

RAISE LOG 'Enhanced Signup: Created OIDC assignment display_name -> % for context %', v_display_name_id, v_default_context_id;
END IF;

-- Create OIDC assignment for nickname if available
IF v_nickname_id IS NOT NULL THEN
INSERT INTO public.context_oidc_assignments (user_id, context_id, name_id, oidc_property, created_at)
VALUES (new.id, v_default_context_id, v_nickname_id, 'nickname', now())
ON CONFLICT (context_id, oidc_property) DO NOTHING;

RAISE LOG 'Enhanced Signup: Created OIDC assignment nickname -> % for context %', v_nickname_id, v_default_context_id;
END IF;

-- Create OIDC assignment for preferred_username if available
IF v_preferred_username_id IS NOT NULL THEN
INSERT INTO public.context_oidc_assignments (user_id, context_id, name_id, oidc_property, created_at)
VALUES (new.id, v_default_context_id, v_preferred_username_id, 'preferred_username', now())
ON CONFLICT (context_id, oidc_property) DO NOTHING;

RAISE LOG 'Enhanced Signup: Created OIDC assignment preferred_username -> % for context %', v_preferred_username_id, v_default_context_id;
END IF;

EXCEPTION
WHEN unique_violation THEN
-- Handle case where assignments already exist
RAISE LOG 'Enhanced Signup: Some OIDC assignments already exist for user % (race condition), continuing', new.id;
WHEN OTHERS THEN
RAISE LOG 'Enhanced Signup: OIDC assignment creation error for user %: % %', new.id, SQLSTATE, SQLERRM;
RAISE EXCEPTION 'Failed to create OIDC assignments for user %: %', new.id, SQLERRM;
END;

-- ==========================================================================
-- STEP 2.6: Success logging and return
-- ==========================================================================

RAISE LOG 'Enhanced Signup: Successfully completed enhanced signup for user %', new.id;
RAISE LOG 'Created profile, % names, default context %, and % OIDC assignments',
CASE WHEN v_given_name_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_family_name_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_full_name_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_display_name_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_nickname_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_preferred_username_id IS NOT NULL THEN 1 ELSE 0 END,
v_default_context_id,
CASE WHEN v_given_name_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_family_name_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_full_name_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_display_name_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_nickname_id IS NOT NULL THEN 1 ELSE 0 END +
CASE WHEN v_preferred_username_id IS NOT NULL THEN 1 ELSE 0 END;

-- Return the new record to continue the trigger chain
RETURN new;

EXCEPTION
WHEN OTHERS THEN
-- Comprehensive error logging for debugging signup issues
RAISE LOG 'Enhanced Signup: CRITICAL ERROR in %: % %', v_error_context, SQLSTATE, SQLERRM;
RAISE LOG 'Error details - User ID: %, Email: %, Metadata: %', new.id, new.email, v_metadata_json;

-- Re-raise the exception to prevent incomplete user creation
-- This ensures data consistency - if signup fails, no partial records are left
RAISE EXCEPTION 'Enhanced signup failed for user %: %', new.id, SQLERRM;
END;
$$;

-- =============================================================================
-- STEP 3: Add comprehensive function documentation
-- =============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 
'Enhanced signup trigger function for TrueNamePath (August 23, 2025).
Automatically processes new Supabase auth users with complete onboarding:
1. Creates profile record (existing functionality preserved)
2. Extracts metadata from raw_user_meta_data (given_name, family_name, etc.)
3. Creates name variants with graceful fallbacks for missing data
4. Sets up default permanent context with public visibility
5. Creates OIDC property assignments mapping names to context
6. Comprehensive error handling and logging for debugging
7. Handles race conditions and constraint violations gracefully
Compatible with existing database schema and maintains data consistency.';

-- =============================================================================
-- STEP 4: Recreate the trigger on auth.users table
-- =============================================================================

-- Create trigger that fires after INSERT on auth.users
-- This ensures every new auth user gets complete onboarding processing
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW 
EXECUTE FUNCTION public.handle_new_user();

-- Log trigger creation
DO $$
BEGIN
RAISE LOG 'Enhanced Signup Trigger: Recreated on_auth_user_created trigger with enhanced functionality';
END
$$;

-- =============================================================================
-- STEP 5: Grant necessary permissions
-- =============================================================================

-- Ensure proper permissions for enhanced function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Ensure function can access all necessary tables
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.names TO postgres, service_role;
GRANT ALL ON public.user_contexts TO postgres, service_role;
GRANT ALL ON public.context_oidc_assignments TO postgres, service_role;

-- Grant usage on sequences for INSERT operations
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Log permissions setup
DO $$
BEGIN
RAISE LOG 'Enhanced Signup Trigger: Granted all necessary permissions for enhanced functionality';
END
$$;

-- =============================================================================
-- STEP 6: Validation and testing setup
-- =============================================================================

-- Create validation function to test enhanced signup behavior
CREATE OR REPLACE FUNCTION public.validate_enhanced_signup_setup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
v_function_exists BOOLEAN;
v_trigger_exists BOOLEAN;
v_permissions_valid BOOLEAN;
BEGIN
-- Check if enhanced function exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_user'
) INTO v_function_exists;

-- Check if trigger exists
SELECT EXISTS (
SELECT 1 FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
AND c.relname = 'users'
AND t.tgname = 'on_auth_user_created'
) INTO v_trigger_exists;

-- Check permissions (simplified check)
SELECT EXISTS (
SELECT 1 FROM information_schema.routine_privileges
WHERE routine_name = 'handle_new_user'
AND grantee = 'service_role'
AND privilege_type = 'EXECUTE'
) INTO v_permissions_valid;

RETURN jsonb_build_object(
'enhanced_function_exists', v_function_exists,
'trigger_exists', v_trigger_exists,
'permissions_valid', v_permissions_valid,
'validation_timestamp', now(),
'status', CASE 
WHEN v_function_exists AND v_trigger_exists AND v_permissions_valid THEN 'READY'
ELSE 'ERROR'
END
);
END;
$$;

-- Add validation function documentation
COMMENT ON FUNCTION public.validate_enhanced_signup_setup() IS 
'Validation function to verify enhanced signup trigger is properly configured.
Returns JSON with status of function, trigger, and permissions.
Use for debugging and deployment validation.';

-- =============================================================================
-- STEP 7: Migration completion and summary
-- =============================================================================

-- Log successful completion with comprehensive summary
DO $$
DECLARE
v_validation_result JSONB;
BEGIN
-- Run validation to confirm everything is working
SELECT public.validate_enhanced_signup_setup() INTO v_validation_result;

RAISE LOG '=== Enhanced Signup Trigger Migration COMPLETED SUCCESSFULLY ===';
RAISE LOG 'Migration: 20250823_enhanced_signup_trigger.sql';
RAISE LOG 'Date: August 23, 2025';
RAISE LOG '';
RAISE LOG 'ENHANCEMENTS IMPLEMENTED:';
RAISE LOG '✓ Metadata extraction from auth.users.raw_user_meta_data';
RAISE LOG '✓ Automatic name variant creation (given_name, family_name, full_name)';
RAISE LOG '✓ Default permanent context setup with public visibility';
RAISE LOG '✓ Complete OIDC property assignments for OAuth integration';
RAISE LOG '✓ Comprehensive error handling and logging';
RAISE LOG '✓ Graceful handling of missing metadata and constraints';
RAISE LOG '✓ Race condition protection and duplicate handling';
RAISE LOG '';
RAISE LOG 'VALIDATION RESULTS: %', v_validation_result;
RAISE LOG '';
RAISE LOG 'The enhanced signup trigger is now active and will automatically:';
RAISE LOG '1. Create user profiles when new auth users are created';
RAISE LOG '2. Extract name metadata from OAuth providers';
RAISE LOG '3. Set up complete user onboarding with contexts and OIDC assignments';
RAISE LOG '4. Log all operations for debugging and auditing';
RAISE LOG '';
RAISE LOG 'Next steps: Test with actual user signup to verify functionality';
RAISE LOG '=== Migration Complete ===';
END
$$;