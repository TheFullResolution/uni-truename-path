-- Migration: Fix Performance Measurement NULL Values
-- Fix trigger functions to use NULL instead of -1 for pending performance measurements
-- This resolves the check constraint violation that was preventing authorization logging

-- Update OAuth session creation trigger to use NULL
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
NULL, -- NULL for pending performance measurement (not -1)
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

-- Update OAuth resolve trigger to use NULL
CREATE OR REPLACE FUNCTION public.log_oauth_resolve_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
-- Insert resolve event into app_usage_log when session is used
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
'resolve',
'oauth_session',
OLD.id::text,
NULL, -- NULL for pending performance measurement
true,
NOW()
);

-- Log successful operation for debugging
RAISE LOG 'OAuth Usage: Auto-logged resolve action for client % (session %)', 
OLD.client_id, OLD.id;

-- Return NEW to continue the UPDATE operation
RETURN NEW;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail the main operation
RAISE LOG 'OAuth Session Resolve Trigger Error: Failed to log resolve for session % - %', 
OLD.id, SQLERRM;
-- Return NEW to allow the main UPDATE to succeed
RETURN NEW;
END;
$$;

-- Update context assignment trigger to use NULL
CREATE OR REPLACE FUNCTION public.log_context_assignment_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
-- Insert context assignment event into app_usage_log
INSERT INTO public.app_usage_log (
profile_id,
client_id,
session_id,
context_id,
action,
resource_type,
resource_id,
response_time_ms,
success,
created_at
) VALUES (
NEW.profile_id,
NEW.client_id,
NULL, -- No session_id for direct context assignments
NEW.context_id,
'assign_context',
'app_context_assignment',
NEW.id::text,
NULL, -- NULL for pending performance measurement
true,
NEW.created_at
);

-- Log successful operation for debugging
RAISE LOG 'OAuth Usage: Auto-logged assign_context action for client % (context %)', 
NEW.client_id, NEW.context_id;

-- Return NEW to continue the INSERT operation
RETURN NEW;

EXCEPTION
WHEN OTHERS THEN
-- Log error but don't fail the main operation
RAISE LOG 'Context Assignment Trigger Error: Failed to log assignment % - %', 
NEW.id, SQLERRM;
-- Return NEW to allow the main INSERT to succeed
RETURN NEW;
END;
$$;

-- Update the performance measurement function to handle NULL values properly
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
-- Match on resource_id which contains the request_id
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

-- Add comment to explain the change
COMMENT ON FUNCTION public.update_log_performance(text, integer) IS 
'Updates response_time_ms for pending measurements (NULL values) identified by request_id';

-- Add a comment to the migration
-- This migration fixes the authorization logging by using NULL instead of -1
-- for pending performance measurements, resolving check constraint violations