-- Step 16.2.0.1: Academic OAuth OIDC Claims Resolution Function (Simplified)
-- Migration: 20250823100000_035_academic_oauth_oidc_resolution.sql
-- Purpose: Academic-appropriate implementation of OIDC claims resolution
-- Date: August 23, 2025
-- Complexity: 80 lines maximum (academic requirement)

-- =====================================================
-- REPLACE OVER-ENGINEERED FUNCTION WITH ACADEMIC VERSION
-- =====================================================

-- Drop the complex production-level function
DROP FUNCTION IF EXISTS public.resolve_oauth_oidc_claims(uuid, uuid, text);

-- Create simplified academic-appropriate version
-- Focus: Demonstrate OAuth -> Context -> OIDC concept clearly
CREATE OR REPLACE FUNCTION public.resolve_oauth_oidc_claims(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_session record;
v_context_id uuid;
v_claims jsonb := '{}'::jsonb;
BEGIN
-- 1. Validate session token (simple validation)
SELECT s.profile_id, s.app_id, a.app_name, a.display_name
INTO v_session
FROM oauth_sessions s
JOIN oauth_applications a ON s.app_id = a.id  
WHERE s.session_token = p_session_token
  AND s.expires_at > now()
  AND a.is_active = true;
  
IF NOT FOUND THEN
RETURN jsonb_build_object('error', 'invalid_token');
END IF;

-- Update session usage for analytics
UPDATE oauth_sessions 
SET used_at = now() 
WHERE session_token = p_session_token;

-- 2. Get context assignment (direct lookup)
SELECT aca.context_id INTO v_context_id
FROM app_context_assignments aca
WHERE aca.profile_id = v_session.profile_id 
  AND aca.app_id = v_session.app_id;
  
IF v_context_id IS NULL THEN
RETURN jsonb_build_object('error', 'no_context_assigned');
END IF;

-- 3. Build OIDC claims from context assignments (core algorithm)
WITH context_info AS (
SELECT context_name 
FROM user_contexts 
WHERE id = v_context_id
),
claims_data AS (
SELECT jsonb_object_agg(coa.oidc_property, n.name_text) as properties
FROM context_oidc_assignments coa
JOIN names n ON coa.name_id = n.id
WHERE coa.user_id = v_session.profile_id
  AND coa.context_id = v_context_id
)
SELECT jsonb_build_object(
'sub', v_session.profile_id,
'iss', 'https://truenameapi.demo',
'aud', v_session.app_name,
'iat', extract(epoch from now())::int,
'context_name', ci.context_name,
'app_name', v_session.app_name
) || COALESCE(cd.properties, '{}'::jsonb)
INTO v_claims
FROM context_info ci, claims_data cd;

-- 4. Log successful resolution (minimal logging)
RAISE LOG 'OIDC claims resolved for user % in context %', 
v_session.profile_id, 
(v_claims->>'context_name');

-- 5. Return complete OIDC claims
RETURN v_claims;

EXCEPTION
WHEN OTHERS THEN
-- Simple error handling
RETURN jsonb_build_object(
'error', 'resolution_failed', 
'message', SQLERRM
);
END $$;

-- =====================================================
-- FUNCTION DOCUMENTATION & PERMISSIONS
-- =====================================================

COMMENT ON FUNCTION public.resolve_oauth_oidc_claims(text) IS 
'Academic implementation: Resolves OAuth session token to OIDC claims via context assignments.
Core algorithm: OAuth Session -> App Context Assignment -> OIDC Properties -> Claims Object.
Simplified for academic demonstration - 80 lines, single input mode, basic error handling.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.resolve_oauth_oidc_claims(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_oauth_oidc_claims(text) TO service_role;

-- =====================================================
-- MIGRATION COMPLETION LOG
-- =====================================================

DO $$
BEGIN
RAISE LOG 'Academic OAuth OIDC Resolution Migration Complete:';
RAISE LOG '  • Replaced 259-line production function with 80-line academic version';
RAISE LOG '  • Single input mode (session token only)'; 
RAISE LOG '  • Basic error handling (success/failure pattern)';
RAISE LOG '  • Minimal logging (concept demonstration focus)';
RAISE LOG '  • Core algorithm: OAuth -> Context -> OIDC clearly visible';
RAISE LOG '  • Academic-appropriate complexity for university evaluation';
END $$;