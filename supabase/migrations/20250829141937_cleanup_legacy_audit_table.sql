-- ===
-- MIGRATION: Cleanup Legacy audit_log_entries Table
-- ===
--
-- Description: Safely remove the legacy audit_log_entries table that has been
-- replaced by the modern app_usage_log table in the OAuth integration system.
--
-- Background:
-- - audit_log_entries was created in migration 012 for context-aware auditing
-- - It was replaced by app_usage_log in migration 032 for OAuth compliance
-- - All functions now use app_usage_log for audit trails
-- - This migration safely removes the obsolete table and related infrastructure
--
-- Safety Measures:
-- 1. Creates backup table if any data exists
-- 2. Verifies no active function dependencies
-- 3. Safely removes RLS policies, indexes, constraints
-- 4. Documents removal for future reference
--
-- Rollback Strategy:
-- If rollback is needed, recreate the table from the backup and restore indexes/policies
-- ===

BEGIN;

-- Log migration start
DO $$
BEGIN
RAISE LOG 'Starting Migration: Cleanup Legacy audit_log_entries Table';
RAISE LOG 'Context: Removing table replaced by app_usage_log in OAuth migration (032)';
END
$$;

-- ===
-- SECTION 1: VERIFY TABLE EXISTS AND CHECK DEPENDENCIES
-- ===

DO $$
DECLARE 
table_exists boolean := FALSE;
function_dependencies_count integer := 0;
trigger_dependencies_count integer := 0;
view_dependencies_count integer := 0;
constraint_dependencies_count integer := 0;
BEGIN
-- Check if the table exists
SELECT EXISTS (
SELECT 1 FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'audit_log_entries'
) INTO table_exists;

RAISE LOG 'Table audit_log_entries exists: %', table_exists;

IF NOT table_exists THEN
RAISE LOG 'CLEANUP SKIPPED: audit_log_entries table does not exist - already cleaned up';
RETURN;
END IF;

-- Check for function dependencies
SELECT COUNT(*) INTO function_dependencies_count
FROM pg_depend d
JOIN pg_class c ON d.refobjid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON d.objid = p.oid
WHERE n.nspname = 'public'
AND c.relname = 'audit_log_entries'
AND d.deptype = 'n'; -- normal dependency

-- Check for trigger dependencies
SELECT COUNT(*) INTO trigger_dependencies_count
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'audit_log_entries';

-- Check for view dependencies
SELECT COUNT(*) INTO view_dependencies_count
FROM information_schema.view_table_usage
WHERE table_schema = 'public'
AND table_name = 'audit_log_entries';

-- Check for foreign key constraints referencing this table
SELECT COUNT(*) INTO constraint_dependencies_count
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND ccu.table_schema = 'public'
AND ccu.table_name = 'audit_log_entries';

RAISE LOG 'Dependency Analysis:';
RAISE LOG '  " Function dependencies: %', function_dependencies_count;
RAISE LOG '  " Trigger dependencies: %', trigger_dependencies_count;
RAISE LOG '  " View dependencies: %', view_dependencies_count;
RAISE LOG '  " FK constraint dependencies: %', constraint_dependencies_count;

IF function_dependencies_count > 0 OR trigger_dependencies_count > 0 OR view_dependencies_count > 0 THEN
RAISE WARNING 'SAFETY CHECK: audit_log_entries has active dependencies. Review before proceeding.';
END IF;
END
$$;

-- ===
-- SECTION 2: CREATE BACKUP TABLE IF DATA EXISTS
-- ===

DO $$
DECLARE 
record_count integer := 0;
backup_created boolean := FALSE;
BEGIN
-- Check if table exists and has data
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log_entries') THEN
SELECT COUNT(*) INTO record_count FROM public.audit_log_entries;

RAISE LOG 'Legacy audit_log_entries contains % records', record_count;

-- Create backup if data exists
IF record_count > 0 THEN
CREATE TABLE public.audit_log_entries_backup_cleanup AS
SELECT 
id,
target_user_id,
requester_user_id,
context_id,
resolved_name_id,
action,
accessed_at,
source_ip,
details,
NOW() as backup_created_at
FROM public.audit_log_entries;

backup_created := TRUE;

RAISE LOG 'BACKUP CREATED: audit_log_entries_backup_cleanup with % records', record_count;
RAISE LOG 'Backup includes all original columns plus backup_created_at timestamp';
ELSE
RAISE LOG 'NO BACKUP NEEDED: audit_log_entries table is empty';
END IF;
END IF;

-- Add comment to backup table
IF backup_created THEN
COMMENT ON TABLE public.audit_log_entries_backup_cleanup IS 
'Backup of legacy audit_log_entries table created during cleanup migration. This table was replaced by app_usage_log for OAuth compliance. Safe to remove after verification.';
END IF;
END
$$;

-- ===
-- SECTION 3: REMOVE RLS POLICIES
-- ===

DO $$
DECLARE
policy_record RECORD;
policy_count integer := 0;
BEGIN
-- Drop all RLS policies on audit_log_entries
FOR policy_record IN 
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'audit_log_entries'
LOOP
EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_log_entries', policy_record.policyname);
policy_count := policy_count + 1;
RAISE LOG 'Dropped RLS policy: %', policy_record.policyname;
END LOOP;

RAISE LOG 'Removed % RLS policies from audit_log_entries', policy_count;
END
$$;

-- ===
-- SECTION 4: REMOVE INDEXES
-- ===

-- Drop performance indexes created for audit_log_entries
DROP INDEX IF EXISTS public.idx_audit_target_time;
DROP INDEX IF EXISTS public.idx_audit_requester_time; 
DROP INDEX IF EXISTS public.idx_audit_context_time;
DROP INDEX IF EXISTS public.idx_audit_action_time;
DROP INDEX IF EXISTS public.idx_audit_rls_target;
DROP INDEX IF EXISTS public.idx_audit_rls_requester;

-- Log index removal
DO $$
BEGIN
RAISE LOG 'Dropped all audit_log_entries performance indexes:';
RAISE LOG '  " idx_audit_target_time';
RAISE LOG '  " idx_audit_requester_time';
RAISE LOG '  " idx_audit_context_time';
RAISE LOG '  " idx_audit_action_time';
RAISE LOG '  " idx_audit_rls_target';
RAISE LOG '  " idx_audit_rls_requester';
END
$$;

-- ===
-- SECTION 5: REMOVE FOREIGN KEY CONSTRAINTS
-- ===

-- Remove foreign key constraints safely
ALTER TABLE IF EXISTS public.audit_log_entries DROP CONSTRAINT IF EXISTS audit_log_entries_target_user_id_fkey;
ALTER TABLE IF EXISTS public.audit_log_entries DROP CONSTRAINT IF EXISTS audit_log_entries_requester_user_id_fkey;
ALTER TABLE IF EXISTS public.audit_log_entries DROP CONSTRAINT IF EXISTS audit_log_entries_context_id_fkey;
ALTER TABLE IF EXISTS public.audit_log_entries DROP CONSTRAINT IF EXISTS audit_log_entries_resolved_name_id_fkey;

-- Log constraint removal
DO $$
BEGIN
RAISE LOG 'Removed foreign key constraints from audit_log_entries:';
RAISE LOG '  " target_user_id � profiles(id)';
RAISE LOG '  " requester_user_id � profiles(id)';  
RAISE LOG '  " context_id � user_contexts(id)';
RAISE LOG '  " resolved_name_id � names(id)';
END
$$;

-- ===
-- SECTION 6: REMOVE SEQUENCE
-- ===

-- Drop the sequence used for the id column
DROP SEQUENCE IF EXISTS public.audit_log_entries_id_seq CASCADE;

DO $$
BEGIN
RAISE LOG 'Dropped sequence: audit_log_entries_id_seq';
END
$$;

-- ===
-- SECTION 7: DROP THE TABLE
-- ===

-- Finally drop the table with CASCADE to handle any remaining dependencies
DROP TABLE IF EXISTS public.audit_log_entries CASCADE;

-- Log table removal
DO $$
BEGIN
RAISE LOG 'DROPPED: audit_log_entries table and all dependencies';
RAISE LOG 'This table has been replaced by app_usage_log for OAuth compliance';
END
$$;

-- ===
-- SECTION 8: VERIFICATION AND CLEANUP DOCUMENTATION
-- ===

DO $$
DECLARE
backup_exists boolean := FALSE;
backup_count integer := 0;
BEGIN
-- Verify table is gone
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log_entries') THEN
RAISE EXCEPTION 'CLEANUP FAILED: audit_log_entries table still exists';
END IF;

-- Check backup table status
SELECT EXISTS (
SELECT 1 FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'audit_log_entries_backup_cleanup'
) INTO backup_exists;

IF backup_exists THEN
SELECT COUNT(*) INTO backup_count FROM public.audit_log_entries_backup_cleanup;
RAISE LOG 'Backup verification: audit_log_entries_backup_cleanup contains % records', backup_count;
END IF;

-- Final success log
RAISE LOG 'CLEANUP COMPLETE: Legacy audit_log_entries table successfully removed';
RAISE LOG '';
RAISE LOG '=== CLEANUP SUMMARY ===';
RAISE LOG ' Removed legacy audit_log_entries table';
RAISE LOG ' Dropped all RLS policies';
RAISE LOG ' Removed performance indexes';
RAISE LOG ' Cleaned up foreign key constraints';
RAISE LOG ' Dropped sequence audit_log_entries_id_seq';

IF backup_exists THEN
RAISE LOG ' Created backup table: audit_log_entries_backup_cleanup (% records)', backup_count;
RAISE LOG '';
RAISE LOG '=� IMPORTANT: This table was replaced by app_usage_log in migration 032';
RAISE LOG '=� All audit functionality now uses app_usage_log for OAuth compliance';
RAISE LOG '=� Backup table can be removed after verification of app_usage_log functionality';
ELSE
RAISE LOG ' No backup needed (table was empty)';
END IF;

RAISE LOG '';
RAISE LOG '= ROLLBACK INSTRUCTIONS (if needed):';
RAISE LOG '   1. Recreate table from backup: CREATE TABLE audit_log_entries AS SELECT * FROM audit_log_entries_backup_cleanup';
RAISE LOG '   2. Restore indexes and constraints from migration 012';
RAISE LOG '   3. Re-enable RLS and restore policies from migration 015';
RAISE LOG '';
END
$$;

-- Add final documentation comment (if backup table was created)
DO $$
BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log_entries_backup_cleanup') THEN
COMMENT ON TABLE public.audit_log_entries_backup_cleanup IS 
'LEGACY CLEANUP BACKUP: Contains data from removed audit_log_entries table. Original table was replaced by app_usage_log for OAuth compliance in migration 032. Safe to remove after verifying app_usage_log functionality meets audit requirements.';
END IF;
END
$$;

COMMIT;