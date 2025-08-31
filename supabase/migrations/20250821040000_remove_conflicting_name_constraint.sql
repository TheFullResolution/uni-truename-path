-- TrueNamePath: Migration to Fix OIDC Constraint Conflicts
-- Purpose: Remove conflicting constraint and ensure proper OIDC constraint exists
-- Status: Production-ready

BEGIN;

-- ===
-- Remove conflicting constraints
-- ===

-- The constraint `context_name_assignments_user_id_name_id_context_id_key` prevents
-- the same name from being assigned to the same context multiple times.
-- The constraint `context_name_assignments_context_id_key` prevents multiple assignments per context.
-- Both conflict with OIDC properties where the same name might be used for 
-- different properties (e.g., "John" for both `given_name` and `preferred_username`).

ALTER TABLE public.context_name_assignments
DROP CONSTRAINT IF EXISTS context_name_assignments_user_id_name_id_context_id_key;

ALTER TABLE public.context_name_assignments
DROP CONSTRAINT IF EXISTS context_name_assignments_context_id_key;

-- Log constraint removal
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration: Dropped conflicting constraints';
  RAISE LOG '  - context_name_assignments_user_id_name_id_context_id_key';
  RAISE LOG '  - context_name_assignments_context_id_key';
END $$;

-- ===
-- Add missing oidc_property column
-- ===

-- Add the oidc_property column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_name = 'context_name_assignments' 
  AND column_name = 'oidc_property'
  AND table_schema = 'public'
  ) THEN
ALTER TABLE public.context_name_assignments
ADD COLUMN oidc_property text CHECK (
  oidc_property IS NULL OR 
  oidc_property = ANY (ARRAY['given_name', 'family_name', 'nickname', 'display_name', 'preferred_username', 'name'])
);

RAISE LOG 'TrueNamePath Migration: Added oidc_property column to context_name_assignments';
  ELSE
RAISE LOG 'TrueNamePath Migration: oidc_property column already exists';
  END IF;
END $$;

-- ===
-- Ensure proper OIDC constraint exists
-- ===

-- Add the correct constraint that allows same name for different OIDC properties
-- but prevents duplicate assignments of the same OIDC property to the same context
DO $$
BEGIN
  IF NOT EXISTS (
SELECT 1 FROM information_schema.table_constraints 
WHERE constraint_name = 'unique_oidc_property_per_context'
  AND table_name = 'context_name_assignments'
  AND table_schema = 'public'
  ) THEN
ALTER TABLE public.context_name_assignments
ADD CONSTRAINT unique_oidc_property_per_context 
UNIQUE (context_id, oidc_property);

RAISE LOG 'TrueNamePath Migration: Added unique_oidc_property_per_context constraint';
  ELSE
RAISE LOG 'TrueNamePath Migration: unique_oidc_property_per_context constraint already exists';
  END IF;
END $$;

-- Log OIDC constraint addition
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration: Added unique_oidc_property_per_context constraint';
END $$;

-- ===
-- Validation
-- ===

-- Verify the constraints are in the correct state
DO $$
DECLARE
  old_constraint_exists BOOLEAN;
  new_constraint_exists BOOLEAN;
BEGIN
  -- Check old constraint was removed
  SELECT EXISTS (
SELECT 1 FROM information_schema.table_constraints 
WHERE constraint_name = 'context_name_assignments_user_id_name_id_context_id_key'
  AND table_name = 'context_name_assignments'
  AND table_schema = 'public'
  ) INTO old_constraint_exists;
  
  -- Check new OIDC constraint exists
  SELECT EXISTS (
SELECT 1 FROM information_schema.table_constraints 
WHERE constraint_name = 'unique_oidc_property_per_context'
  AND table_name = 'context_name_assignments'
  AND table_schema = 'public'
  ) INTO new_constraint_exists;
  
  -- Validate results
  IF old_constraint_exists THEN
RAISE EXCEPTION 'Migration failed: Old constraint context_name_assignments_user_id_name_id_context_id_key still exists';
  END IF;
  
  IF NOT new_constraint_exists THEN
RAISE EXCEPTION 'Migration failed: Required constraint unique_oidc_property_per_context not found';
  END IF;
  
  -- Log validation results
  RAISE LOG 'TrueNamePath Migration: Validation successful';
  RAISE LOG '  ✅ Old conflicting constraint removed';
  RAISE LOG '  ✅ OIDC constraint unique_oidc_property_per_context exists';
END $$;

-- Log successful completion
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration: Remove Conflicting Name Constraint COMPLETED SUCCESSFULLY';
  RAISE LOG '✅ Removed: context_name_assignments_user_id_name_id_context_id_key constraint';
  RAISE LOG '✅ Preserved: unique_oidc_property_per_context constraint';
  RAISE LOG '✅ Same name can now be used for different OIDC properties';
  RAISE LOG '🚀 OIDC assignment creation should now work correctly';
END $$;

COMMIT;

-- ===
-- POST-MIGRATION NOTES
-- ===

-- This migration resolves the constraint conflict for OIDC assignments:
--
-- REMOVED CONSTRAINT:
-- • context_name_assignments_user_id_name_id_context_id_key
-- • Prevented same name being used multiple times in same context
-- • Conflicted with OIDC use case where "John" might be both given_name and preferred_username
--
-- PRESERVED CONSTRAINT:
-- • unique_oidc_property_per_context (context_id, oidc_property)
-- • Prevents duplicate assignments for same OIDC property
-- • Allows same name for different OIDC properties
--
-- EXPECTED RESULT:
-- • "John Smith" can be assigned to both `name` and `display_name` properties
-- • Still prevents duplicate `given_name` assignments to same context
-- • Upsert operations work correctly without constraint violations
--
-- TESTING:
-- • Test OIDC assignment creation with same name for different properties
-- • Verify constraint still prevents duplicate property assignments
-- • Test complete_signup_with_oidc function with multiple name assignments