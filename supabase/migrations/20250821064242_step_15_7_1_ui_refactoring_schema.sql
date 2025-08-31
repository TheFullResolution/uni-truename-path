-- Step 15.7.1: UI Refactoring Database Schema Migration
-- This migration implements the comprehensive schema refactoring for TrueNamePath
-- Focus: Clean up existing scope complexity, introduce simplified context visibility

-- ===
-- SECTION 1: CLEANUP EXISTING CONFLICTING SCHEMAS
-- ===

-- Drop existing context_oidc_assignments table completely
-- This table had scope/visibility complexity that needs to be simplified
DROP TABLE IF EXISTS context_oidc_assignments CASCADE;

-- Drop the old oidc_property_type_enum (will be recreated with cleaner name)
DROP TYPE IF EXISTS oidc_property_type_enum CASCADE;

-- Clean up any scope validation functions if they exist
-- These functions were part of the complex scope validation system
DROP FUNCTION IF EXISTS validate_oidc_scopes(text[]) CASCADE;
DROP FUNCTION IF EXISTS check_scope_access(text, text[]) CASCADE;

-- ===
-- SECTION 2: CREATE NEW SIMPLIFIED ENUMS
-- ===

-- Context visibility enum - single source of truth for visibility control
CREATE TYPE context_visibility AS ENUM ('public', 'restricted', 'private');

-- OIDC property enum - simplified and clean naming
CREATE TYPE oidc_property AS ENUM (
  'given_name', 
  'family_name', 
  'name', 
  'nickname', 
  'display_name', 
  'preferred_username', 
  'middle_name'
);

-- ===
-- SECTION 3: UPDATE USER_CONTEXTS TABLE
-- ===

-- Add visibility column to user_contexts with default 'restricted'
ALTER TABLE user_contexts 
ADD COLUMN visibility context_visibility NOT NULL DEFAULT 'restricted';

-- Add is_permanent column to identify default contexts (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_name = 'user_contexts' 
AND column_name = 'is_permanent'
AND table_schema = 'public'
  ) THEN
ALTER TABLE user_contexts 
ADD COLUMN is_permanent boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add Note: default context must be public if permanent
ALTER TABLE user_contexts 
ADD CONSTRAINT default_context_visibility_check 
CHECK (
  NOT is_permanent OR visibility = 'public'
);

-- Add partial unique Note: only one permanent context per user
-- This allows multiple non-permanent contexts but ensures only one default
CREATE UNIQUE INDEX unique_permanent_context_per_user 
ON user_contexts (user_id) 
WHERE is_permanent = true;

-- Add comment explaining the visibility system
COMMENT ON COLUMN user_contexts.visibility IS 
'Context visibility: public (accessible to all), restricted (user approval), private (explicit consent only)';

COMMENT ON COLUMN user_contexts.is_permanent IS 
'Marks system-managed default contexts that cannot be deleted by users';

-- ===
-- SECTION 4: CREATE SIMPLIFIED ASSIGNMENT TABLE
-- ===

-- Create new context_oidc_assignments table with simplified structure
-- No scope complexity, just direct property assignments
CREATE TABLE context_oidc_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  context_id uuid NOT NULL REFERENCES user_contexts(id) ON DELETE CASCADE,
  oidc_property oidc_property NOT NULL,
  name_id uuid NOT NULL REFERENCES names(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure only one assignment per property per context
  UNIQUE(context_id, oidc_property)
);

-- Add helpful comments
COMMENT ON TABLE context_oidc_assignments IS 
'Simplified OIDC property assignments: maps context + property type to specific names';

COMMENT ON COLUMN context_oidc_assignments.oidc_property IS 
'OIDC standard property type (name, given_name, etc.) for this assignment';

-- ===
-- SECTION 5: CREATE INDEXES FOR PERFORMANCE
-- ===

-- Performance indexes for common query patterns
CREATE INDEX idx_context_oidc_assignments_user_context 
ON context_oidc_assignments(user_id, context_id);

CREATE INDEX idx_context_oidc_assignments_property 
ON context_oidc_assignments(oidc_property);

CREATE INDEX idx_user_contexts_visibility 
ON user_contexts(visibility);

CREATE INDEX idx_user_contexts_permanent 
ON user_contexts(user_id, is_permanent) 
WHERE is_permanent = true;

-- ===
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ===

-- Enable RLS on the new table
ALTER TABLE context_oidc_assignments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own assignments
CREATE POLICY "Users can manage their own OIDC assignments" 
ON context_oidc_assignments
FOR ALL
TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- Update RLS policies on user_contexts for new columns
-- Users can see public contexts from others, but only manage their own
DROP POLICY IF EXISTS "Users can view public contexts" ON user_contexts;
CREATE POLICY "Users can view public contexts" 
ON user_contexts
FOR SELECT
TO authenticated
USING (
  auth.uid()::uuid = user_id OR 
  visibility = 'public'
);

DROP POLICY IF EXISTS "Users can manage their own contexts" ON user_contexts;
CREATE POLICY "Users can manage their own contexts" 
ON user_contexts
FOR ALL
TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- ===
-- SECTION 7: UPDATE TRIGGERS
-- ===

-- Create trigger for updated_at on context_oidc_assignments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_context_oidc_assignments_updated_at 
BEFORE UPDATE ON context_oidc_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===
-- SECTION 8: CLEANUP OLD SCOPE REFERENCES
-- ===

-- Remove any scope-related columns from existing tables if they exist
-- This ensures no leftover scope complexity

-- Clean up names table - remove oidc_property_type column if it references old enum
DO $$ 
BEGIN
  IF EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_name = 'names' 
AND column_name = 'oidc_property_type'
AND table_schema = 'public'
  ) THEN
ALTER TABLE names DROP COLUMN oidc_property_type CASCADE;
  END IF;
END $$;

-- Keep oidc_property column in context_name_assignments table (needed for get_context_oidc_claims function)
-- Note: Previously this migration dropped oidc_property, but it's required for OAuth integration

-- ===
-- SECTION 9: VALIDATION AND VERIFICATION
-- ===

-- Verify the new structure is in place
DO $$ 
BEGIN
  -- Check that new enums exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'context_visibility') THEN
RAISE EXCEPTION 'context_visibility enum was not created properly';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'oidc_property') THEN
RAISE EXCEPTION 'oidc_property enum was not created properly';
  END IF;
  
  -- Check that new table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'context_oidc_assignments') THEN
RAISE EXCEPTION 'context_oidc_assignments table was not created properly';
  END IF;
  
  -- Check that user_contexts has new columns
  IF NOT EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_name = 'user_contexts' 
AND column_name = 'visibility'
  ) THEN
RAISE EXCEPTION 'user_contexts.visibility column was not created properly';
  END IF;
  
  IF NOT EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_name = 'user_contexts' 
AND column_name = 'is_permanent'
  ) THEN
RAISE EXCEPTION 'user_contexts.is_permanent column was not created properly';
  END IF;
  
  RAISE NOTICE 'Step 15.7.1 UI Refactoring Schema Migration completed successfully';
END $$;