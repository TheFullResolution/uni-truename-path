-- Migration: Fix OAuth logging RLS policy issue
-- Description: Change log_app_usage function to SECURITY DEFINER to bypass RLS restrictions
-- 
-- Problem: The log_app_usage function runs with INVOKER security, meaning it executes 
-- with the caller's permissions. When /api/oauth/resolve uses anon key client and calls 
-- log_app_usage, it fails because only service_role can INSERT into app_usage_log due to RLS.
--
-- Solution: Use SECURITY DEFINER so the function executes with the function owner's 
-- permissions (postgres role), allowing it to bypass RLS and successfully log OAuth usage.

-- Fix the main log_app_usage function (with app_name parameter)
ALTER FUNCTION log_app_usage(uuid, varchar, varchar, uuid, uuid, int, boolean, varchar) 
SECURITY DEFINER;

-- Fix the legacy log_app_usage function (without app_name parameter) 
ALTER FUNCTION log_app_usage(uuid, uuid, varchar, uuid, uuid, int, boolean, varchar) 
SECURITY DEFINER;

-- Add comments explaining the security model
COMMENT ON FUNCTION log_app_usage(uuid, varchar, varchar, uuid, uuid, int, boolean, varchar) IS 
'OAuth usage logging function. Uses SECURITY DEFINER to bypass RLS restrictions when called from OAuth endpoints using anon key authentication. This is safe because the function only logs usage data and does not expose sensitive information.';

COMMENT ON FUNCTION log_app_usage(uuid, uuid, varchar, uuid, uuid, int, boolean, varchar) IS 
'Legacy OAuth usage logging function. Uses SECURITY DEFINER to bypass RLS restrictions when called from OAuth endpoints using anon key authentication. This is safe because the function only logs usage data and does not expose sensitive information.';