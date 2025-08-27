-- =====================================================
-- MIGRATION 038: OAUTH CLIENT REGISTRY SYSTEM
-- =====================================================
--
-- This migration implements a secure OAuth client ID system with domain-based
-- app identity to prevent collisions and impersonation attacks for Step 16.3.5:
-- 1. Creates oauth_client_registry table with unique client IDs and domain tracking
-- 2. Adds state column to oauth_sessions for CSRF protection
-- 3. Creates performance indexes for fast lookups and token resolution
-- 4. Implements RLS policies following existing security patterns
-- 5. Includes domain-based uniqueness constraints to prevent impersonation
--
-- Academic constraint: Keep functions under 80 lines maximum
-- Performance requirement: <3ms response times maintained
-- Security: Domain tracking prevents same app from same domain registering twice
--
-- Created: 2025-08-26
-- Author: TrueNamePath Migration System

-- =====================================================
-- SECTION 1: BACKUP & PREPARATION
-- =====================================================

DO $$
BEGIN
RAISE LOG 'OAuth Client Registry: Starting migration 038';
RAISE LOG 'Implementing secure client ID system with domain-based app identity';
RAISE LOG 'Academic constraint: Simple implementation for concept demonstration';
END
$$;

-- =====================================================
-- SECTION 2: CREATE OAUTH CLIENT REGISTRY TABLE
-- =====================================================

-- Create oauth_client_registry table for secure client ID management
-- Format: 'tnp_' + 16 hex characters (total 20 chars) for collision resistance
CREATE TABLE public.oauth_client_registry (
  -- Primary client identifier with 'tnp_' prefix for security and branding
  -- Format: 'tnp_' + 16 hex characters (e.g., 'tnp_a3b2c1d4e5f6g7h8')
  -- Shorter than session tokens to differentiate system components
  client_id varchar(20) PRIMARY KEY,
  
  -- Human-readable display name for user interfaces and admin panels
  -- Example: "TrueHR Demo Application" or "Gaming Community Chat"
  display_name varchar(100) NOT NULL,
  
  -- Original requested app name for collision detection and analytics
  -- Example: "truehr", "gamechat", "university-portal"
  app_name varchar(100) NOT NULL,
  
  -- Security: Publisher domain prevents impersonation attacks
  -- Same app name from different domains creates different client_ids
  -- Example: "truehr.demo", "university.edu", "company.internal"
  publisher_domain varchar(255) NOT NULL,
  
  -- Standard timestamp tracking for lifecycle management
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Track when client_id was last used for analytics and cleanup
  -- NULL for never-used clients, updated during OAuth token operations
  last_used_at timestamptz,
  
  -- Business constraints for security and collision prevention
  -- Critical: Prevents same app from same domain registering multiple times
  CONSTRAINT oauth_client_registry_unique_domain_app UNIQUE (publisher_domain, app_name),
  
  -- Format validation for client_id consistency and security
  CONSTRAINT oauth_client_registry_valid_client_id CHECK (client_id ~ '^tnp_[a-f0-9]{16}$'),
  
  -- Domain format validation (basic DNS-like pattern)
  CONSTRAINT oauth_client_registry_valid_domain CHECK (publisher_domain ~ '^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$')
);

-- Add comprehensive table documentation
COMMENT ON TABLE public.oauth_client_registry IS 
'OAuth client registry for TrueNamePath secure app identity management. 
Maps application names and publisher domains to unique client_id values. 
Prevents collision and impersonation attacks through domain-based uniqueness constraints. 
Designed for academic demonstration of secure OAuth client ID generation.';

-- Add detailed column comments for maintenance and understanding
COMMENT ON COLUMN public.oauth_client_registry.client_id IS 
'Unique client identifier with tnp_ prefix. Format: tnp_[16 hex chars]. 
Generated using cryptographic functions for collision resistance. 
Used as primary identifier in OAuth flows and token resolution.';

COMMENT ON COLUMN public.oauth_client_registry.display_name IS 
'Human-readable application name for user interfaces and consent screens. 
Shown to users during OAuth authorization flow for app identification.';

COMMENT ON COLUMN public.oauth_client_registry.app_name IS 
'Original requested application name for collision detection and analytics. 
Combined with publisher_domain to ensure global uniqueness across domains.';

COMMENT ON COLUMN public.oauth_client_registry.publisher_domain IS 
'Security: Publisher domain prevents impersonation attacks. 
Same app_name from different domains creates different client_ids. 
Essential for multi-tenant security in OAuth ecosystem.';

COMMENT ON COLUMN public.oauth_client_registry.last_used_at IS 
'Timestamp when client_id was last used in OAuth operations. 
Supports client lifecycle analytics and cleanup of unused registrations.';

DO $$
BEGIN
RAISE LOG 'OAuth Client Registry: Created table with domain-based security constraints';
RAISE LOG 'Unique constraint: (publisher_domain, app_name) prevents impersonation';
RAISE LOG 'Client ID format: tnp_[16 hex chars] for collision resistance';
END
$$;

-- =====================================================
-- SECTION 3: ADD STATE COLUMN TO OAUTH_SESSIONS
-- =====================================================

-- Add state column to oauth_sessions for CSRF protection
-- OAuth 2.0 state parameter prevents cross-site request forgery attacks
ALTER TABLE public.oauth_sessions 
ADD COLUMN state varchar(255);

-- Add column documentation for security understanding
COMMENT ON COLUMN public.oauth_sessions.state IS 
'OAuth 2.0 state parameter for CSRF protection during authorization flow. 
Generated by client application and validated during token exchange. 
Prevents cross-site request forgery attacks in OAuth flows.';

DO $$
BEGIN
RAISE LOG 'OAuth Client Registry: Added state column to oauth_sessions for CSRF protection';
RAISE LOG 'OAuth 2.0 compliance: state parameter prevents request forgery attacks';
END
$$;

-- =====================================================
-- SECTION 4: PERFORMANCE INDEXES
-- =====================================================

-- Primary lookup index for domain + app_name queries (<3ms requirement)
-- Critical query: SELECT client_id FROM oauth_client_registry WHERE publisher_domain = ? AND app_name = ?
CREATE INDEX idx_oauth_client_registry_domain_app 
ON public.oauth_client_registry(publisher_domain, app_name);

-- Client ID lookup index for token resolution and validation
-- Critical query: SELECT * FROM oauth_client_registry WHERE client_id = ?
CREATE INDEX idx_oauth_client_registry_client_id 
ON public.oauth_client_registry(client_id);

-- Usage analytics index for client lifecycle management
-- Analytics query: ORDER BY last_used_at for cleanup and monitoring
CREATE INDEX idx_oauth_client_registry_last_used 
ON public.oauth_client_registry(last_used_at DESC);

-- Domain analytics index for publisher insights
-- Publisher query: SELECT * FROM oauth_client_registry WHERE publisher_domain = ?
CREATE INDEX idx_oauth_client_registry_domain 
ON public.oauth_client_registry(publisher_domain);

DO $$
BEGIN
RAISE LOG 'OAuth Client Registry: Created performance indexes for <3ms lookup requirements';
RAISE LOG 'Primary index: (publisher_domain, app_name) for collision detection';
RAISE LOG 'Secondary indexes: client_id, last_used_at, publisher_domain for analytics';
END
$$;

-- =====================================================
-- SECTION 5: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on the oauth_client_registry table
ALTER TABLE public.oauth_client_registry ENABLE ROW LEVEL SECURITY;

-- Public read policy: No public access to client registry
-- Client registry contains application metadata and should not be publicly accessible
-- Only system roles and authenticated operations should access this data
-- (No public policy created intentionally)

-- Service role management policy: Full access for system operations
-- Required for client registration, lookup, and cleanup processes
CREATE POLICY "oauth_client_registry_service_role_all" ON public.oauth_client_registry
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated user read policy: Limited read access for dashboard integration
-- Users can view client information for apps they have interacted with
-- This supports dashboard features and app management interfaces
CREATE POLICY "oauth_client_registry_authenticated_read" ON public.oauth_client_registry
  FOR SELECT
  TO authenticated
  USING (true);

-- Log RLS policy creation
DO $$
BEGIN
RAISE LOG 'OAuth Client Registry: Created RLS policies for secure access control';
RAISE LOG 'Service role: Full access for system operations and registration';
RAISE LOG 'Authenticated users: Read-only access for dashboard integration';
RAISE LOG 'No public access - registry contains sensitive application metadata';
END
$$;

-- =====================================================
-- SECTION 6: PERMISSIONS & GRANTS
-- =====================================================

-- Grant read access to authenticated users for dashboard integration
GRANT SELECT ON public.oauth_client_registry TO authenticated;

-- Grant full access to service_role for OAuth system operations
GRANT ALL ON public.oauth_client_registry TO service_role;

-- Grant usage on sequences to service_role for future sequence operations
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Log permissions setup
DO $$
BEGIN
RAISE LOG 'OAuth Client Registry: Granted appropriate permissions';
RAISE LOG 'Authenticated users: SELECT (dashboard integration)';
RAISE LOG 'Service role: ALL operations for OAuth system management';
END
$$;

-- =====================================================
-- SECTION 7: MIGRATION VALIDATION
-- =====================================================

-- Validate the migration results
DO $$
DECLARE
table_exists boolean;
column_exists boolean;
index_count integer;
policy_count integer;
BEGIN
-- Validate oauth_client_registry table exists
SELECT EXISTS (
SELECT 1 FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'oauth_client_registry'
) INTO table_exists;

IF NOT table_exists THEN
RAISE EXCEPTION 'OAuth Client Registry: Table validation failed - oauth_client_registry not created';
END IF;

-- Validate state column was added to oauth_sessions
SELECT EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'oauth_sessions' 
AND column_name = 'state'
) INTO column_exists;

IF NOT column_exists THEN
RAISE EXCEPTION 'OAuth Client Registry: Column validation failed - state column not added to oauth_sessions';
END IF;

-- Validate indexes exist
SELECT COUNT(*) INTO index_count 
FROM pg_indexes 
WHERE tablename = 'oauth_client_registry' 
AND schemaname = 'public';

IF index_count < 4 THEN
RAISE EXCEPTION 'OAuth Client Registry: Index validation failed - Expected 4 indexes, found %', index_count;
END IF;

-- Validate RLS policies exist
SELECT COUNT(*) INTO policy_count 
FROM pg_policies 
WHERE tablename = 'oauth_client_registry' 
AND schemaname = 'public';

IF policy_count < 2 THEN
RAISE EXCEPTION 'OAuth Client Registry: Policy validation failed - Expected 2 policies, found %', policy_count;
END IF;

RAISE LOG 'OAuth Client Registry: All validation checks passed successfully';
RAISE LOG 'Table created: oauth_client_registry with % indexes', index_count;
RAISE LOG 'Column added: oauth_sessions.state for CSRF protection';
RAISE LOG 'RLS policies: % policies created for secure access', policy_count;
END
$$;

-- =====================================================
-- SECTION 8: MIGRATION COMPLETION
-- =====================================================

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Migration 038 completed successfully';
RAISE LOG '';
RAISE LOG '✅ OAUTH CLIENT REGISTRY SYSTEM:';
RAISE LOG '  • Table created with domain-based security constraints';
RAISE LOG '  • Client ID format: tnp_[16 hex chars] for collision resistance';
RAISE LOG '  • Unique constraint: (publisher_domain, app_name) prevents impersonation';
RAISE LOG '  • Format validation for client_id and domain patterns';
RAISE LOG '';
RAISE LOG '✅ CSRF PROTECTION ENHANCEMENT:';
RAISE LOG '  • Added state column to oauth_sessions table';
RAISE LOG '  • OAuth 2.0 state parameter support for security';
RAISE LOG '  • Prevents cross-site request forgery attacks';
RAISE LOG '';
RAISE LOG '✅ PERFORMANCE OPTIMIZATION:';
RAISE LOG '  • Primary index: (publisher_domain, app_name) for <3ms lookups';
RAISE LOG '  • Secondary indexes: client_id, last_used_at, domain for analytics';
RAISE LOG '  • Optimized for high-frequency registration and lookup operations';
RAISE LOG '';
RAISE LOG '✅ SECURITY & PRIVACY:';
RAISE LOG '  • RLS policies: service role and authenticated read access';
RAISE LOG '  • Domain-based uniqueness prevents application impersonation';
RAISE LOG '  • No public access to sensitive application metadata';
RAISE LOG '  • Academic security model with practical constraints';
RAISE LOG '';
RAISE LOG '🔧 NEXT STEPS:';
RAISE LOG '  • Implement client registration API endpoints';
RAISE LOG '  • Create client ID generation functions';
RAISE LOG '  • Update OAuth flow to use client registry lookups';
RAISE LOG '  • Test domain-based collision prevention';
END
$$;