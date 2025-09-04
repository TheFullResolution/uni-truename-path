-- Migration: Fix update_log_performance function
-- Fix the function to match actual data storage patterns:
-- 1. Remove 'request:' prefix expectation
-- 2. Check for NULL instead of -1

CREATE OR REPLACE FUNCTION public.update_log_performance(
p_request_id text,
p_response_time_ms integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
-- Validate input parameters
IF p_request_id IS NULL OR p_request_id = '' THEN
RAISE LOG 'Performance Update Error: request_id is required';
RETURN false;
END IF;

IF p_response_time_ms IS NULL OR p_response_time_ms < 0 THEN
RAISE LOG 'Performance Update Error: response_time_ms must be >= 0, got %', p_response_time_ms;
RETURN false;
END IF;

-- Update the log entry with performance data
-- Match on resource_id which contains the plain request_id (no prefix)
UPDATE public.app_usage_log 
SET response_time_ms = p_response_time_ms
WHERE resource_id = p_request_id 
  AND response_time_ms IS NULL; -- Only update pending measurements (NULL)

-- Check if any rows were updated
IF FOUND THEN
RAISE LOG 'Performance Update: Successfully updated % with %ms', p_request_id, p_response_time_ms;
RETURN true;
ELSE
RAISE LOG 'Performance Update Warning: No pending measurement found for request_id %', p_request_id;
RETURN false;
END IF;

EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'Performance Update Error: Failed to update % - %', p_request_id, SQLERRM;
RETURN false;
END;
$$;

-- Add comment to explain the fix
COMMENT ON FUNCTION public.update_log_performance(text, integer) IS 
'Updates response_time_ms for pending measurements (NULL values) identified by plain request_id (no prefix)';