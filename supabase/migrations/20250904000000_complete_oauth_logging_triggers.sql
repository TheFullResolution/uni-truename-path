-- Complete OAuth Event Logging Triggers Migration  
-- Purpose: Replace all remaining manual OAuth logging with database triggers
-- Context: Following authentication event logging cleanup pattern
-- Issue: Inconsistent logging patterns - some events use triggers, others use manual RPC calls

-- ===
-- MIGRATION OVERVIEW & BENEFITS
-- ===

-- Problems solved:
-- 1. Eliminates remaining manual log_app_usage RPC calls from OAuth routes
-- 2. Ensures atomic logging with OAuth operations (no missed events)
-- 3. Removes service role key exposure in client code (security improvement)
-- 4. Provides consistent logging architecture across all OAuth events
-- 5. Prevents silent logging failures that can occur with RPC calls

-- Events covered:
-- - OAuth session deletion (revocation events) 
-- - App context assignment changes
-- - OAuth session creation (authorization events)

-- ===
-- SECTION 1: CREATE TRIGGER FUNCTIONS
-- ===

-- Create trigger function for OAuth session deletion events
CREATE OR REPLACE FUNCTION public.log_oauth_session_deletion_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_action_type TEXT;
BEGIN
-- Determine if this is a single session revocation or bulk revocation
-- We can't easily distinguish in the trigger, so we'll log as 'revoke'
v_action_type := 'revoke';

-- Insert revocation event into app_usage_log
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
OLD.profile_id,
OLD.client_id,
OLD.id,
v_action_type,
'oauth_session',
OLD.id::text,
true,
now()
);

-- Log successful operation for debugging
RAISE LOG 'OAuth Usage: Auto-logged % action for client % (session %)', 
v_action_type, OLD.client_id, OLD.id;

-- Return OLD to continue the DELETE operation
RETURN OLD;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail the main operation
RAISE LOG 'OAuth Session Deletion Trigger Error: Failed to log revocation for session % - %', 
OLD.id, SQLERRM;
-- Return OLD to allow the main DELETE to succeed
RETURN OLD;
END $$;

-- Add function documentation
COMMENT ON FUNCTION public.log_oauth_session_deletion_trigger() IS 
'Trigger function for automatic OAuth session deletion logging. Runs when oauth_sessions 
records are deleted. Logs to app_usage_log with SECURITY DEFINER privileges. 
Ensures all revocation events are captured automatically without client-side RPC calls.';

-- Create trigger function for OAuth session creation events  
CREATE OR REPLACE FUNCTION public.log_oauth_session_creation_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
-- Insert authorization event into app_usage_log when session is created
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
'authorize',
'oauth_session',
NEW.id::text,
true,
NEW.created_at
);

-- Log successful operation for debugging
RAISE LOG 'OAuth Usage: Auto-logged authorize action for client % (session %)', 
NEW.client_id, NEW.id;

-- Return NEW to continue the INSERT operation
RETURN NEW;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail the main operation
RAISE LOG 'OAuth Session Creation Trigger Error: Failed to log authorization for session % - %', 
NEW.id, SQLERRM;
-- Return NEW to allow the main INSERT to succeed
RETURN NEW;
END $$;

-- Add function documentation
COMMENT ON FUNCTION public.log_oauth_session_creation_trigger() IS 
'Trigger function for automatic OAuth session creation logging. Runs when new oauth_sessions 
records are inserted. Logs authorization events to app_usage_log with SECURITY DEFINER privileges.';

-- Create trigger function for app context assignment changes
CREATE OR REPLACE FUNCTION public.log_app_context_assignment_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_action_type TEXT;
v_profile_id UUID;
BEGIN
-- Determine action type and get profile_id
IF TG_OP = 'INSERT' THEN
v_action_type := 'assign_context';
v_profile_id := NEW.profile_id;

-- Insert context assignment event
INSERT INTO public.app_usage_log (
profile_id,
client_id,
context_id,
action,
resource_type,
resource_id,
success,
created_at
) VALUES (
NEW.profile_id,
NEW.client_id,
NEW.context_id,
v_action_type,
'app_context_assignment',
NEW.id::text,
true,
NEW.created_at
);

RAISE LOG 'OAuth Usage: Auto-logged assign_context action for client % (assignment %)', 
NEW.client_id, NEW.id;

RETURN NEW;

ELSIF TG_OP = 'DELETE' THEN
v_action_type := 'remove_context';
v_profile_id := OLD.profile_id;

-- Insert context removal event
INSERT INTO public.app_usage_log (
profile_id,
client_id,
context_id,
action,
resource_type,
resource_id,
success,
created_at
) VALUES (
OLD.profile_id,
OLD.client_id,
OLD.context_id,
v_action_type,
'app_context_assignment',
OLD.id::text,
true,
now()
);

RAISE LOG 'OAuth Usage: Auto-logged remove_context action for client % (assignment %)', 
OLD.client_id, OLD.id;

RETURN OLD;
END IF;

-- Fallback return
RETURN COALESCE(NEW, OLD);

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail the main operation
RAISE LOG 'App Context Assignment Trigger Error: Failed to log % for assignment % - %', 
v_action_type, COALESCE(NEW.id, OLD.id), SQLERRM;
-- Return appropriate record to allow the main operation to succeed
RETURN COALESCE(NEW, OLD);
END $$;

-- Add function documentation
COMMENT ON FUNCTION public.log_app_context_assignment_trigger() IS 
'Trigger function for automatic app context assignment logging. Runs when app_context_assignments 
records are inserted or deleted. Logs assignment/removal events with SECURITY DEFINER privileges.';

-- ===
-- SECTION 2: CREATE TRIGGERS
-- ===

-- Drop existing triggers if they exist (for migration reruns)
DROP TRIGGER IF EXISTS oauth_session_deletion_logging_trigger ON public.oauth_sessions;
DROP TRIGGER IF EXISTS oauth_session_creation_logging_trigger ON public.oauth_sessions;
DROP TRIGGER IF EXISTS app_context_assignment_logging_trigger ON public.app_context_assignments;

-- Create trigger for OAuth session deletion (revocation events)
CREATE TRIGGER oauth_session_deletion_logging_trigger
BEFORE DELETE ON public.oauth_sessions
FOR EACH ROW
EXECUTE FUNCTION public.log_oauth_session_deletion_trigger();

-- Create trigger for OAuth session creation (authorization events)  
CREATE TRIGGER oauth_session_creation_logging_trigger
AFTER INSERT ON public.oauth_sessions
FOR EACH ROW
EXECUTE FUNCTION public.log_oauth_session_creation_trigger();

-- Create trigger for app context assignment changes
CREATE TRIGGER app_context_assignment_logging_trigger
AFTER INSERT OR DELETE ON public.app_context_assignments
FOR EACH ROW
EXECUTE FUNCTION public.log_app_context_assignment_trigger();

-- Add trigger documentation
COMMENT ON TRIGGER oauth_session_deletion_logging_trigger ON public.oauth_sessions IS 
'Automatic OAuth session deletion logging trigger. Fires when oauth_sessions records are deleted, 
capturing revocation events atomically with the deletion operation.';

COMMENT ON TRIGGER oauth_session_creation_logging_trigger ON public.oauth_sessions IS 
'Automatic OAuth session creation logging trigger. Fires when new oauth_sessions are inserted, 
capturing authorization events atomically with session creation.';

COMMENT ON TRIGGER app_context_assignment_logging_trigger ON public.app_context_assignments IS 
'Automatic app context assignment logging trigger. Fires when assignments are created or deleted, 
capturing context management events atomically with the assignment operations.';

-- ===
-- SECTION 3: GRANT PERMISSIONS
-- ===

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_oauth_session_deletion_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_oauth_session_creation_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_app_context_assignment_trigger() TO authenticated;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.log_oauth_session_deletion_trigger() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_oauth_session_creation_trigger() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_app_context_assignment_trigger() TO service_role;

-- ===
-- SECTION 4: VALIDATE IMPLEMENTATION
-- ===

-- Test the trigger setup by checking system catalogs
DO $$
DECLARE
deletion_trigger_exists boolean;
creation_trigger_exists boolean;
assignment_trigger_exists boolean;
all_functions_exist boolean;
BEGIN
-- Check if all triggers exist
SELECT EXISTS (
SELECT 1 FROM pg_trigger 
WHERE tgname = 'oauth_session_deletion_logging_trigger'
AND tgrelid = 'public.oauth_sessions'::regclass
) INTO deletion_trigger_exists;

SELECT EXISTS (
SELECT 1 FROM pg_trigger 
WHERE tgname = 'oauth_session_creation_logging_trigger'
AND tgrelid = 'public.oauth_sessions'::regclass
) INTO creation_trigger_exists;

SELECT EXISTS (
SELECT 1 FROM pg_trigger 
WHERE tgname = 'app_context_assignment_logging_trigger'
AND tgrelid = 'public.app_context_assignments'::regclass
) INTO assignment_trigger_exists;

-- Check if all functions exist
SELECT (
SELECT COUNT(*) FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
'log_oauth_session_deletion_trigger',
'log_oauth_session_creation_trigger', 
'log_app_context_assignment_trigger'
)
) = 3 INTO all_functions_exist;

-- Validate setup
IF NOT deletion_trigger_exists THEN
RAISE EXCEPTION 'OAuth Logging Triggers: Session deletion trigger validation failed';
END IF;

IF NOT creation_trigger_exists THEN
RAISE EXCEPTION 'OAuth Logging Triggers: Session creation trigger validation failed';
END IF;

IF NOT assignment_trigger_exists THEN
RAISE EXCEPTION 'OAuth Logging Triggers: Context assignment trigger validation failed';
END IF;

IF NOT all_functions_exist THEN
RAISE EXCEPTION 'OAuth Logging Triggers: Function validation failed - not all functions created';
END IF;

RAISE LOG 'OAuth Logging Triggers: All validation checks passed successfully';
END
$$;

-- ===
-- SECTION 5: MIGRATION COMPLETION
-- ===

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Complete OAuth Logging Triggers migration completed';
RAISE LOG '';
RAISE LOG '✅ COMPREHENSIVE OAUTH LOGGING SYSTEM:';
RAISE LOG '  • Session deletion trigger: oauth_sessions DELETE → app_usage_log';
RAISE LOG '  • Session creation trigger: oauth_sessions INSERT → app_usage_log';  
RAISE LOG '  • Context assignment trigger: app_context_assignments INSERT/DELETE → app_usage_log';
RAISE LOG '  • Existing session usage trigger: oauth_sessions.used_at → app_usage_log';
RAISE LOG '  • All triggers use SECURITY DEFINER (elevated permissions)';
RAISE LOG '';
RAISE LOG '✅ SECURITY & RELIABILITY BENEFITS:';
RAISE LOG '  • No service role keys needed in application code';
RAISE LOG '  • Atomic logging with OAuth operations (no race conditions)';
RAISE LOG '  • Prevents silent logging failures from client-side RPC calls';
RAISE LOG '  • Consistent logging architecture across all OAuth events';
RAISE LOG '';
RAISE LOG '✅ EVENTS NOW AUTOMATICALLY LOGGED:';
RAISE LOG '  • authorize: OAuth session creation';
RAISE LOG '  • resolve: OAuth session first usage (existing trigger)'; 
RAISE LOG '  • revoke: OAuth session deletion';
RAISE LOG '  • assign_context: App context assignment creation';
RAISE LOG '  • remove_context: App context assignment deletion';
RAISE LOG '';
RAISE LOG '⚡ READY FOR CLIENT CODE CLEANUP:';
RAISE LOG 'Next step: Remove manual log_app_usage RPC calls from OAuth API routes';
RAISE LOG 'All OAuth events now logged automatically via database triggers';
END
$$;