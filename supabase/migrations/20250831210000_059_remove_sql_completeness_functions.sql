-- =====================================================
-- Migration: 059_remove_sql_completeness_functions
-- Description: Remove SQL-based context completeness functions
-- Author: truename-team
-- Date: 2025-08-31
-- =====================================================

-- Drop the trigger first
DROP TRIGGER IF EXISTS check_context_completeness_before_update ON user_contexts;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.check_context_completeness_before_update();

-- Drop the completeness status function
DROP FUNCTION IF EXISTS public.get_context_completeness_status(UUID);

-- Drop the simple boolean check function  
DROP FUNCTION IF EXISTS public.is_context_complete(UUID);

-- Log migration completion
DO $$
BEGIN
RAISE LOG '=== Migration 059: Remove SQL Completeness Functions ===';
RAISE LOG '✓ Removed check_context_completeness_before_update trigger';
RAISE LOG '✓ Removed check_context_completeness_before_update() function';
RAISE LOG '✓ Removed get_context_completeness_status() function';
RAISE LOG '✓ Removed is_context_complete() function';
RAISE LOG '';
RAISE LOG 'Context completeness will now be calculated in application code';
RAISE LOG 'using a three-status system: Invalid, Partial, Complete';
RAISE LOG '=== Migration Complete ===';
END $$;