-- ===
-- Migration: Remove Legacy context_name_assignments Table
-- ===
-- Purpose: Clean up unused legacy table that was replaced by context_oidc_assignments
-- Context: This table was part of Step 2 design but replaced in Step 15 with OIDC assignments
-- Impact:  OAuth filtering was checking wrong table, causing default contexts not to show
-- Author:  TrueNamePath System
-- Date:2025-08-31
-- ===

BEGIN;

-- Log the cleanup operation
DO $$
BEGIN
RAISE LOG 'TrueNamePath Legacy Cleanup: Starting removal of unused context_name_assignments table';
END
$$;

-- ===
-- STEP 1: Drop RLS policies first
-- ===

-- Drop user view policy
DROP POLICY IF EXISTS "Users can view their own context assignments" ON public.context_name_assignments;
DO $$ BEGIN
RAISE LOG 'Legacy Cleanup: Dropped view policy for context_name_assignments';
END $$;

-- Drop user create policy  
DROP POLICY IF EXISTS "Users can create their own context assignments" ON public.context_name_assignments;
DO $$ BEGIN
RAISE LOG 'Legacy Cleanup: Dropped create policy for context_name_assignments';
END $$;

-- Drop user update policy
DROP POLICY IF EXISTS "Users can update their own context assignments" ON public.context_name_assignments;
DO $$ BEGIN
RAISE LOG 'Legacy Cleanup: Dropped update policy for context_name_assignments';
END $$;

-- Drop user delete policy
DROP POLICY IF EXISTS "Users can delete their own context assignments" ON public.context_name_assignments;
DO $$ BEGIN
RAISE LOG 'Legacy Cleanup: Dropped delete policy for context_name_assignments';
END $$;

-- ===
-- STEP 2: Drop indexes for performance
-- ===

-- Drop user_id index
DROP INDEX IF EXISTS idx_context_name_assignments_user_id;
DO $$ BEGIN
RAISE LOG 'Legacy Cleanup: Dropped user_id index for context_name_assignments';
END $$;

-- Drop context_id index
DROP INDEX IF EXISTS idx_context_name_assignments_context_id;
DO $$ BEGIN
RAISE LOG 'Legacy Cleanup: Dropped context_id index for context_name_assignments';
END $$;

-- Drop name_id index
DROP INDEX IF EXISTS idx_context_name_assignments_name_id;
DO $$ BEGIN
RAISE LOG 'Legacy Cleanup: Dropped name_id index for context_name_assignments';
END $$;

-- Drop any other indexes that might exist
DROP INDEX IF EXISTS idx_context_name_assignments_oidc_property;
DROP INDEX IF EXISTS idx_context_name_assignments_unique_context;

-- ===
-- STEP 3: Drop the table itself
-- ===

-- Drop the legacy table (should be empty as it was never used)
DROP TABLE IF EXISTS public.context_name_assignments CASCADE;
DO $$ BEGIN
RAISE LOG 'Legacy Cleanup: Dropped context_name_assignments table with CASCADE';
END $$;

-- ===
-- STEP 4: Verify cleanup and log success
-- ===

-- Check that table is gone
DO $$
BEGIN
IF EXISTS (
SELECT 1 FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'context_name_assignments'
) THEN
RAISE EXCEPTION 'Legacy Cleanup: Table context_name_assignments still exists after drop';
END IF;

RAISE LOG 'Legacy Cleanup: Verified context_name_assignments table was successfully removed';
END $$;

-- ===
-- STEP 5: Documentation and completion
-- ===

-- Add comment about the cleanup (simplified - schema comments are complex)
-- Legacy Cleanup (2025-08-31): Removed unused context_name_assignments table. 
-- This table was part of Step 2 design but replaced in Step 15 with context_oidc_assignments.
-- The old table was causing OAuth filtering issues where default contexts would not show.

-- Log final success
DO $$ BEGIN
RAISE LOG 'TrueNamePath Legacy Cleanup: Successfully completed removal of context_name_assignments table';
RAISE LOG 'OAuth filtering should now work correctly with default contexts showing after signup';
END $$;

COMMIT;

-- ===
-- Migration Notes:
-- ===
-- 
-- BEFORE: OAuth filtering checked name_assignments_count from context_name_assignments
-- AFTER:  OAuth filtering uses includeUnassigned: true and relies on OIDC completeness
--
-- This fixes the issue where newly created users would see "No Complete Contexts Available" 
-- on the OAuth authorization page even when they had a properly configured default context.
--
-- The default context is created during signup with:
-- - Context: user_contexts (visibility: public, is_permanent: true)
-- - Names: names table (given_name, family_name, full_name)
-- - OIDC: context_oidc_assignments (name, given_name, family_name properties)
--
-- Now OAuth filtering correctly shows complete contexts regardless of legacy assignment counts.
-- ===