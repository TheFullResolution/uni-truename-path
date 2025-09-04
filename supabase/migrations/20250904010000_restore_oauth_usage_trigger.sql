-- Restore Missing OAuth Usage Trigger
-- Purpose: Add back the missing oauth_usage_logging_trigger for resolve events
-- Issue: The existing trigger from migration 042 was not preserved in our latest migration

-- The original trigger logs "resolve" events when oauth_sessions.used_at
-- changes from NULL to a timestamp (indicating first usage of the session token)

-- ===
-- SECTION 1: CREATE MISSING TRIGGER FUNCTION  
-- ===

CREATE OR REPLACE FUNCTION public.log_oauth_usage_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
-- Only log when used_at changes from NULL to a timestamp (first use)
-- This prevents duplicate logging on subsequent function calls
IF OLD.used_at IS NULL AND NEW.used_at IS NOT NULL THEN
-- Insert into app_usage_log with session information
INSERT INTO public.app_usage_log (
profile_id,
client_id,
session_id,
action,
resource_type,
resource_id,
success,
created_at
) VALUES (
NEW.profile_id,
NEW.client_id,
NEW.id,
'resolve',
'oauth_session',
NEW.id::text,
true,
NEW.used_at  -- Use the actual usage timestamp
);

-- Log successful operation for debugging
RAISE LOG 'OAuth Usage: Auto-logged resolve action for client % (session %)', 
NEW.client_id, NEW.id;
END IF;

-- Return NEW to continue the UPDATE operation
RETURN NEW;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail the main operation
RAISE LOG 'OAuth Usage Trigger Error: Failed to log usage for session % - %', 
NEW.id, SQLERRM;
-- Return NEW to allow the main UPDATE to succeed
RETURN NEW;
END $$;

-- Add function documentation
COMMENT ON FUNCTION public.log_oauth_usage_trigger() IS 
'Trigger function for automatic OAuth usage logging. Runs when oauth_sessions.used_at 
changes from NULL to timestamp. Logs to app_usage_log with SECURITY DEFINER privileges. 
This is the original trigger from migration 042 that handles "resolve" events.';

-- ===
-- SECTION 2: CREATE MISSING TRIGGER
-- ===

-- Drop trigger if it exists (cleanup)
DROP TRIGGER IF EXISTS oauth_usage_logging_trigger ON public.oauth_sessions;

-- Create the trigger on oauth_sessions table
-- Runs AFTER UPDATE to ensure the used_at value is committed
CREATE TRIGGER oauth_usage_logging_trigger
AFTER UPDATE OF used_at ON public.oauth_sessions
FOR EACH ROW
EXECUTE FUNCTION public.log_oauth_usage_trigger();

-- Add trigger documentation
COMMENT ON TRIGGER oauth_usage_logging_trigger ON public.oauth_sessions IS 
'Automatic OAuth usage logging trigger. Fires when used_at field is updated 
from NULL to a timestamp, indicating first usage of the session token. 
Provides atomic logging with OAuth resolution for security and reliability.';

-- ===
-- SECTION 3: GRANT PERMISSIONS
-- ===

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_oauth_usage_trigger() TO authenticated;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.log_oauth_usage_trigger() TO service_role;

-- ===
-- SECTION 4: VALIDATE TRIGGER RESTORATION
-- ===

DO $$
DECLARE
trigger_exists boolean;
function_exists boolean;
BEGIN
-- Check if trigger exists
SELECT EXISTS (
SELECT 1 FROM pg_trigger 
WHERE tgname = 'oauth_usage_logging_trigger'
AND tgrelid = 'public.oauth_sessions'::regclass
) INTO trigger_exists;

-- Check if function exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'log_oauth_usage_trigger'
) INTO function_exists;

-- Validate restoration
IF NOT trigger_exists THEN
RAISE EXCEPTION 'OAuth Usage Trigger: Restoration failed - trigger not created';
END IF;

IF NOT function_exists THEN
RAISE EXCEPTION 'OAuth Usage Trigger: Restoration failed - function not created';
END IF;

RAISE LOG 'OAuth Usage Trigger: Successfully restored missing trigger';
RAISE LOG 'Trigger: oauth_usage_logging_trigger → oauth_sessions.used_at updates';
RAISE LOG 'Function: log_oauth_usage_trigger() with SECURITY DEFINER';
END
$$;

-- ===
-- FINAL COMPLETION LOG
-- ===

DO $$
BEGIN
RAISE LOG 'OAuth Usage Trigger Restoration: Migration completed successfully';
RAISE LOG '';
RAISE LOG '✅ COMPLETE OAUTH EVENT COVERAGE RESTORED:';
RAISE LOG '  • authorize: oauth_session_creation_logging_trigger (INSERT)';
RAISE LOG '  • resolve: oauth_usage_logging_trigger (UPDATE used_at)';
RAISE LOG '  • revoke: oauth_session_deletion_logging_trigger (DELETE)';
RAISE LOG '  • assign_context: app_context_assignment_logging_trigger (INSERT/DELETE)';
RAISE LOG '';
RAISE LOG '⚡ ALL OAUTH EVENTS NOW AUTOMATICALLY LOGGED VIA DATABASE TRIGGERS';
END
$$;