-- TrueNamePath: Migration 027 - Create OIDC Property Enum
-- Purpose: Replace CHECK constraint with enum type to establish single source of truth for OIDC properties
-- Status: Production-ready
-- Issue: Frontend schema includes 7 OIDC properties but database CHECK constraint only has 6 (missing middle_name)

BEGIN;

-- ===
-- Log migration start
-- ===

DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 027: Creating OIDC Property Enum - START';
  RAISE LOG 'Issue: Database CHECK constraint missing middle_name property';
  RAISE LOG 'Solution: Replace CHECK constraint with comprehensive enum type';
END $$;

-- ===
-- Create enum with all 7 OIDC properties (including middle_name)
-- ===

-- Create enum type with all supported OIDC properties
-- This becomes the single source of truth for valid OIDC properties
CREATE TYPE oidc_property_enum AS ENUM (
  'given_name',-- First name
  'family_name',   -- Last name
  'name',  -- Full name
  'nickname',  -- Informal name
  'display_name',  -- Preferred display name
  'preferred_username',-- Username for display
  'middle_name'-- Middle name (was missing from CHECK constraint)
);

-- Log enum creation
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 027: Created oidc_property_enum with 7 properties';
  RAISE LOG '  ✅ given_name, family_name, name, nickname';
  RAISE LOG '  ✅ display_name, preferred_username, middle_name';
END $$;

-- ===
-- Replace CHECK constraint with enum type
-- ===

-- Drop the existing CHECK constraint that was missing middle_name
ALTER TABLE public.context_name_assignments
DROP CONSTRAINT IF EXISTS valid_oidc_property;

-- Log constraint removal
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 027: Removed CHECK constraint valid_oidc_property';
  RAISE LOG '  ✅ Old constraint only had 6 properties (missing middle_name)';
END $$;

-- Update column to use enum type
-- This preserves existing data and handles NULL values properly
ALTER TABLE public.context_name_assignments
ALTER COLUMN oidc_property TYPE oidc_property_enum 
USING oidc_property::oidc_property_enum;

-- Log column type update
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 027: Updated oidc_property column to use enum type';
  RAISE LOG '  ✅ Existing data preserved during type conversion';
  RAISE LOG '  ✅ NULL values handled correctly (enum allows NULL)';
END $$;

-- ===
-- Validation and verification
-- ===

-- Verify enum was created with all expected values
DO $$
DECLARE
  enum_values TEXT[];
  expected_count INTEGER := 7;
  actual_count INTEGER;
BEGIN
  -- Get all enum values
  SELECT array_agg(enumlabel ORDER BY enumsortorder)
  INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'oidc_property_enum'::regtype;
  
  -- Count values
  actual_count := array_length(enum_values, 1);
  
  -- Validate count
  IF actual_count != expected_count THEN
RAISE EXCEPTION 'TrueNamePath Migration 027: Expected % enum values, got %', expected_count, actual_count;
  END IF;
  
  -- Validate specific values exist
  IF NOT ('middle_name'::oidc_property_enum IS NOT NULL) THEN
RAISE EXCEPTION 'TrueNamePath Migration 027: middle_name not found in enum values';
  END IF;
  
  IF NOT ('given_name'::oidc_property_enum IS NOT NULL) THEN
RAISE EXCEPTION 'TrueNamePath Migration 027: given_name not found in enum values';
  END IF;
  
  -- Log validation success
  RAISE LOG 'TrueNamePath Migration 027: Enum validation successful';
  RAISE LOG '  ✅ Found % enum values: %', actual_count, array_to_string(enum_values, ', ');
  RAISE LOG '  ✅ middle_name property now available';
END $$;

-- Verify column type was updated successfully
DO $$
DECLARE
  column_type TEXT;
BEGIN
  -- Get column data type
  SELECT data_type
  INTO column_type
  FROM information_schema.columns
  WHERE table_name = 'context_name_assignments'
AND column_name = 'oidc_property'
AND table_schema = 'public';
  
  -- Validate column type
  IF column_type != 'USER-DEFINED' THEN
RAISE EXCEPTION 'TrueNamePath Migration 027: Expected USER-DEFINED type, got %', column_type;
  END IF;
  
  -- Log column validation success
  RAISE LOG 'TrueNamePath Migration 027: Column type validation successful';
  RAISE LOG '  ✅ oidc_property column now uses oidc_property_enum type';
END $$;

-- Test enum functionality with all values including middle_name
DO $$
DECLARE
  test_value oidc_property_enum;
BEGIN
  -- Test middle_name (the previously missing value)
  test_value := 'middle_name'::oidc_property_enum;
  RAISE LOG 'TrueNamePath Migration 027: middle_name enum value test successful';
  
  -- Test other critical values
  test_value := 'given_name'::oidc_property_enum;
  test_value := 'family_name'::oidc_property_enum;
  
  RAISE LOG '  ✅ All enum values functional and accessible';
END $$;

-- ===
-- Migration completion and summary
-- ===

-- Log successful completion
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 027: OIDC Property Enum Creation COMPLETED SUCCESSFULLY';
  RAISE LOG '✅ Created oidc_property_enum with all 7 OIDC properties';
  RAISE LOG '✅ Replaced CHECK constraint with enum type validation';
  RAISE LOG '✅ middle_name property now supported (was missing from CHECK constraint)';
  RAISE LOG '✅ Existing data preserved during type conversion';
  RAISE LOG '✅ NULL values continue to work correctly';
  RAISE LOG '🚀 Database enum is now single source of truth for OIDC properties';
END $$;

COMMIT;

-- ===
-- POST-MIGRATION NOTES
-- ===

-- This migration establishes the database enum as the authoritative source for OIDC properties:
--
-- KEY IMPROVEMENTS:
-- ✅ Added missing middle_name property (was causing constraint violations)
-- ✅ Enum type provides better type safety than CHECK constraint
-- ✅ Single source of truth for OIDC property validation
-- ✅ Foundation for frontend to import generated enum types
-- ✅ Backward compatible - all existing data preserved
--
-- ENUM VALUES (7 total):
-- • given_name - First name
-- • family_name - Last name
-- • name - Full name
-- • nickname - Informal name
-- • display_name - Preferred display name
-- • preferred_username - Username for display
-- • middle_name - Middle name (NEW - was missing from CHECK constraint)
--
-- TECHNICAL BENEFITS:
-- • PostgreSQL enum provides native type validation
-- • Better performance than CHECK constraint
-- • Type-safe in database queries and functions
-- • Automatically exported to TypeScript through generated types
-- • Prevents typos and invalid values at database level
--
-- TESTING VERIFICATION:
-- • Test that middle_name assignments no longer cause constraint violations
-- • Verify all 7 OIDC properties work in complete_signup_with_oidc function
-- • Test frontend OIDC assignment UI with all property types
-- • Confirm generated TypeScript types include all enum values
--
-- NEXT STEPS:
-- • Run `yarn db:types` to regenerate TypeScript types with new enum
-- • Update frontend to import enum from generated types for consistency
-- • Test OIDC assignments with middle_name property