-- Migration: Create Authentication Events Table
-- Purpose: Add GDPR-compliant authentication event logging for login/logout/signup
-- Date: September 3, 2025
--
-- GDPR Compliance: Article 32 (Security of processing) requires logging authentication events
-- for security monitoring and incident detection.
--
-- This addresses the gaps identified in step-21-gdpr-compliance-gaps.md:
-- - Login Events (successful/failed)
-- - Logout Events (user-initiated/session expiry/forced)
-- - Signup/Registration Events

DO $$
BEGIN
RAISE LOG 'TrueNamePath GDPR Enhancement: Starting authentication events table creation';
END $$;

-- ===
-- SECTION 1: CREATE AUTH_EVENTS TABLE
-- ===

CREATE TABLE public.auth_events (
id bigserial PRIMARY KEY,
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
event_type varchar(50) NOT NULL,
ip_address inet,
user_agent text,
success boolean NOT NULL DEFAULT true,
error_message text,
session_id text, -- For tracking session-based events
metadata jsonb DEFAULT '{}'::jsonb, -- Additional event-specific data
created_at timestamptz NOT NULL DEFAULT now()
);

-- Add table documentation
COMMENT ON TABLE public.auth_events IS 
'GDPR-compliant authentication event logging for security monitoring and audit compliance. 
Tracks login, logout, and signup events as required by GDPR Article 32.';

COMMENT ON COLUMN public.auth_events.user_id IS 'User who performed the authentication action (FK to auth.users)';
COMMENT ON COLUMN public.auth_events.event_type IS 'Type of authentication event: login, logout, signup, failed_login, forced_logout';
COMMENT ON COLUMN public.auth_events.ip_address IS 'IP address of the authentication attempt for security monitoring';
COMMENT ON COLUMN public.auth_events.user_agent IS 'Browser/client user agent for security analysis';
COMMENT ON COLUMN public.auth_events.success IS 'Whether the authentication event was successful';
COMMENT ON COLUMN public.auth_events.error_message IS 'Error details for failed authentication attempts';
COMMENT ON COLUMN public.auth_events.session_id IS 'Session identifier for tracking session lifecycle';
COMMENT ON COLUMN public.auth_events.metadata IS 'Additional event metadata (e.g., provider, redirect_url, etc.)';

-- ===
-- SECTION 2: CREATE INDEXES
-- ===

-- Index for user-specific queries (dashboard, user audit trail)
CREATE INDEX idx_auth_events_user_time 
  ON public.auth_events (user_id, created_at DESC);

-- Index for event type analysis (security monitoring)
CREATE INDEX idx_auth_events_type_time 
  ON public.auth_events (event_type, created_at DESC);

-- Index for IP-based security analysis
CREATE INDEX idx_auth_events_ip_time 
  ON public.auth_events (ip_address, created_at DESC) 
  WHERE ip_address IS NOT NULL;

-- Index for failed events (security monitoring)
CREATE INDEX idx_auth_events_failures 
  ON public.auth_events (success, event_type, created_at DESC) 
  WHERE success = false;

-- Index for session tracking
CREATE INDEX idx_auth_events_session 
  ON public.auth_events (session_id) 
  WHERE session_id IS NOT NULL;

DO $$
BEGIN
RAISE LOG 'Auth Events: Created table with 5 performance indexes';
END $$;

-- ===
-- SECTION 3: ROW LEVEL SECURITY
-- ===

-- Enable RLS on the table
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own authentication events
CREATE POLICY "users_view_own_auth_events" ON public.auth_events
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can manage all auth events (for logging)
CREATE POLICY "service_manage_auth_events" ON public.auth_events
FOR ALL
USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.auth_events TO authenticated;
GRANT ALL ON public.auth_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.auth_events_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.auth_events_id_seq TO service_role;

DO $$
BEGIN
RAISE LOG 'Auth Events: RLS policies and permissions configured';
END $$;

-- ===
-- SECTION 4: AUTHENTICATION LOGGING FUNCTION
-- ===

CREATE OR REPLACE FUNCTION public.log_auth_event(
p_user_id uuid,
p_event_type varchar(50),
p_ip_address inet DEFAULT NULL,
p_user_agent text DEFAULT NULL,
p_success boolean DEFAULT true,
p_error_message text DEFAULT NULL,
p_session_id text DEFAULT NULL,
p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
event_id bigint;
BEGIN
-- Validate required parameters
IF p_user_id IS NULL OR p_event_type IS NULL THEN
RAISE EXCEPTION 'user_id and event_type are required parameters';
END IF;

-- Validate event type
IF p_event_type NOT IN ('login', 'logout', 'signup', 'failed_login', 'forced_logout', 'session_expired') THEN
RAISE EXCEPTION 'Invalid event_type. Must be: login, logout, signup, failed_login, forced_logout, session_expired';
END IF;

-- Insert authentication event
INSERT INTO public.auth_events (
user_id,
event_type,
ip_address,
user_agent,
success,
error_message,
session_id,
metadata
) VALUES (
p_user_id,
p_event_type,
p_ip_address,
p_user_agent,
p_success,
p_error_message,
p_session_id,
p_metadata
) RETURNING id INTO event_id;

-- Log successful operation for debugging
RAISE LOG 'Auth Event: Logged % event for user % (success: %, IP: %)', 
p_event_type, p_user_id, p_success, COALESCE(p_ip_address::text, 'unknown');

RETURN event_id;

EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'Auth Event Error: Failed to log % event for user % - %', 
p_event_type, p_user_id, SQLERRM;
RAISE;
END;
$$;

-- Function documentation
COMMENT ON FUNCTION public.log_auth_event IS 
'GDPR-compliant authentication event logging function. Records login, logout, and signup events
for security monitoring and audit compliance as required by GDPR Article 32.
Returns event ID on success, raises exception on failure.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_auth_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_auth_event TO service_role;

DO $$
BEGIN
RAISE LOG 'Auth Events: Created log_auth_event function with validation';
END $$;

-- ===
-- SECTION 5: MIGRATION VALIDATION
-- ===

-- Validate table creation and structure
DO $$
DECLARE
table_exists boolean;
index_count integer;
function_exists boolean;
policy_count integer;
BEGIN
-- Check if table exists
SELECT EXISTS (
SELECT 1 FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'auth_events'
) INTO table_exists;

-- Count indexes
SELECT COUNT(*) INTO index_count 
FROM pg_indexes 
WHERE tablename = 'auth_events' 
AND schemaname = 'public';

-- Check if function exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'log_auth_event'
) INTO function_exists;

-- Count RLS policies
SELECT COUNT(*) INTO policy_count
FROM pg_policies
WHERE tablename = 'auth_events'
AND schemaname = 'public';

-- Validate all components
IF NOT table_exists THEN
RAISE EXCEPTION 'Auth Events: Table validation failed - table not created';
END IF;

IF index_count < 5 THEN
RAISE EXCEPTION 'Auth Events: Index validation failed - Expected 5+ indexes, found %', index_count;
END IF;

IF NOT function_exists THEN
RAISE EXCEPTION 'Auth Events: Function validation failed - log_auth_event not created';
END IF;

IF policy_count < 2 THEN
RAISE EXCEPTION 'Auth Events: RLS validation failed - Expected 2+ policies, found %', policy_count;
END IF;

RAISE LOG 'Auth Events: All validation checks passed successfully';
RAISE LOG 'Table: auth_events created with % indexes', index_count;
RAISE LOG 'Function: log_auth_event created with parameter validation';
RAISE LOG 'Security: % RLS policies configured', policy_count;
END $$;

-- ===
-- SECTION 6: MIGRATION COMPLETION
-- ===

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath GDPR Enhancement: Migration completed successfully';
RAISE LOG '';
RAISE LOG '✅ AUTHENTICATION EVENTS LOGGING:';
RAISE LOG '  • Created auth_events table for GDPR Article 32 compliance';
RAISE LOG '  • Added performance indexes for user and security queries';
RAISE LOG '  • Configured RLS policies for data privacy';
RAISE LOG '  • Created log_auth_event function with validation';
RAISE LOG '';
RAISE LOG '✅ GDPR COMPLIANCE IMPROVEMENTS:';
RAISE LOG '  • Login events (successful/failed) - ready for logging';
RAISE LOG '  • Logout events (user/session/forced) - ready for logging';
RAISE LOG '  • Signup events with metadata - ready for logging';
RAISE LOG '  • IP address and user agent tracking for security';
RAISE LOG '';
RAISE LOG '🔐 READY FOR IMPLEMENTATION:';
RAISE LOG '  • Add calls to log_auth_event in authentication flows';
RAISE LOG '  • Include auth_events in user audit trail queries';
RAISE LOG '  • Enable security monitoring dashboard features';
RAISE LOG '';
RAISE LOG '⚡ NEXT STEPS: Implement authentication event logging in app code';
END $$;