-- Migration: Context Usage Analytics for OIDC Demonstration
-- Creates context_usage_analytics table to track external OAuth/OIDC application usage
-- This replaces internal name resolution tracking with external context usage metrics
-- Part of Step 15: Reimagining Dashboard Statistics for Commercial Value

-- =============================================================================
-- STEP 1: Create context_usage_analytics table
-- =============================================================================

CREATE TABLE public.context_usage_analytics (
  id bigserial PRIMARY KEY,
  target_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  context_id uuid NOT NULL REFERENCES public.user_contexts(id) ON DELETE CASCADE,
  requesting_application varchar(100) NOT NULL, -- OAuth client_id or application name
  application_type varchar(50) NOT NULL DEFAULT 'oauth_client', -- oauth_client, oidc_client, api_integration
  scopes_requested text[] NOT NULL DEFAULT '{}', -- OAuth scopes like ['profile', 'email', 'name']
  properties_disclosed jsonb NOT NULL DEFAULT '{}', -- Actual data disclosed: {'name': 'John Doe', 'email': 'john@example.com'}
  response_time_ms integer NOT NULL DEFAULT 0, -- Response time in milliseconds
  success boolean NOT NULL DEFAULT true, -- Whether the request was successful
  error_type varchar(50), -- If failed: 'authorization_denied', 'invalid_scope', 'server_error'
  accessed_at timestamptz NOT NULL DEFAULT now(),
  source_ip inet, -- Client IP for security tracking
  user_agent text, -- Client user agent for analytics
  session_id varchar(100), -- OAuth session identifier
  details jsonb DEFAULT '{}' -- Additional metadata for flexible tracking
);

-- Add table comments for documentation
COMMENT ON TABLE public.context_usage_analytics IS 'External OAuth/OIDC context usage analytics for commercial demonstration';
COMMENT ON COLUMN public.context_usage_analytics.target_user_id IS 'User whose context/name was accessed by external application';
COMMENT ON COLUMN public.context_usage_analytics.context_id IS 'User-defined context used for name resolution';
COMMENT ON COLUMN public.context_usage_analytics.requesting_application IS 'External OAuth client or application identifier';
COMMENT ON COLUMN public.context_usage_analytics.scopes_requested IS 'OAuth scopes requested by the application';
COMMENT ON COLUMN public.context_usage_analytics.properties_disclosed IS 'Actual user data disclosed to the application';
COMMENT ON COLUMN public.context_usage_analytics.response_time_ms IS 'API response time in milliseconds for performance tracking';

-- =============================================================================
-- STEP 2: Create performance indexes
-- =============================================================================

-- Primary query indexes for dashboard analytics
CREATE INDEX IF NOT EXISTS idx_context_usage_user_time 
  ON public.context_usage_analytics (target_user_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_context_usage_context_time 
  ON public.context_usage_analytics (context_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_context_usage_app_time 
  ON public.context_usage_analytics (requesting_application, accessed_at DESC);

-- Performance monitoring indexes
CREATE INDEX IF NOT EXISTS idx_context_usage_success_time 
  ON public.context_usage_analytics (success, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_context_usage_response_time 
  ON public.context_usage_analytics (response_time_ms) 
  WHERE success = true;

-- Daily analytics optimization - removed for compatibility
-- CREATE INDEX IF NOT EXISTS idx_context_usage_daily 
--   ON public.context_usage_analytics (target_user_id, (accessed_at::date));

-- =============================================================================
-- STEP 3: Enable Row Level Security
-- =============================================================================

ALTER TABLE public.context_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only view their own context usage analytics
CREATE POLICY "users_view_own_context_usage" ON public.context_usage_analytics
  FOR SELECT 
  USING (target_user_id = auth.uid());

-- Service role can manage all analytics for system operations
CREATE POLICY "service_role_context_usage" ON public.context_usage_analytics
  FOR ALL 
  USING (auth.role() = 'service_role');

-- =============================================================================
-- STEP 4: Grant permissions
-- =============================================================================

GRANT SELECT ON public.context_usage_analytics TO authenticated;
GRANT ALL ON public.context_usage_analytics TO service_role;

-- Grant sequence permissions for inserts
GRANT USAGE ON SEQUENCE public.context_usage_analytics_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.context_usage_analytics_id_seq TO service_role;

-- =============================================================================
-- STEP 5: Create helper function for context usage logging
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_context_usage(
  p_target_user_id uuid,
  p_context_id uuid,
  p_requesting_application varchar(100),
  p_application_type varchar(50) DEFAULT 'oauth_client',
  p_scopes_requested text[] DEFAULT '{}',
  p_properties_disclosed jsonb DEFAULT '{}',
  p_response_time_ms integer DEFAULT 0,
  p_success boolean DEFAULT true,
  p_error_type varchar(50) DEFAULT NULL,
  p_source_ip inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_session_id varchar(100) DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
) RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  analytics_id bigint;
BEGIN
  -- Insert context usage analytics record
  INSERT INTO public.context_usage_analytics (
target_user_id,
context_id,
requesting_application,
application_type,
scopes_requested,
properties_disclosed,
response_time_ms,
success,
error_type,
source_ip,
user_agent,
session_id,
details
  ) VALUES (
p_target_user_id,
p_context_id,
p_requesting_application,
p_application_type,
p_scopes_requested,
p_properties_disclosed,
p_response_time_ms,
p_success,
p_error_type,
p_source_ip,
p_user_agent,
p_session_id,
p_details
  ) RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$;

-- Grant execute permission to log context usage
GRANT EXECUTE ON FUNCTION public.log_context_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_context_usage TO service_role;

COMMENT ON FUNCTION public.log_context_usage IS 
'Helper function to log external OAuth/OIDC context usage for analytics and performance monitoring';

-- =============================================================================
-- STEP 6: Log migration completion
-- =============================================================================

DO $$
BEGIN
  RAISE LOG '✅ Context Usage Analytics: Created table with performance indexes and RLS policies';
  RAISE LOG '✅ Context Usage Analytics: Added helper function for logging external application usage';
  RAISE LOG '📊 Ready for commercial OAuth provider demonstration with context usage metrics';
END $$;