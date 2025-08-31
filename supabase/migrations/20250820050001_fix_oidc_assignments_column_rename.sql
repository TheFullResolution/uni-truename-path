-- ===
-- Step 15.2: OIDC Simplification - Fix Assignment Table Column Rename
-- ===
-- This migration completes the OIDC simplification by renaming the property_type
-- column to oidc_claim_type in the context_oidc_assignments table for clarity
-- ===

-- Step 1: Rename property_type to oidc_claim_type in context_oidc_assignments table
DO $$
BEGIN
-- Check if the table exists and has the old column name
IF EXISTS (
SELECT 1 
FROM information_schema.columns 
WHERE table_name = 'context_oidc_assignments' 
AND column_name = 'property_type'
AND table_schema = 'public'
) THEN
-- Rename the column
ALTER TABLE context_oidc_assignments 
RENAME COLUMN property_type TO oidc_claim_type;

RAISE NOTICE 'Renamed property_type to oidc_claim_type in context_oidc_assignments';
ELSE
RAISE NOTICE 'Column property_type not found or already renamed in context_oidc_assignments';
END IF;
END $$;

-- Step 2: Update any existing functions that reference the old column name
-- Drop the existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_oidc_assignments_for_context(UUID, UUID);

-- Recreate the function with the new column name
CREATE OR REPLACE FUNCTION get_oidc_assignments_for_context(
  p_context_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  oidc_claim_type oidc_property_type_enum,
  name_value TEXT,
  visibility_level TEXT,
  allowed_scopes TEXT[]
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Validate input
  IF p_context_id IS NULL OR p_user_id IS NULL THEN
RAISE EXCEPTION 'Context ID and User ID are required';
  END IF;
  
  -- Return assignments with name values
  RETURN QUERY
  SELECT 
coa.oidc_claim_type,
n.name_text,
coa.visibility_level,
coa.allowed_scopes
  FROM context_oidc_assignments coa
  JOIN names n ON coa.name_id = n.id
  WHERE coa.context_id = p_context_id
AND coa.user_id = p_user_id
  ORDER BY coa.oidc_claim_type;
END;
$$;

-- Step 3: Update indexes for new column name
DO $$
BEGIN
-- Drop old index if it exists
IF EXISTS (
SELECT 1 FROM pg_indexes 
WHERE indexname = 'idx_context_oidc_assignments_property_type'
AND schemaname = 'public'
) THEN
DROP INDEX idx_context_oidc_assignments_property_type;
RAISE NOTICE 'Dropped old index idx_context_oidc_assignments_property_type';
END IF;

-- Create new index with proper name
IF NOT EXISTS (
SELECT 1 FROM pg_indexes 
WHERE indexname = 'idx_context_oidc_assignments_claim_type'
AND schemaname = 'public'
) THEN
CREATE INDEX idx_context_oidc_assignments_claim_type 
ON context_oidc_assignments (oidc_claim_type);
RAISE NOTICE 'Created new index idx_context_oidc_assignments_claim_type';
END IF;
END $$;

-- Step 4: Update unique constraint to use new column name
DO $$
BEGIN
-- Drop old constraint if it exists
IF EXISTS (
SELECT 1 FROM information_schema.table_constraints 
WHERE constraint_name LIKE '%context_id%property_type%'
AND table_name = 'context_oidc_assignments'
AND table_schema = 'public'
) THEN
-- Get the actual constraint name
DECLARE
constraint_name_var TEXT;
BEGIN
SELECT constraint_name INTO constraint_name_var
FROM information_schema.table_constraints 
WHERE constraint_type = 'UNIQUE'
AND table_name = 'context_oidc_assignments'
AND table_schema = 'public'
LIMIT 1;

IF constraint_name_var IS NOT NULL THEN
EXECUTE format('ALTER TABLE context_oidc_assignments DROP CONSTRAINT %I', constraint_name_var);
RAISE NOTICE 'Dropped old unique constraint %', constraint_name_var;
END IF;
END;
END IF;

-- Create new unique constraint with proper column name
IF NOT EXISTS (
SELECT 1 FROM information_schema.table_constraints 
WHERE constraint_name = 'context_oidc_assignments_context_claim_unique'
AND table_name = 'context_oidc_assignments'
AND table_schema = 'public'
) THEN
ALTER TABLE context_oidc_assignments 
ADD CONSTRAINT context_oidc_assignments_context_claim_unique 
UNIQUE (context_id, oidc_claim_type);
RAISE NOTICE 'Created new unique constraint context_oidc_assignments_context_claim_unique';
END IF;
END $$;

-- ===
-- Documentation and Comments
-- ===

COMMENT ON TABLE context_oidc_assignments IS 
'Context-specific OIDC claim assignments. The oidc_claim_type column specifies which OIDC claim this assignment provides.';

COMMENT ON COLUMN context_oidc_assignments.oidc_claim_type IS 
'OIDC claim type (name, given_name, etc.) that this assignment provides. Renamed from property_type for clarity.';

-- Log successful completion
DO $$
BEGIN
RAISE LOG 'TrueNamePath OIDC Simplification: Assignment Column Rename COMPLETED';
RAISE LOG 'Migration 20250820050001_fix_oidc_assignments_column_rename.sql applied';
RAISE LOG 'Next step: Run yarn db:types to regenerate TypeScript types';
END $$;