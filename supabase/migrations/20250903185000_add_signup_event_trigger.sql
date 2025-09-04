-- ===================================================================
-- Migration: Add Server-Side Signup Event Trigger
-- Date: September 3, 2025  
-- Purpose: Add trigger to automatically log signup events when users are created
-- ===================================================================

BEGIN;

-- ===
-- SECTION 1: CREATE SIGNUP TRIGGER FUNCTION
-- ===

-- Create trigger function for automatic signup logging
CREATE OR REPLACE FUNCTION public.log_auth_signup_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
-- Log signup event when new user is created in auth.users
INSERT INTO public.auth_events (
user_id,
event_type,
success,
metadata,
created_at
) VALUES (
NEW.id,
'signup',
true,
jsonb_build_object(
'email', NEW.email,
'provider', 'email',
'email_confirmed', NEW.email_confirmed_at IS NOT NULL,
'trigger_source', 'auth.users'
),
NEW.created_at
);

RAISE LOG 'Auth Trigger: Logged signup for user % (email %)', NEW.id, NEW.email;

RETURN NEW;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail user creation
RAISE LOG 'Auth Trigger Error: Failed to log signup for user % - %', NEW.id, SQLERRM;
RETURN NEW;
END;
$$;

-- Add function documentation
COMMENT ON FUNCTION public.log_auth_signup_trigger() IS 
'Trigger function for automatic signup event logging.
Fires when new users are created in auth.users table.
Uses SECURITY DEFINER to bypass RLS restrictions.';

DO $$
BEGIN
RAISE LOG 'Auth Event Enhancement: Created signup trigger function';
END $$;

-- ===
-- SECTION 2: ATTEMPT TO CREATE TRIGGER ON AUTH.USERS
-- ===

-- Try to create trigger on auth.users table
-- This may fail due to permissions, in which case we'll use alternative approach
DO $$
BEGIN
-- Attempt to create trigger on auth.users
EXECUTE '
CREATE TRIGGER log_signup_event
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.log_auth_signup_trigger()
';

RAISE LOG 'Auth Event Enhancement: Successfully created trigger on auth.users';

EXCEPTION
WHEN insufficient_privilege THEN
RAISE LOG 'Auth Event Enhancement: Cannot create trigger on auth.users (insufficient privileges)';
RAISE LOG 'Will use profile creation trigger as fallback for signup logging';
WHEN OTHERS THEN
RAISE LOG 'Auth Event Enhancement: Failed to create trigger on auth.users: %', SQLERRM;
RAISE LOG 'Will use profile creation trigger as fallback for signup logging';
END $$;

-- ===
-- SECTION 3: FALLBACK - ENHANCED PROFILE TRIGGER FOR SIGNUP LOGGING
-- ===

-- Create enhanced profile trigger that also logs signup events
-- This will be our fallback if we can't create triggers on auth.users
CREATE OR REPLACE FUNCTION public.log_profile_and_signup_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
-- Log signup event when new profile is created (indicates new user signup)
INSERT INTO public.auth_events (
user_id,
event_type,
success,
metadata,
created_at
) VALUES (
NEW.id,
'signup',
true,
jsonb_build_object(
'email', NEW.email,
'provider', 'email',
'trigger_source', 'profiles',
'profile_created', true
),
NEW.created_at
);

RAISE LOG 'Profile Trigger: Logged signup for user % via profile creation', NEW.id;

RETURN NEW;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail profile creation
RAISE LOG 'Profile Trigger Error: Failed to log signup for user % - %', NEW.id, SQLERRM;
RETURN NEW;
END;
$$;

-- Create trigger on profiles table as fallback
CREATE OR REPLACE TRIGGER log_profile_signup_event
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_profile_and_signup_trigger();

-- Add function documentation
COMMENT ON FUNCTION public.log_profile_and_signup_trigger() IS 
'Fallback trigger function for signup event logging via profile creation.
Fires when new profiles are created, indicating user signup.';

DO $$
BEGIN
RAISE LOG 'Auth Event Enhancement: Created fallback signup trigger on profiles table';
END $$;

-- ===
-- SECTION 4: GRANT PERMISSIONS
-- ===

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.log_auth_signup_trigger() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.log_profile_and_signup_trigger() TO postgres, service_role;

-- Grant permissions needed for triggers to access auth schema (if needed)
DO $$
BEGIN
GRANT SELECT ON auth.users TO postgres, service_role;
EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'Auth Event Enhancement: Could not grant auth.users permissions: %', SQLERRM;
END $$;

DO $$
BEGIN
RAISE LOG 'Auth Event Enhancement: Granted necessary permissions for trigger functions';
END $$;

-- ===
-- SECTION 5: VALIDATION
-- ===

-- Validate setup
DO $$
DECLARE
auth_trigger_exists boolean := false;
profile_trigger_exists boolean := false;
signup_function_exists boolean := false;
profile_function_exists boolean := false;
BEGIN
-- Check if auth.users trigger exists
SELECT EXISTS (
SELECT 1 FROM information_schema.triggers 
WHERE trigger_name = 'log_signup_event' 
AND event_object_table = 'users'
AND trigger_schema = 'auth'
) INTO auth_trigger_exists;

-- Check if profiles trigger exists
SELECT EXISTS (
SELECT 1 FROM information_schema.triggers 
WHERE trigger_name = 'log_profile_signup_event' 
AND event_object_table = 'profiles'
AND trigger_schema = 'public'
) INTO profile_trigger_exists;

-- Check if signup function exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'log_auth_signup_trigger'
) INTO signup_function_exists;

-- Check if profile function exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'log_profile_and_signup_trigger'
) INTO profile_function_exists;

-- Report results
IF auth_trigger_exists THEN
RAISE LOG 'Auth Event Enhancement: ✅ auth.users signup trigger active';
ELSE
RAISE LOG 'Auth Event Enhancement: ❌ auth.users signup trigger not created (expected)';
END IF;

IF profile_trigger_exists THEN
RAISE LOG 'Auth Event Enhancement: ✅ profiles signup trigger active (fallback)';
ELSE
RAISE EXCEPTION 'Auth Event Enhancement: profiles trigger validation failed';
END IF;

IF signup_function_exists AND profile_function_exists THEN
RAISE LOG 'Auth Event Enhancement: ✅ All trigger functions created successfully';
ELSE
RAISE EXCEPTION 'Auth Event Enhancement: Function validation failed';
END IF;

END $$;

-- ===
-- SECTION 6: MIGRATION COMPLETION
-- ===

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath Authentication Enhancement: Migration completed successfully';
RAISE LOG '';
RAISE LOG '✅ SERVER-SIDE SIGNUP LOGGING IMPLEMENTED:';
RAISE LOG '  • Created signup trigger function with SECURITY DEFINER';
RAISE LOG '  • Attempted auth.users trigger (may fail due to permissions)';
RAISE LOG '  • Added profiles trigger as reliable fallback';
RAISE LOG '  • All signup events will now be logged automatically';
RAISE LOG '';
RAISE LOG '✅ COMPREHENSIVE AUTH EVENT LOGGING NOW ACTIVE:';
RAISE LOG '  • Signup events: Logged via database triggers';
RAISE LOG '  • Login events: Logged via existing SECURITY DEFINER function';
RAISE LOG '  • Logout events: Logged via existing SECURITY DEFINER function';
RAISE LOG '';
RAISE LOG '📋 ARCHITECTURE IMPROVEMENT:';
RAISE LOG '  • Removed unreliable client-side logging code';
RAISE LOG '  • All auth events now logged server-side for reliability';
RAISE LOG '  • Events captured even if client fails or network issues occur';
RAISE LOG '';
RAISE LOG '🚀 SYSTEM READY: Complete authentication audit trail now operational!';
END $$;

COMMIT;