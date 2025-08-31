-- =====================================================
-- Migration: 061_remove_final_legacy_elements
-- Description: Final cleanup - remove all legacy tables and unused functions
-- Author: TrueNamePath Team
-- Date: 2025-08-31
-- =====================================================
--
-- Purpose: Clean up all remaining legacy database elements that were never
-- implemented or have been replaced during development. This is the final
-- cleanup for the university project, removing all unused components.
--
-- Elements to remove:
-- - Tables: audit_log_entries_backup_cleanup, name_disclosure_log, oauth_applications, consents
-- - Functions: grant_consent, request_consent, revoke_consent
-- NOTE: jsonb_object_keys_count is kept as it's used by resolve_oauth_oidc_claims
-- =====================================================

BEGIN;

-- Log migration start
DO $$
BEGIN
RAISE LOG '=== Migration 061: Final Legacy Cleanup ===';
RAISE LOG 'Removing all unused tables and functions from the database';
RAISE LOG 'This is the final cleanup for the TrueNamePath project';
END
$$;

-- =====================================================
-- SECTION 1: DROP LEGACY TABLES
-- =====================================================

-- Drop audit_log_entries backup table (created during previous cleanup)
DROP TABLE IF EXISTS public.audit_log_entries_backup_cleanup CASCADE;
DO $$ BEGIN
RAISE LOG 'Dropped table: audit_log_entries_backup_cleanup (backup from migration cleanup)';
END $$;

-- Drop name_disclosure_log table (never implemented, only in initial schema)
DROP TABLE IF EXISTS public.name_disclosure_log CASCADE;
DO $$ BEGIN
RAISE LOG 'Dropped table: name_disclosure_log (never implemented feature)';
END $$;

-- Drop oauth_applications table (replaced by oauth_client_registry)
DROP TABLE IF EXISTS public.oauth_applications CASCADE;
DO $$ BEGIN
RAISE LOG 'Dropped table: oauth_applications (replaced by oauth_client_registry)';
END $$;

-- Drop consents table (consent system never implemented, no future development)
-- First drop any RLS policies that might exist
DO $$
DECLARE
policy_record RECORD;
BEGIN
FOR policy_record IN 
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'consents'
LOOP
EXECUTE format('DROP POLICY IF EXISTS %I ON public.consents', policy_record.policyname);
RAISE LOG 'Dropped RLS policy: % on consents', policy_record.policyname;
END LOOP;
END
$$;

-- Drop any indexes on consents
DROP INDEX IF EXISTS idx_consents_granter;
DROP INDEX IF EXISTS idx_consents_requester;
DROP INDEX IF EXISTS idx_consents_context;
DROP INDEX IF EXISTS idx_consents_status;

-- Now drop the consents table
DROP TABLE IF EXISTS public.consents CASCADE;
DO $$ BEGIN
RAISE LOG 'Dropped table: consents (consent feature never implemented)';
END $$;

-- =====================================================
-- SECTION 2: DROP UNUSED FUNCTIONS
-- =====================================================

-- Drop consent-related functions (never implemented in application)
DROP FUNCTION IF EXISTS public.grant_consent(uuid, uuid);
DO $$ BEGIN
RAISE LOG 'Dropped function: grant_consent (never implemented)';
END $$;

DROP FUNCTION IF EXISTS public.request_consent(uuid, uuid, text, timestamp with time zone);
DO $$ BEGIN
RAISE LOG 'Dropped function: request_consent (never implemented)';
END $$;

DROP FUNCTION IF EXISTS public.revoke_consent(uuid, uuid);
DO $$ BEGIN
RAISE LOG 'Dropped function: revoke_consent (never implemented)';
END $$;

-- NOTE: jsonb_object_keys_count is NOT dropped - it's used by resolve_oauth_oidc_claims
-- This function is actively used in OAuth resolution, not just migrations

-- =====================================================
-- SECTION 3: DROP UNUSED TYPES
-- =====================================================

-- Drop consent_status enum if it exists (was used by consents table)
DROP TYPE IF EXISTS public.consent_status CASCADE;
DO $$ BEGIN
RAISE LOG 'Dropped type: consent_status enum (used by removed consents table)';
END $$;

-- =====================================================
-- SECTION 4: VERIFICATION
-- =====================================================

DO $$
DECLARE
table_count integer;
function_count integer;
BEGIN
-- Verify tables are gone
SELECT COUNT(*) INTO table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
'audit_log_entries_backup_cleanup',
'name_disclosure_log',
'oauth_applications',
'consents'
);

IF table_count > 0 THEN
RAISE WARNING 'Some legacy tables still exist: %', table_count;
ELSE
RAISE LOG 'All legacy tables successfully removed';
END IF;

-- Verify functions are gone (excluding jsonb_object_keys_count which we keep)
SELECT COUNT(*) INTO function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
'grant_consent',
'request_consent',
'revoke_consent'
);

IF function_count > 0 THEN
RAISE WARNING 'Some unused functions still exist: %', function_count;
ELSE
RAISE LOG 'All unused functions successfully removed';
END IF;
END
$$;

-- =====================================================
-- SECTION 5: FINAL SUMMARY
-- =====================================================

DO $$
BEGIN
RAISE LOG '';
RAISE LOG '=== CLEANUP COMPLETE ===';
RAISE LOG 'Removed 4 legacy tables:';
RAISE LOG '  - audit_log_entries_backup_cleanup';
RAISE LOG '  - name_disclosure_log';
RAISE LOG '  - oauth_applications';
RAISE LOG '  - consents';
RAISE LOG '';
RAISE LOG 'Removed 3 unused functions:';
RAISE LOG '  - grant_consent()';
RAISE LOG '  - request_consent()';
RAISE LOG '  - revoke_consent()';
RAISE LOG '';
RAISE LOG 'Remaining active tables (8 total):';
RAISE LOG '  - profiles (user accounts)';
RAISE LOG '  - names (name variants with OIDC)';
RAISE LOG '  - user_contexts (user-defined contexts)';
RAISE LOG '  - context_oidc_assignments (OIDC mappings)';
RAISE LOG '  - oauth_client_registry (OAuth clients)';
RAISE LOG '  - oauth_sessions (Bearer tokens)';
RAISE LOG '  - app_context_assignments (app-context links)';
RAISE LOG '  - app_usage_log (audit trail)';
RAISE LOG '';
RAISE LOG 'Database schema is now clean and contains only active components';
RAISE LOG '=== Migration 061 Complete ===';
END
$$;

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
-- 
-- This migration completes the database cleanup for the TrueNamePath project.
-- All legacy tables and unused functions have been removed.
-- 
-- The database now contains only the 8 tables that are actively used:
-- 1. profiles - Core user identity
-- 2. names - Name variants with OIDC properties
-- 3. user_contexts - User-defined identity contexts
-- 4. context_oidc_assignments - Maps names to contexts via OIDC properties
-- 5. oauth_client_registry - Registered OAuth applications
-- 6. oauth_sessions - Active OAuth Bearer tokens
-- 7. app_context_assignments - Links apps to user contexts
-- 8. app_usage_log - Comprehensive audit trail
--
-- NOTE: jsonb_object_keys_count function is retained as it's used by
-- resolve_oauth_oidc_claims for OAuth authentication.
--
-- No further cleanup is needed. The schema is production-ready for evaluation.
-- =====================================================