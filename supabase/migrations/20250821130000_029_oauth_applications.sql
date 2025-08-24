-- Step 16.1.1: OAuth Applications Table for Demo Integration
-- Migration: 20250821130000_029_oauth_applications.sql
-- Purpose: Create foundation table for OAuth demo applications (HR and Chat apps)
-- Date: August 21, 2025
-- Context: Part of Step 16 OAuth integration system using session tokens instead of API keys

-- =====================================================
-- SECTION 1: MIGRATION INITIALIZATION & LOGGING
-- =====================================================

-- Log migration start
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Starting OAuth Applications table creation';
RAISE LOG 'Migration: 029_oauth_applications - Foundation for demo HR and Chat applications';
END
$$;

-- =====================================================
-- SECTION 2: OAUTH APPLICATIONS TABLE CREATION
-- =====================================================

-- Create the OAuth applications registry table
-- This table stores registered OAuth applications without complex API keys
-- Uses session tokens instead per PRD requirements for simplified demo integration
CREATE TABLE public.oauth_applications (
  -- Primary identifier (UUID for consistency with existing schema)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- URL-safe application identifier (unique key for lookups)
  -- Examples: 'demo-hr', 'demo-chat'
  app_name varchar(50) NOT NULL UNIQUE,
  
  -- Human-readable display name for consent screens
  display_name varchar(100) NOT NULL,
  
  -- Application description shown during OAuth consent flow
  description text,
  
  -- OAuth callback/redirect URI for post-authorization flow
  redirect_uri text NOT NULL,
  
  -- Application type for future extensibility (defaults to oauth_client)
  app_type varchar(50) DEFAULT 'oauth_client',
  
  -- Enable/disable applications without deletion
  is_active boolean DEFAULT true,
  
  -- Standard timestamp tracking
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comprehensive table documentation
COMMENT ON TABLE public.oauth_applications IS 
'OAuth application registry for TrueNamePath demo integration system. 
Stores registered applications (demo-hr, demo-chat) that can request 
context-aware name resolution via OAuth flow. Uses session tokens 
instead of API keys for simplified academic demonstration.';

-- Add detailed column comments
COMMENT ON COLUMN public.oauth_applications.app_name IS 
'URL-safe unique identifier for the application (e.g., demo-hr, demo-chat). 
Used for OAuth flow identification and callback routing.';

COMMENT ON COLUMN public.oauth_applications.display_name IS 
'Human-readable application name displayed in consent screens and UI.';

COMMENT ON COLUMN public.oauth_applications.description IS 
'Application description shown to users during OAuth consent flow to help them understand what access they are granting.';

COMMENT ON COLUMN public.oauth_applications.redirect_uri IS 
'OAuth callback URL where users are redirected after authorization. Must be absolute URL for security.';

COMMENT ON COLUMN public.oauth_applications.app_type IS 
'Application type classification for future extensibility. Currently defaults to oauth_client.';

COMMENT ON COLUMN public.oauth_applications.is_active IS 
'Enable/disable flag for applications. Inactive apps cannot initiate OAuth flows.';

-- =====================================================
-- SECTION 3: PERFORMANCE INDEXES
-- =====================================================

-- Primary lookup index on app_name (< 3ms requirement)
-- Most common query: SELECT * FROM oauth_applications WHERE app_name = ?
CREATE INDEX idx_oauth_applications_app_name ON public.oauth_applications(app_name);

-- Active applications filter index
-- Used for filtering active applications in discovery endpoints
CREATE INDEX idx_oauth_applications_is_active ON public.oauth_applications(is_active);

-- Composite index for optimized active app lookups
-- Supports queries that need both app_name and is_active filtering
CREATE INDEX idx_oauth_applications_app_name_active ON public.oauth_applications(app_name, is_active);

-- Log index creation
DO $$
BEGIN
RAISE LOG 'OAuth Applications: Created performance indexes for < 3ms lookup requirement';
END
$$;

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on the oauth_applications table
ALTER TABLE public.oauth_applications ENABLE ROW LEVEL SECURITY;

-- Public read policy: Anyone can view active OAuth applications
-- Required for "Sign in with TrueNamePath" button discovery
CREATE POLICY "oauth_applications_public_read" ON public.oauth_applications
  FOR SELECT
  USING (is_active = true);

-- Service role management policy: Only service role can modify applications
-- Prevents unauthorized application registration or modification
CREATE POLICY "oauth_applications_service_role_all" ON public.oauth_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated user visibility: All authenticated users can see active apps
-- Supports OAuth application discovery for authenticated users
CREATE POLICY "oauth_applications_authenticated_read" ON public.oauth_applications
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Log RLS policy creation
DO $$
BEGIN
RAISE LOG 'OAuth Applications: Created RLS policies for public discovery and service role management';
END
$$;

-- =====================================================
-- SECTION 5: PERMISSIONS & GRANTS
-- =====================================================

-- Grant read access to authenticated users for OAuth discovery
GRANT SELECT ON public.oauth_applications TO authenticated;

-- Grant full access to service_role for application management
GRANT ALL ON public.oauth_applications TO service_role;

-- Grant usage on the sequence to service_role for INSERT operations
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Log permissions setup
DO $$
BEGIN
RAISE LOG 'OAuth Applications: Granted appropriate permissions to authenticated and service_role';
END
$$;

-- =====================================================
-- SECTION 6: DEMO APPLICATION SEED DATA
-- =====================================================

-- Insert demo HR application
INSERT INTO public.oauth_applications (
  app_name,
  display_name,
  description,
  redirect_uri,
  app_type,
  is_active
) VALUES (
  'demo-hr',
  'TrueNamePath Demo HR System',
  'Demonstration HR application showcasing context-aware name resolution for professional environments. Shows how employee names can be displayed appropriately based on workplace context.',
  'https://demo-hr-truename.vercel.app/callback',
  'oauth_client',
  true
);

-- Insert demo Chat application  
INSERT INTO public.oauth_applications (
  app_name,
  display_name,
  description,
  redirect_uri,
  app_type,
  is_active
) VALUES (
  'demo-chat',
  'TrueNamePath Demo Chat Application',
  'Demonstration chat application showcasing context-aware name resolution for social environments. Shows how user names can be displayed appropriately in different social contexts.',
  'https://demo-chat-truename.vercel.app/callback',
  'oauth_client',
  true
);

-- Log seed data insertion
DO $$
BEGIN
RAISE LOG 'OAuth Applications: Seeded demo HR and Chat applications for Step 16 integration';
RAISE LOG 'Demo applications ready for OAuth flow testing with session token architecture';
END
$$;

-- =====================================================
-- SECTION 7: MIGRATION VALIDATION & COMPLETION
-- =====================================================

-- Validate the created table structure
DO $$
DECLARE
app_count INTEGER;
BEGIN
-- Check that demo applications were created successfully
SELECT COUNT(*) INTO app_count FROM public.oauth_applications WHERE is_active = true;

IF app_count = 2 THEN
RAISE LOG 'OAuth Applications: Migration validation passed - 2 active demo applications created';
ELSE
RAISE EXCEPTION 'OAuth Applications: Migration validation failed - Expected 2 applications, found %', app_count;
END IF;

-- Validate indexes exist
IF NOT EXISTS (
SELECT 1 FROM pg_indexes 
WHERE tablename = 'oauth_applications' 
AND indexname = 'idx_oauth_applications_app_name'
) THEN
RAISE EXCEPTION 'OAuth Applications: Migration validation failed - Primary index missing';
END IF;

RAISE LOG 'OAuth Applications: All validation checks passed successfully';
END
$$;

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Migration 029 completed successfully';
RAISE LOG 'OAuth Applications table ready for Step 16.1.2 OAuth sessions implementation';
RAISE LOG 'Foundation established for demo HR and Chat application integration';
END
$$;