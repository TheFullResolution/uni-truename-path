-- Migration: Fix Performance Metrics Tracking
-- Purpose: Remove duplicate logging trigger that was causing 0ms response times
-- Date: September 3, 2025
--
-- Issue: The oauth_usage_logging_trigger was creating duplicate entries in app_usage_log
-- with response_time_ms = 0, while the API endpoints were also creating entries with
-- actual performance metrics. This was causing confusion in the audit logs.
--
-- Solution: Remove the trigger since we're properly logging from the API endpoints
-- with accurate performance metrics.

DO $$
BEGIN
RAISE LOG 'TrueNamePath Performance Fix: Starting migration to fix response_time_ms tracking';
END $$;

-- ===
-- SECTION 1: REMOVE DUPLICATE LOGGING TRIGGER
-- ===

-- Drop the trigger that was creating duplicate entries
DROP TRIGGER IF EXISTS oauth_usage_logging_trigger ON public.oauth_sessions;

-- Drop the trigger function as it's no longer needed
DROP FUNCTION IF EXISTS public.log_oauth_usage_trigger();

DO $$
BEGIN
RAISE LOG 'Performance Fix: Removed oauth_usage_logging_trigger and function';
RAISE LOG 'This eliminates duplicate app_usage_log entries with 0ms response times';
END $$;

-- ===
-- SECTION 2: CLEAN UP EXISTING DUPLICATE ENTRIES
-- ===

-- Remove duplicate entries where response_time_ms is 0 and there's a corresponding 
-- entry with actual performance metrics for the same session/action
DO $$
DECLARE
deleted_count integer;
BEGIN
-- Delete duplicate entries with 0ms where we have better entries with actual metrics
DELETE FROM public.app_usage_log 
WHERE response_time_ms = 0 
AND EXISTS (
SELECT 1 FROM public.app_usage_log inner_log
WHERE inner_log.profile_id = app_usage_log.profile_id
AND inner_log.client_id = app_usage_log.client_id
AND inner_log.action = app_usage_log.action
AND inner_log.session_id = app_usage_log.session_id
AND inner_log.response_time_ms > 0
AND inner_log.id != app_usage_log.id
);

GET DIAGNOSTICS deleted_count = ROW_COUNT;
RAISE LOG 'Performance Fix: Removed % duplicate entries with 0ms response times', deleted_count;
END $$;

-- ===
-- SECTION 3: MIGRATION VALIDATION
-- ===

-- Validate that the trigger is removed
DO $$
DECLARE
trigger_exists boolean;
function_exists boolean;
BEGIN
-- Check if trigger still exists
SELECT EXISTS (
SELECT 1 FROM pg_trigger 
WHERE tgname = 'oauth_usage_logging_trigger'
AND tgrelid = 'public.oauth_sessions'::regclass
) INTO trigger_exists;

-- Check if function still exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'log_oauth_usage_trigger'
) INTO function_exists;

-- Validate removal
IF trigger_exists THEN
RAISE EXCEPTION 'Performance Fix: Trigger validation failed - trigger still exists';
END IF;

IF function_exists THEN
RAISE EXCEPTION 'Performance Fix: Function validation failed - function still exists';
END IF;

RAISE LOG 'Performance Fix: All validation checks passed successfully';
END $$;

-- ===
-- SECTION 4: MIGRATION COMPLETION
-- ===

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath Performance Fix: Migration completed successfully';
RAISE LOG '';
RAISE LOG '✅ PERFORMANCE METRICS FIX:';
RAISE LOG '  • Removed duplicate logging trigger that caused 0ms entries';
RAISE LOG '  • Cleaned up existing duplicate entries with 0ms response times';
RAISE LOG '  • API endpoints now provide the only source of performance metrics';
RAISE LOG '';
RAISE LOG '✅ EXPECTED RESULTS:';
RAISE LOG '  • Audit logs will now show actual response times (>0ms)';
RAISE LOG '  • No more duplicate entries for resolve actions';
RAISE LOG '  • Performance monitoring will show realistic metrics';
RAISE LOG '';
RAISE LOG '⚡ READY: Performance metrics tracking is now accurate';
END $$;