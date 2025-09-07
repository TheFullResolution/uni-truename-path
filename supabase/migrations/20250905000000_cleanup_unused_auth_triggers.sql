-- ===================================================================
-- Migration: Cleanup Unused Auth Event Triggers and Functions
-- Date: January 7, 2025  
-- Purpose: Remove unused trigger functions that were created but never successfully attached
-- Reason: Supabase doesn't allow triggers on auth.sessions/auth.users, so we use client-side logging
-- ===================================================================

BEGIN;

-- ===
-- SECTION 1: DROP UNUSED TRIGGERS
-- ===

-- Log what we're doing
DO $$
BEGIN
RAISE LOG 'TrueNamePath Database Cleanup: Starting removal of unused auth triggers and functions';
END $$;

-- Drop the profile signup trigger (redundant - we use client-side logging now)
DROP TRIGGER IF EXISTS log_profile_signup_event ON public.profiles;

-- Drop any failed attempts at auth.users triggers (these never worked due to permissions)
DROP TRIGGER IF EXISTS log_signup_event ON auth.users;
-- NOTE: on_auth_user_created is the ESSENTIAL profile creation trigger, DO NOT DROP

-- Drop any failed attempts at auth.sessions triggers (these never worked due to permissions)
DROP TRIGGER IF EXISTS log_auth_login_trigger ON auth.sessions;
DROP TRIGGER IF EXISTS log_auth_logout_trigger ON auth.sessions;

DO $$
BEGIN
RAISE LOG 'Auth Cleanup: Dropped unused triggers';
END $$;

-- ===
-- SECTION 2: DROP UNUSED FUNCTIONS
-- ===

-- Drop unused trigger functions that were never successfully attached
DROP FUNCTION IF EXISTS public.log_auth_login_trigger();
DROP FUNCTION IF EXISTS public.log_auth_logout_trigger();
DROP FUNCTION IF EXISTS public.log_auth_signup_trigger();
DROP FUNCTION IF EXISTS public.log_profile_and_signup_trigger();

DO $$
BEGIN
RAISE LOG 'Auth Cleanup: Dropped unused trigger functions';
END $$;

-- ===
-- SECTION 3: DOCUMENT WHAT WE'RE KEEPING
-- ===

DO $$
BEGIN
RAISE LOG 'Auth Cleanup: Keeping the following functions and triggers:';
RAISE LOG '  • log_auth_event() function - ACTIVE (used by client-side code)';
RAISE LOG '  • oauth_session_creation_logging_trigger - ACTIVE (OAuth authorize events)';
RAISE LOG '  • oauth_session_deletion_logging_trigger - ACTIVE (OAuth revoke events)';
RAISE LOG '  • oauth_usage_logging_trigger - ACTIVE (OAuth resolve events)';
RAISE LOG '  • app_context_assignment_logging_trigger - ACTIVE (OAuth context assignments)';
RAISE LOG '  • data_change_trigger on profiles, names, user_contexts, context_oidc_assignments - ACTIVE';
END $$;

-- ===
-- SECTION 4: VALIDATION
-- ===

DO $$
DECLARE
auth_event_function_exists boolean;
oauth_triggers_count integer;
data_triggers_count integer;
BEGIN
-- Verify that the key function still exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'log_auth_event'
) INTO auth_event_function_exists;

IF NOT auth_event_function_exists THEN
RAISE EXCEPTION 'CRITICAL: log_auth_event function was accidentally removed!';
END IF;

-- Verify profile creation trigger still exists (CRITICAL)
IF NOT EXISTS (
SELECT 1 FROM pg_trigger
WHERE tgname = 'on_auth_user_created'
) THEN
RAISE EXCEPTION 'CRITICAL: Profile creation trigger on_auth_user_created was accidentally removed!';
END IF;

-- Verify OAuth triggers still exist (should be 4 main OAuth triggers)
SELECT COUNT(*) FROM pg_trigger 
WHERE tgname LIKE '%oauth%logging%trigger'
INTO oauth_triggers_count;

IF oauth_triggers_count < 3 THEN
RAISE WARNING 'OAuth triggers count is low: % (expected 3+)', oauth_triggers_count;
END IF;

-- Verify data change triggers still exist
SELECT COUNT(*) FROM pg_trigger 
WHERE tgname = 'data_change_trigger'
INTO data_triggers_count;

IF data_triggers_count < 4 THEN
RAISE WARNING 'Data change triggers count is low: % (expected 4)', data_triggers_count;
END IF;

RAISE LOG 'Auth Cleanup Validation: ✅ All critical functions and triggers intact';
RAISE LOG 'Active OAuth triggers: %', oauth_triggers_count;
RAISE LOG 'Active data change triggers: %', data_triggers_count;
END $$;

-- ===
-- SECTION 5: CLEANUP COMPLETION
-- ===

DO $$
BEGIN
RAISE LOG 'TrueNamePath Database Cleanup: Migration completed successfully';
RAISE LOG '';
RAISE LOG '🗑️  REMOVED UNUSED INFRASTRUCTURE:';
RAISE LOG '  • log_auth_login_trigger() function (never attached)';
RAISE LOG '  • log_auth_logout_trigger() function (never attached)';
RAISE LOG '  • log_auth_signup_trigger() function (never attached)';
RAISE LOG '  • log_profile_and_signup_trigger() function (redundant)';
RAISE LOG '  • log_profile_signup_event trigger on profiles (redundant)';
RAISE LOG '';
RAISE LOG '✅ KEPT ACTIVE INFRASTRUCTURE:';
RAISE LOG '  • log_auth_event() - Client-side authentication logging';
RAISE LOG '  • OAuth event triggers - Automatic OAuth action logging';
RAISE LOG '  • Data change triggers - GDPR-compliant data change logging';
RAISE LOG '';
RAISE LOG '🎯 CURRENT AUTH EVENT ARCHITECTURE:';
RAISE LOG '  • Login/logout events: Client-side via log_auth_event() RPC';
RAISE LOG '  • OAuth events: Database triggers on oauth_sessions';
RAISE LOG '  • Signup events: Client-side via log_auth_event() RPC';
RAISE LOG '  • Data changes: Database triggers on core tables';
RAISE LOG '';
RAISE LOG '✨ DATABASE CLEANED: Unused auth infrastructure removed successfully';
END $$;

COMMIT;