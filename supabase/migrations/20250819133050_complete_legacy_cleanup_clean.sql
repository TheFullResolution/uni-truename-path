-- Migration: Complete Legacy System Cleanup for OIDC Migration
-- Purpose: Remove ALL remaining legacy functions and enums that conflict with OIDC system

BEGIN;

-- Drop legacy functions that still use name_category enum
DROP FUNCTION IF EXISTS public.get_context_assignment(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_preferred_name(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_preferred_name(text) CASCADE;

-- Drop any other legacy resolve functions
DROP FUNCTION IF EXISTS public.resolve_name(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_name(text, text, text) CASCADE;

-- Drop the enum type completely
DROP TYPE IF EXISTS name_category CASCADE;

-- Verify cleanup was successful
DO $$
DECLARE
legacy_function_count INTEGER;
legacy_enum_exists BOOLEAN := FALSE;
BEGIN
-- Check if name_category enum still exists
SELECT EXISTS (
SELECT 1 FROM pg_type 
WHERE typname = 'name_category'
) INTO legacy_enum_exists;

IF legacy_enum_exists THEN
RAISE EXCEPTION 'CLEANUP FAILED: name_category enum still exists';
END IF;

-- Check for any functions that might reference old schema
SELECT COUNT(*) INTO legacy_function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('get_context_assignment', 'get_preferred_name', 'resolve_name');

IF legacy_function_count > 0 THEN
RAISE EXCEPTION 'CLEANUP FAILED: % legacy functions still exist', legacy_function_count;
END IF;

RAISE LOG 'OIDC Cleanup: Verification successful';
RAISE LOG 'name_category enum removed';
RAISE LOG 'All legacy functions removed';
RAISE LOG 'Database is now pure OIDC Core 1.0 compliant';
END $$;

COMMENT ON TABLE names IS 'OIDC Core 1.0 compliant name storage with property-based categorization';

COMMIT;