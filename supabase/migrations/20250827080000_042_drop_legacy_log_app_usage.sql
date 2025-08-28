-- Migration: Drop legacy log_app_usage function with app_id parameter
-- Description: Remove the outdated function that references the non-existent app_id column
--
-- Context: Migration 040 changed the app_usage_log table to use client_id instead of app_id,
-- and updated the log_app_usage function accordingly. However, the old version of the function
-- that uses app_id parameter was kept, causing linting errors since it tries to insert into
-- a non-existent app_id column.
--
-- Solution: Drop the legacy function since all application code has been updated to use
-- the correct p_client_id parameter.

-- Drop the legacy log_app_usage function that uses app_id parameter
DROP FUNCTION IF EXISTS public.log_app_usage(
uuid,   -- p_profile_id
uuid,   -- p_app_id (OLD - column no longer exists in app_usage_log)
varchar,-- p_action
uuid,   -- p_context_id
uuid,   -- p_session_id
integer,-- p_response_time_ms
boolean,-- p_success
varchar -- p_error_type
);

-- Log the cleanup completion
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Dropped legacy log_app_usage function with app_id parameter';
RAISE LOG '';
RAISE LOG '✅ FUNCTION CLEANUP COMPLETED:';
RAISE LOG '  • Removed legacy log_app_usage function that referenced non-existent app_id column';
RAISE LOG '  • All application code updated to use p_client_id parameter';
RAISE LOG '  • Database linting errors resolved';
END
$$;