-- Migration: 20250831190000_057_remove_context_visibility.sql
-- Purpose: Remove Context Visibility Concept - Simplify to Public/Other Contexts
-- Description: Remove visibility column and enum, rename default context to "Public"
-- Date: August 31, 2025
-- Impact: Simplifies context model - only one public context, others are just contexts

-- =====================================================
-- OVERVIEW & REQUIREMENTS
-- =====================================================

-- CONTEXT VISIBILITY REMOVAL:
-- This migration removes the visibility concept entirely from contexts.
-- New simplified model:
-- • PUBLIC CONTEXT: The one permanent context (is_permanent = true), renamed to "Public"
-- • OTHER CONTEXTS: All non-permanent contexts, validated only by completeness
-- • VALIDATION: Only check if context is complete (has required OIDC properties)

-- Benefits:
-- - Simpler mental model for users
-- - Cleaner codebase without complex visibility logic
-- - Maintained security through completeness validation
-- - Better UX - users don't need to understand visibility levels

-- Changes:
-- 1. Drop context_visibility enum
-- 2. Remove visibility column from user_contexts
-- 3. Drop related constraints
-- 4. Rename default context to "Public"
-- 5. Update validation functions to ignore visibility

-- =====================================================
-- SECTION 1: MIGRATION HEADER AND LOGGING
-- =====================================================

DO $$
BEGIN
RAISE LOG 'TrueNamePath Context Simplification: Starting visibility removal migration';
RAISE LOG 'Migration: 057_remove_context_visibility - Remove visibility concept entirely';
RAISE LOG 'Impact: Simplifies context model to public/other with completeness validation';
RAISE LOG 'Performance: No performance impact - removing complexity';
END
$$;

-- =====================================================
-- SECTION 2: RENAME DEFAULT CONTEXT TO PUBLIC
-- =====================================================

-- Update the permanent context name from "Default" to "Public" 
-- This makes it clear that this is the public identity context
UPDATE user_contexts 
SET 
context_name = 'Public',
description = 'Public identity context - visible to all applications'
WHERE is_permanent = true 
  AND context_name = 'Default';

-- Log the update
DO $$
DECLARE
updated_count integer;
BEGIN
SELECT COUNT(*) INTO updated_count
FROM user_contexts 
WHERE is_permanent = true AND context_name = 'Public';

RAISE LOG 'Context Visibility Removal: Renamed % default contexts to "Public"', updated_count;
END
$$;

-- =====================================================
-- SECTION 3: REMOVE VISIBILITY CONSTRAINTS
-- =====================================================

-- Drop the constraint that enforces permanent contexts to be public
-- This constraint will no longer be needed since we're removing visibility
ALTER TABLE user_contexts 
DROP CONSTRAINT IF EXISTS default_context_visibility_check;

DO $$ BEGIN
RAISE LOG 'Context Visibility Removal: Dropped default_context_visibility_check constraint';
END $$;

-- =====================================================
-- SECTION 4: REMOVE VISIBILITY COLUMN
-- =====================================================

-- Remove the visibility column from user_contexts table
-- This is the main change - removes all visibility logic
ALTER TABLE user_contexts 
DROP COLUMN IF EXISTS visibility CASCADE;

DO $$ BEGIN
RAISE LOG 'Context Visibility Removal: Dropped visibility column from user_contexts';
END $$;

-- =====================================================
-- SECTION 5: DROP CONTEXT_VISIBILITY ENUM
-- =====================================================

-- Drop the context_visibility enum type as it's no longer needed
-- CASCADE will handle any remaining dependencies
DROP TYPE IF EXISTS context_visibility CASCADE;

DO $$ BEGIN
RAISE LOG 'Context Visibility Removal: Dropped context_visibility enum type';
END $$;

-- =====================================================
-- SECTION 6: UPDATE VALIDATION FUNCTIONS (OPTIONAL CLEANUP)
-- =====================================================

-- Note: The existing completeness validation functions (is_context_complete, 
-- get_context_completeness_status) already work without visibility checks.
-- They only validate OIDC property assignments, which is exactly what we want.
-- No changes needed to these functions.

DO $$ BEGIN
RAISE LOG 'Context Visibility Removal: Validation functions unchanged - already completeness-based';
END $$;

-- =====================================================
-- SECTION 7: VERIFY MIGRATION SUCCESS
-- =====================================================

DO $$
DECLARE
visibility_column_exists boolean := false;
visibility_enum_exists boolean := false;
public_context_count integer := 0;
BEGIN
-- Check that visibility column is gone
SELECT EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_name = 'user_contexts' 
AND column_name = 'visibility'
AND table_schema = 'public'
) INTO visibility_column_exists;

-- Check that enum is gone
SELECT EXISTS (
SELECT 1 FROM pg_type 
WHERE typname = 'context_visibility'
) INTO visibility_enum_exists;

-- Check public contexts exist
SELECT COUNT(*) INTO public_context_count
FROM user_contexts 
WHERE is_permanent = true AND context_name = 'Public';

-- Validation checks
IF visibility_column_exists THEN
RAISE EXCEPTION 'Migration failed: visibility column still exists';
END IF;

IF visibility_enum_exists THEN
RAISE EXCEPTION 'Migration failed: context_visibility enum still exists';
END IF;

IF public_context_count = 0 THEN
RAISE WARNING 'No public contexts found - this may be expected for empty database';
END IF;

RAISE LOG 'Context Visibility Removal: Migration validation passed';
RAISE LOG '  - Visibility column removed: %', NOT visibility_column_exists;
RAISE LOG '  - Visibility enum removed: %', NOT visibility_enum_exists;
RAISE LOG '  - Public contexts found: %', public_context_count;
END
$$;

-- =====================================================
-- SECTION 8: MIGRATION COMPLETION SUMMARY
-- =====================================================

DO $$
BEGIN
RAISE LOG 'TrueNamePath Context Simplification: Migration 057 completed successfully';
RAISE LOG '';
RAISE LOG '✅ VISIBILITY CONCEPT REMOVED:';
RAISE LOG '  • Dropped context_visibility enum type';
RAISE LOG '  • Removed visibility column from user_contexts';
RAISE LOG '  • Dropped default_context_visibility_check constraint';
RAISE LOG '  • Renamed default contexts to "Public"';
RAISE LOG '';
RAISE LOG '✅ NEW SIMPLIFIED MODEL:';
RAISE LOG '  • PUBLIC CONTEXT: One permanent context named "Public"';
RAISE LOG '  • OTHER CONTEXTS: All non-permanent contexts';
RAISE LOG '  • VALIDATION: Only completeness matters (OIDC property assignments)';
RAISE LOG '  • OAUTH FILTERING: Based on completeness, not visibility';
RAISE LOG '';
RAISE LOG '✅ BENEFITS ACHIEVED:';
RAISE LOG '  • Simpler mental model for users';
RAISE LOG '  • Reduced codebase complexity';
RAISE LOG '  • Maintained security through completeness validation';
RAISE LOG '  • Better user experience';
RAISE LOG '';
RAISE LOG '⚠️  NEXT STEPS REQUIRED:';
RAISE LOG '  • Update API endpoints to remove visibility validation';
RAISE LOG '  • Update UI components to remove visibility selectors';
RAISE LOG '  • Update context filtering logic';
RAISE LOG '  • Regenerate database types';
RAISE LOG '  • Update test cases';
RAISE LOG '';
RAISE LOG 'Migration completed at: %', NOW();
END
$$;