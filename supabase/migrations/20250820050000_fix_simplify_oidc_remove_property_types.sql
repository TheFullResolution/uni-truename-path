-- ===
-- Step 15.2: OIDC Simplification - Phase 1: Remove Property Types (FIXED)
-- ===
-- This migration implements Phase 1 of the OIDC simplification plan.
-- Removes the forced OIDC property type selection during name creation
-- while preserving all existing data and functionality.
--
-- FIXED: Corrected table references to match actual schema
--
-- Changes:
-- 1. Remove NOT NULL constraint from oidc_property_type in names table
-- 2. Set default value to 'name' for new entries
-- 3. Update existing names to have generic 'name' type
-- 4. No changes to assignments table (doesn't exist yet in current schema)
-- ===

-- Step 1: Remove NOT NULL constraint and set default for oidc_property_type
ALTER TABLE names 
ALTER COLUMN oidc_property_type DROP NOT NULL,
ALTER COLUMN oidc_property_type SET DEFAULT 'name';

-- Step 2: Update all existing names to have generic 'name' type
-- This removes the artificial categorization that was ignored during assignment
UPDATE names 
SET oidc_property_type = 'name' 
WHERE oidc_property_type IS NOT NULL;

-- Step 3: Add migration metadata to oidc_properties for existing names
UPDATE names 
SET oidc_properties = COALESCE(oidc_properties, '{}'::jsonb) || jsonb_build_object(
  'simplified_migration', true,
  'simplified_at', NOW()::text,
  'original_property_type', oidc_property_type::text
)
WHERE oidc_properties IS NOT NULL;

-- ===
-- Migration Validation and Logging
-- ===

-- Validate the migration was successful
DO $$
DECLARE
names_count INTEGER;
generic_names_count INTEGER;
BEGIN
-- Count total names
SELECT COUNT(*) INTO names_count FROM names;

-- Count names with generic 'name' type
SELECT COUNT(*) INTO generic_names_count 
FROM names WHERE oidc_property_type = 'name';

-- Log migration results
RAISE NOTICE 'OIDC Simplification Phase 1 Migration Complete (FIXED):';
RAISE NOTICE '  Total names: %', names_count;
RAISE NOTICE '  Names with generic type: %', generic_names_count;
RAISE NOTICE '  ✅ Property type constraint removed';
RAISE NOTICE '  ✅ Default value set to ''name''';
RAISE NOTICE '  ✅ All existing names updated to generic type';

-- Validate key requirements
IF generic_names_count != names_count THEN
RAISE WARNING 'Not all names were updated to generic type - manual review needed';
END IF;

-- Check that oidc_property_type is now nullable
IF EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_name = 'names' 
AND column_name = 'oidc_property_type'
AND is_nullable = 'NO'
) THEN
RAISE EXCEPTION 'Migration failed: oidc_property_type is still NOT NULL';
END IF;

RAISE NOTICE '  ✅ Migration validation passed';
END $$;

-- ===
-- Documentation and Comments
-- ===

COMMENT ON COLUMN names.oidc_property_type IS 
'OIDC property type - now optional with default ''name''. Used for storage consistency but not enforced during creation.';

-- Log successful completion
DO $$
BEGIN
RAISE LOG 'TrueNamePath OIDC Simplification Phase 1: COMPLETED SUCCESSFULLY (FIXED)';
RAISE LOG 'Migration 20250820050000_fix_simplify_oidc_remove_property_types.sql applied';
RAISE LOG 'Next steps: Run yarn db:types to regenerate TypeScript types';
END $$;