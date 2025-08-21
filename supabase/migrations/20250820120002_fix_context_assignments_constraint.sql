-- TrueNamePath: Migration 026 - Fix Context Assignments Constraint
-- Date: August 20, 2025  
-- Purpose: Remove unique constraint on context_id to allow multiple OIDC property assignments per context
-- Status: Production-ready

BEGIN;

-- =============================================================================
-- Remove the unique constraint that prevents multiple assignments per context
-- =============================================================================

-- Drop the constraint that only allows one assignment per context
-- This was preventing OIDC properties from working correctly
ALTER TABLE public.context_name_assignments 
DROP CONSTRAINT IF EXISTS context_name_assignments_context_id_key;

-- Log constraint removal
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 026: Removed context_name_assignments_context_id_key constraint';
  RAISE LOG '✅ Multiple name assignments per context now allowed (required for OIDC properties)';
END $$;

-- =============================================================================
-- Add new constraint to ensure unique OIDC property assignments per context
-- =============================================================================

-- Add constraint to ensure only one assignment per OIDC property per context
-- This replaces the old constraint but allows multiple different properties
ALTER TABLE public.context_name_assignments
ADD CONSTRAINT unique_oidc_property_per_context 
UNIQUE (context_id, oidc_property)
DEFERRABLE INITIALLY DEFERRED;

-- Log new constraint addition
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 026: Added unique_oidc_property_per_context constraint';
  RAISE LOG '✅ Only one assignment per OIDC property type per context allowed';
END $$;

-- =============================================================================
-- Validation and completion
-- =============================================================================

-- Validate migration success
DO $$
DECLARE
  old_constraint_exists BOOLEAN;
  new_constraint_exists BOOLEAN;
BEGIN
  -- Check old constraint was removed
  SELECT EXISTS (
SELECT 1 FROM information_schema.table_constraints 
WHERE constraint_name = 'context_name_assignments_context_id_key'
  AND table_name = 'context_name_assignments'
  ) INTO old_constraint_exists;
  
  -- Check new constraint was created
  SELECT EXISTS (
SELECT 1 FROM information_schema.table_constraints 
WHERE constraint_name = 'unique_oidc_property_per_context'
  AND table_name = 'context_name_assignments'
  ) INTO new_constraint_exists;
  
  -- Validate results
  IF old_constraint_exists THEN
RAISE EXCEPTION 'TrueNamePath Migration 026: Old constraint context_name_assignments_context_id_key still exists';
  END IF;
  
  IF NOT new_constraint_exists THEN
RAISE EXCEPTION 'TrueNamePath Migration 026: New constraint unique_oidc_property_per_context not found';
  END IF;
  
  -- Log validation results
  RAISE LOG 'TrueNamePath Migration 026: Validation successful';
  RAISE LOG '  ✅ Old constraint removed: context_name_assignments_context_id_key';
  RAISE LOG '  ✅ New constraint created: unique_oidc_property_per_context';

END $$;

-- Log successful completion
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 026: Context Assignments Constraint Fix COMPLETED SUCCESSFULLY';
  RAISE LOG '✅ Removed problematic unique constraint on context_id';
  RAISE LOG '✅ Added appropriate constraint for OIDC property uniqueness';
  RAISE LOG '✅ Multiple name assignments per context now possible';
  RAISE LOG '🚀 OIDC function should now work correctly with multiple properties per context';
END $$;

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================

-- This migration fixes the context assignments constraint issue:
--
-- KEY FIXES:
-- ✅ Removed unique constraint on context_id that prevented multiple assignments
-- ✅ Added unique constraint on (context_id, oidc_property) for proper OIDC support
-- ✅ Multiple names can now be assigned to same context with different OIDC properties
-- ✅ Prevents duplicate assignments of the same OIDC property to same context
--
-- CONSTRAINT DETAILS:
-- • Old: UNIQUE (context_id) - only one assignment per context (too restrictive)
-- • New: UNIQUE (context_id, oidc_property) - one assignment per property per context
--
-- OIDC SUPPORT:
-- • given_name, family_name, nickname, display_name can all be assigned to same context
-- • Each property type can only have one assignment per context
-- • Supports complete_signup_with_oidc function requirements
--
-- TESTING:
-- • Test complete_signup_with_oidc function with multiple names
-- • Verify only one assignment per OIDC property type per context
-- • Test context assignment UI with multiple name assignments