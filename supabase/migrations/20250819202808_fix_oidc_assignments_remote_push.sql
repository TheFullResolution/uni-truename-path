-- Fix OIDC Assignments Remote Push
-- Handle case where table already exists on remote database
-- Date: 2025-08-19

-- Check if table exists and create safely
DO $$
BEGIN
-- Only create table if it doesn't exist
IF NOT EXISTS (SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'context_oidc_assignments') THEN

CREATE TABLE context_oidc_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  context_id UUID NOT NULL REFERENCES user_contexts(id) ON DELETE CASCADE,
  property_type oidc_property_type_enum NOT NULL,
  name_id UUID NOT NULL REFERENCES names(id) ON DELETE CASCADE,
  visibility_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD' 
CHECK (visibility_level IN ('STANDARD', 'RESTRICTED', 'PRIVATE')),
  allowed_scopes TEXT[] NOT NULL DEFAULT '{"openid","profile"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One property type per context (replace if exists)
  UNIQUE (context_id, property_type)
);

RAISE NOTICE 'Created context_oidc_assignments table';
ELSE
RAISE NOTICE 'Table context_oidc_assignments already exists, skipping creation';
END IF;
END
$$;

-- Create indexes safely
CREATE INDEX IF NOT EXISTS idx_context_oidc_assignments_user_id 
  ON context_oidc_assignments (user_id);

CREATE INDEX IF NOT EXISTS idx_context_oidc_assignments_context_id 
  ON context_oidc_assignments (context_id);

CREATE INDEX IF NOT EXISTS idx_context_oidc_assignments_property_type 
  ON context_oidc_assignments (property_type);

CREATE INDEX IF NOT EXISTS idx_context_oidc_assignments_user_context 
  ON context_oidc_assignments (user_id, context_id);

CREATE INDEX IF NOT EXISTS idx_context_oidc_assignments_allowed_scopes_gin 
  ON context_oidc_assignments USING GIN (allowed_scopes);

-- Enable RLS safely
DO $$
BEGIN
IF NOT EXISTS (
SELECT 1 FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relname = 'context_oidc_assignments'
AND c.relrowsecurity = true
) THEN
ALTER TABLE context_oidc_assignments ENABLE ROW LEVEL SECURITY;
RAISE NOTICE 'Enabled RLS on context_oidc_assignments';
ELSE
RAISE NOTICE 'RLS already enabled on context_oidc_assignments';
END IF;
END
$$;

-- Create policies safely
DO $$
BEGIN
-- Check and create user_manage_oidc_assignments policy
IF NOT EXISTS (
SELECT 1 FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'context_oidc_assignments' 
AND policyname = 'user_manage_oidc_assignments'
) THEN
CREATE POLICY user_manage_oidc_assignments 
  ON context_oidc_assignments 
  FOR ALL 
  USING (auth.uid() = user_id);
RAISE NOTICE 'Created policy user_manage_oidc_assignments';
ELSE
RAISE NOTICE 'Policy user_manage_oidc_assignments already exists';
END IF;

-- Check and create service_role_oidc_assignments policy
IF NOT EXISTS (
SELECT 1 FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'context_oidc_assignments' 
AND policyname = 'service_role_oidc_assignments'
) THEN
CREATE POLICY service_role_oidc_assignments 
  ON context_oidc_assignments 
  FOR ALL 
  USING (auth.role() = 'service_role');
RAISE NOTICE 'Created policy service_role_oidc_assignments';
ELSE
RAISE NOTICE 'Policy service_role_oidc_assignments already exists';
END IF;
END
$$;

-- Create helper functions safely
CREATE OR REPLACE FUNCTION get_oidc_assignments_for_context(
  p_context_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  property_type oidc_property_type_enum,
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
coa.property_type,
n.name_value,
coa.visibility_level,
coa.allowed_scopes
  FROM context_oidc_assignments coa
  JOIN names n ON coa.name_id = n.id
  WHERE coa.context_id = p_context_id
AND coa.user_id = p_user_id
  ORDER BY coa.property_type;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_oidc_assignment(
  p_context_id UUID,
  p_property_type oidc_property_type_enum,
  p_name_id UUID,
  p_visibility_level TEXT DEFAULT 'STANDARD',
  p_allowed_scopes TEXT[] DEFAULT '{"openid","profile"}',
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  assignment_id UUID;
BEGIN
  -- Validate input
  IF p_context_id IS NULL OR p_property_type IS NULL OR p_name_id IS NULL OR p_user_id IS NULL THEN
RAISE EXCEPTION 'All parameters are required';
  END IF;
  
  -- Upsert the assignment
  INSERT INTO context_oidc_assignments (
user_id, context_id, property_type, name_id, 
visibility_level, allowed_scopes, updated_at
  )
  VALUES (
p_user_id, p_context_id, p_property_type, p_name_id,
p_visibility_level, p_allowed_scopes, now()
  )
  ON CONFLICT (context_id, property_type)
  DO UPDATE SET
name_id = EXCLUDED.name_id,
visibility_level = EXCLUDED.visibility_level,
allowed_scopes = EXCLUDED.allowed_scopes,
updated_at = now()
  RETURNING id INTO assignment_id;
  
  RETURN assignment_id;
END;
$$;

SELECT 'Migration completed successfully - OIDC property assignments schema ensured' as notice;