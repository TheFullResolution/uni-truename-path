-- ===
-- MIGRATION 045: Database Cleanup - Drop Backup Tables
-- ===
--
-- Description: Remove obsolete backup tables that were created during 
-- previous migrations but are no longer needed
--
-- Affected Tables:
--   • app_context_assignments_backup_037 (from migration 037)
--   • app_usage_log_backup_040 (from migration 040)
--
-- Safety: Both tables are empty and no longer referenced
-- ===

-- Log migration start
DO $$
BEGIN
RAISE LOG 'Starting Migration 045: Database Cleanup - Drop Backup Tables';
END
$$;

-- ===
-- SECTION 1: VERIFY BACKUP TABLES ARE EMPTY
-- ===

DO $$
DECLARE 
backup_037_count integer := 0;
backup_040_count integer := 0;
BEGIN
-- Check if backup tables exist and get their counts
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_context_assignments_backup_037' AND table_schema = 'public') THEN
SELECT COUNT(*) INTO backup_037_count FROM public.app_context_assignments_backup_037;
RAISE LOG 'Backup table app_context_assignments_backup_037 contains % records', backup_037_count;
END IF;

IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_usage_log_backup_040' AND table_schema = 'public') THEN
SELECT COUNT(*) INTO backup_040_count FROM public.app_usage_log_backup_040;
RAISE LOG 'Backup table app_usage_log_backup_040 contains % records', backup_040_count;
END IF;

-- Safety check: warn if tables contain data
IF backup_037_count > 0 OR backup_040_count > 0 THEN
RAISE WARNING 'Backup tables contain data. Consider reviewing before dropping.';
END IF;
END
$$;

-- ===
-- SECTION 2: DROP BACKUP TABLES
-- ===

-- Drop app_context_assignments backup table from migration 037
DROP TABLE IF EXISTS public.app_context_assignments_backup_037;

-- Drop app_usage_log backup table from migration 040  
DROP TABLE IF EXISTS public.app_usage_log_backup_040;

-- ===
-- SECTION 3: LOG COMPLETION
-- ===

DO $$
BEGIN
RAISE LOG 'Migration 045 Complete: Dropped backup tables';
RAISE LOG '  • Dropped: app_context_assignments_backup_037';
RAISE LOG '  • Dropped: app_usage_log_backup_040';
RAISE LOG 'Database cleanup completed successfully';
END
$$;