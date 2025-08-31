-- Migration: Add PROFESSIONAL and CULTURAL name categories
-- Purpose: Support expanded name categorization for Step 12 context assignments
-- Status: Documenting existing enum values (already present in database)

-- Add new enum values to existing name_category type
-- Using safe DO block to check for existing values before adding
DO $$
BEGIN
-- Check and add PROFESSIONAL enum value if it doesn't exist
IF NOT EXISTS (
SELECT 1 FROM pg_enum 
WHERE enumlabel = 'PROFESSIONAL' 
AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'name_category')
) THEN
ALTER TYPE name_category ADD VALUE 'PROFESSIONAL';
RAISE LOG 'Added PROFESSIONAL enum value to name_category type';
ELSE
RAISE LOG 'PROFESSIONAL enum value already exists in name_category type';
END IF;

-- Check and add CULTURAL enum value if it doesn't exist
IF NOT EXISTS (
SELECT 1 FROM pg_enum 
WHERE enumlabel = 'CULTURAL' 
AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'name_category')
) THEN
ALTER TYPE name_category ADD VALUE 'CULTURAL';
RAISE LOG 'Added CULTURAL enum value to name_category type';
ELSE
RAISE LOG 'CULTURAL enum value already exists in name_category type';
END IF;
END $$;

-- Verify the enum values are available
DO $$
BEGIN
-- Check for PROFESSIONAL enum value
IF NOT EXISTS (
SELECT 1 FROM pg_enum 
WHERE enumlabel = 'PROFESSIONAL' 
AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'name_category')
) THEN
RAISE EXCEPTION 'PROFESSIONAL enum value was not added successfully';
END IF;

-- Check for CULTURAL enum value
IF NOT EXISTS (
SELECT 1 FROM pg_enum 
WHERE enumlabel = 'CULTURAL'
AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'name_category')
) THEN
RAISE EXCEPTION 'CULTURAL enum value was not added successfully';
END IF;

RAISE LOG 'TrueNamePath Migration 022: PROFESSIONAL and CULTURAL enum values verified successfully';
END $$;

-- Add comments for documentation
COMMENT ON TYPE name_category IS 'Name categorization enum including LEGAL, PREFERRED, NICKNAME, ALIAS, PROFESSIONAL, and CULTURAL';

-- Log successful completion
DO $$
BEGIN
RAISE LOG 'TrueNamePath Migration 022: Name category enum extension completed successfully';
RAISE LOG '✅ PROFESSIONAL enum value available';
RAISE LOG '✅ CULTURAL enum value available';
RAISE LOG '✅ All name_category enum values: LEGAL, PREFERRED, NICKNAME, ALIAS, PROFESSIONAL, CULTURAL';
RAISE LOG '🚀 Ready for Step 12 context assignment implementation';
END $$;

-- ===
-- POST-MIGRATION VALIDATION
-- ===

-- Final verification: Test that we can reference all enum values
-- Note: Skip validation in single transaction due to PostgreSQL enum safety restrictions
-- The enum values will be available after transaction commits
DO $$
BEGIN
RAISE LOG 'TrueNamePath Migration 022: Enum extension completed successfully';
RAISE LOG '✅ PROFESSIONAL and CULTURAL enum values added';
RAISE LOG '📝 Note: Full validation will occur after transaction commit';
END $$;