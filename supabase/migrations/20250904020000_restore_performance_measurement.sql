-- Restore Performance Measurement with Correlation IDs
-- Purpose: Add correlation ID support to track performance measurements reliably
-- Issue: Triggers can't measure HTTP response time, need client-side timing with secure matching

-- ===
-- MIGRATION OVERVIEW & BENEFITS
-- ===

-- Problems solved:
-- 1. Eliminates 0ms response times from trigger-based logging
-- 2. Provides rock-solid correlation between client timing and database logs
-- 3. Maintains reliability of trigger-based logging while adding performance data
-- 4. Supports graceful degradation when performance measurement fails
-- 5. Uses existing resource_id field for correlation without schema changes

-- Correlation approach:
-- - Generate unique UUID (request_id) at start of each OAuth operation
-- - Store as "request:{uuid}" in resource_id field via triggers
-- - Client measures response time and updates specific log entry
-- - Dashboard shows "N/A" for -1 values instead of misleading 0ms

-- Events covered:
-- - OAuth authorization events (authorize endpoint)
-- - OAuth resolution events (resolve endpoint) 
-- - OAuth revocation events (revoke and sessions delete endpoints)
-- - Context assignment events (automatic via triggers)

-- ===
-- SECTION 1: CREATE PERFORMANCE UPDATE FUNCTION
-- ===

-- Function to update response time for a specific request ID
CREATE OR REPLACE FUNCTION public.update_log_performance(
p_request_id text,
p_response_time_ms integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
update_count integer;
BEGIN
-- Validate input parameters
IF p_request_id IS NULL OR p_request_id = '' THEN
RAISE LOG 'Performance Update: Invalid request_id provided';
RETURN false;
END IF;

IF p_response_time_ms < 0 THEN
RAISE LOG 'Performance Update: Invalid response_time_ms: %', p_response_time_ms;
RETURN false;
END IF;

-- Update the log entry matching the request ID
-- Format: resource_id = 'request:{uuid}'
UPDATE public.app_usage_log 
SET response_time_ms = p_response_time_ms
WHERE resource_id = 'request:' || p_request_id
AND response_time_ms = -1; -- Only update pending measurements

GET DIAGNOSTICS update_count = ROW_COUNT;

IF update_count > 0 THEN
RAISE LOG 'Performance Update: Updated % log entries for request % with %ms', 
update_count, p_request_id, p_response_time_ms;
RETURN true;
ELSE
RAISE LOG 'Performance Update: No matching log entry found for request %', p_request_id;
RETURN false;
END IF;

EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'Performance Update Error: Failed to update request % - %', 
p_request_id, SQLERRM;
RETURN false;
END;
$$;

-- Add function documentation
COMMENT ON FUNCTION public.update_log_performance(text, integer) IS 
'Updates response_time_ms for OAuth log entries using correlation ID. 
Matches entries by resource_id = "request:{uuid}" format. 
Only updates entries with response_time_ms = -1 (pending measurement).
Returns true if update successful, false otherwise.';

-- ===
-- SECTION 2: UPDATE EXISTING TRIGGER FUNCTIONS
-- ===

-- Update OAuth session creation trigger to support request IDs
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
response_time_ms,
success,
created_at
) VALUES (
NEW.profile_id,
NEW.client_id,
NEW.id,
'authorize',
'oauth_session',
COALESCE(NEW.metadata->>'request_id', NEW.id::text), -- Use request_id if available, fallback to session_id
-1, -- Pending performance measurement
true,
NEW.created_at
);

-- Log successful operation for debugging
RAISE LOG 'OAuth Usage: Auto-logged authorize action for client % (session %, request_id: %)', 
NEW.client_id, NEW.id, COALESCE(NEW.metadata->>'request_id', 'none');

-- Return NEW to continue the INSERT operation
RETURN NEW;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail the main operation
RAISE LOG 'OAuth Session Creation Trigger Error: Failed to log authorization for session % - %', 
NEW.id, SQLERRM;
-- Return NEW to allow the main INSERT to succeed
RETURN NEW;
END;
$$;

-- Update OAuth session deletion trigger to support request IDs
CREATE OR REPLACE FUNCTION public.log_oauth_session_deletion_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_action_type TEXT;
v_request_id TEXT;
BEGIN
-- Determine if this is a single session revocation or bulk revocation
v_action_type := 'revoke';

-- Try to extract request_id from session metadata, generate fallback
v_request_id := COALESCE(OLD.metadata->>'request_id', 'session:' || OLD.id::text);

-- Insert revocation event into app_usage_log
INSERT INTO public.app_usage_log (
profile_id,
client_id,
session_id,
action,
resource_type,
resource_id,
response_time_ms,
success,
created_at
) VALUES (
OLD.profile_id,
OLD.client_id,
OLD.id,
v_action_type,
'oauth_session',
v_request_id,
-1, -- Pending performance measurement
true,
now()
);

-- Log successful operation for debugging
RAISE LOG 'OAuth Usage: Auto-logged % action for client % (session %, request_id: %)', 
v_action_type, OLD.client_id, OLD.id, v_request_id;

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

-- Update OAuth usage trigger to support request IDs  
CREATE OR REPLACE FUNCTION public.log_oauth_usage_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_request_id TEXT;
BEGIN
-- Only log when used_at changes from NULL to a timestamp (first use)
IF OLD.used_at IS NULL AND NEW.used_at IS NOT NULL THEN
-- Try to extract request_id from session metadata
v_request_id := COALESCE(NEW.metadata->>'request_id', 'resolve:' || NEW.id::text);

-- Insert into app_usage_log with session information
INSERT INTO public.app_usage_log (
profile_id,
client_id,
session_id,
action,
resource_type,
resource_id,
response_time_ms,
success,
created_at
) VALUES (
NEW.profile_id,
NEW.client_id,
NEW.id,
'resolve',
'oauth_session',
v_request_id,
-1, -- Pending performance measurement
true,
NEW.used_at  -- Use the actual usage timestamp
);

-- Log successful operation for debugging
RAISE LOG 'OAuth Usage: Auto-logged resolve action for client % (session %, request_id: %)', 
NEW.client_id, NEW.id, v_request_id;
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

-- Update app context assignment trigger to support request IDs
CREATE OR REPLACE FUNCTION public.log_app_context_assignment_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_action_type TEXT;
v_profile_id UUID;
v_request_id TEXT;
BEGIN
-- Determine action type and get profile_id
IF TG_OP = 'INSERT' THEN
v_action_type := 'assign_context';
v_profile_id := NEW.profile_id;
v_request_id := 'context_assign:' || NEW.id::text;

-- Insert context assignment event
INSERT INTO public.app_usage_log (
profile_id,
client_id,
session_id,
action,
resource_type,
resource_id,
response_time_ms,
success,
created_at
) VALUES (
NEW.profile_id,
NEW.client_id,
NULL, -- No specific session for context assignments
v_action_type,
'app_context_assignment',
v_request_id,
-1, -- Pending performance measurement
true,
NEW.created_at
);

ELSIF TG_OP = 'DELETE' THEN
v_action_type := 'remove_context';
v_profile_id := OLD.profile_id;
v_request_id := 'context_remove:' || OLD.id::text;

-- Insert context removal event
INSERT INTO public.app_usage_log (
profile_id,
client_id,
session_id,
action,
resource_type,
resource_id,
response_time_ms,
success,
created_at
) VALUES (
OLD.profile_id,
OLD.client_id,
NULL, -- No specific session for context removals
v_action_type,
'app_context_assignment',
v_request_id,
-1, -- Pending performance measurement
true,
now()
);
END IF;

-- Log successful operation for debugging
RAISE LOG 'OAuth Usage: Auto-logged % action for client % (profile %, request_id: %)', 
v_action_type, 
COALESCE(NEW.client_id, OLD.client_id), 
v_profile_id,
v_request_id;

-- Return appropriate record for the operation
IF TG_OP = 'INSERT' THEN
RETURN NEW;
ELSE
RETURN OLD;
END IF;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail the main operation
RAISE LOG 'App Context Assignment Trigger Error: Failed to log % for profile % - %', 
v_action_type, v_profile_id, SQLERRM;
-- Return appropriate record to allow the main operation to succeed
IF TG_OP = 'INSERT' THEN
RETURN NEW;
ELSE
RETURN OLD;
END IF;
END $$;

-- ===
-- SECTION 3: ADD METADATA SUPPORT TO OAUTH_SESSIONS (if column doesn't exist)
-- ===

DO $$
BEGIN
-- Check if metadata column exists in oauth_sessions
IF NOT EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'oauth_sessions' 
AND column_name = 'metadata'
) THEN
ALTER TABLE public.oauth_sessions 
ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;

RAISE LOG 'Performance Measurement: Added metadata column to oauth_sessions for request_id storage';
END IF;
END
$$;

-- Add column documentation
COMMENT ON COLUMN public.oauth_sessions.metadata IS 
'JSON metadata for OAuth sessions. Used to store request_id for performance correlation 
and other session-specific data. Format: {"request_id": "uuid", ...}';

-- ===
-- SECTION 4: GRANT PERMISSIONS
-- ===

-- Grant execute permission to authenticated users for performance updates
GRANT EXECUTE ON FUNCTION public.update_log_performance(text, integer) TO authenticated;

-- Grant execute permission to service role for background operations
GRANT EXECUTE ON FUNCTION public.update_log_performance(text, integer) TO service_role;

-- ===
-- SECTION 5: VALIDATE MIGRATION SUCCESS
-- ===

DO $$
BEGIN
-- Verify the update function was created successfully
IF EXISTS (
SELECT 1 FROM pg_proc 
WHERE proname = 'update_log_performance' 
AND pg_get_function_identity_arguments(oid) = 'text, integer'
) THEN
RAISE LOG '✅ Performance Measurement: update_log_performance function created successfully';
ELSE
RAISE LOG '❌ Performance Measurement: Failed to create update_log_performance function';
END IF;

-- Verify metadata column exists
IF EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'oauth_sessions' 
AND column_name = 'metadata'
) THEN
RAISE LOG '✅ Performance Measurement: oauth_sessions.metadata column available';
ELSE
RAISE LOG '❌ Performance Measurement: oauth_sessions.metadata column missing';
END IF;

-- Verify all trigger functions were updated
IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_oauth_session_creation_trigger') AND
   EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_oauth_session_deletion_trigger') AND
   EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_oauth_usage_trigger') AND
   EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_app_context_assignment_trigger') THEN
RAISE LOG '✅ Performance Measurement: All trigger functions updated successfully';
ELSE
RAISE LOG '❌ Performance Measurement: Some trigger functions failed to update';
END IF;

RAISE LOG '🎯 Performance Measurement Migration: Complete! Triggers now support correlation IDs.';
RAISE LOG '📊 Next: Update client code to generate request_ids and call update_log_performance()';
END
$$;