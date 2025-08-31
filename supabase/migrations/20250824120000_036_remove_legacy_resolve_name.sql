-- Step: 16.2.7 - Legacy resolve_name Cleanup
-- Purpose: Final cleanup of legacy resolve_name function and complete migration to OIDC-based system

-- Remove legacy resolve_name function if it exists
-- This ensures we completely eliminate the old single-string name resolution approach
-- in favor of the new OIDC claims object approach introduced in Step 15

-- Drop the legacy resolve_name function with all its overloads
DROP FUNCTION IF EXISTS public.resolve_name(p_target_user_id uuid, p_requester_user_id uuid, p_context_name text) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_name(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_name(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_name(uuid) CASCADE;

-- Verify the function has been removed
-- This query should return no rows if cleanup is successful
DO $$
DECLARE
legacy_function_count INTEGER;
BEGIN
-- Check for any remaining resolve_name functions
SELECT COUNT(*)
INTO legacy_function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'resolve_name'
AND n.nspname = 'public';

-- Log the cleanup result
IF legacy_function_count > 0 THEN
RAISE WARNING 'Legacy resolve_name cleanup incomplete: % functions still exist', legacy_function_count;
ELSE
RAISE NOTICE 'Legacy resolve_name cleanup successful: All legacy functions removed';
END IF;
END $$;

-- Add comment documenting the migration to OIDC system
COMMENT ON SCHEMA public IS 'TrueNamePath schema - OAuth/OIDC compliant name resolution (legacy resolve_name removed in migration 036)';

-- Final verification: Ensure we have the modern OIDC resolution function
-- This should exist and return JSONB (not TEXT like the legacy function)
DO $$
DECLARE
oidc_function_exists BOOLEAN;
BEGIN
-- Check for the modern OIDC resolution function
SELECT EXISTS(
SELECT 1 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'resolve_oauth_oidc_claims'
AND n.nspname = 'public'
) INTO oidc_function_exists;

IF oidc_function_exists THEN
RAISE NOTICE 'Modern OIDC resolution function confirmed: resolve_oauth_oidc_claims exists';
ELSE
RAISE WARNING 'Modern OIDC resolution function missing: resolve_oauth_oidc_claims not found';
END IF;
END $$;